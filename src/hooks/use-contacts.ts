import { createClient } from "@/lib/supabase/client";
import {
  Contact,
  ContactFilters,
  ContactInsert,
  ContactType,
  ContactUpdate,
  PaginationMeta,
  PaginationOptions,
  SortField,
  SortOrder,
} from "@/types/hooks/use-contacts";
import { useCallback, useEffect, useReducer, useRef } from "react";

const supabase = createClient();

interface ContactsState {
  contacts: Contact[];
  pagination: PaginationMeta;
  filters: ContactFilters;
  loading: boolean;
  error: string | null;
  // per-operation loading flags
  creating: boolean;
  updating: string | null; // contact id being updated
  deleting: string | null; // contact id being deleted
  // for bulk ops
  bulkDeleting: boolean;
}

type ContactsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { contacts: Contact[]; total: number } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SET_FILTERS"; payload: ContactFilters }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_LIMIT"; payload: number }
  | { type: "CREATE_START" }
  | { type: "CREATE_SUCCESS"; payload: Contact }
  | { type: "CREATE_ERROR"; payload: string }
  | { type: "UPDATE_START"; payload: string }
  | { type: "UPDATE_SUCCESS"; payload: Contact }
  | { type: "UPDATE_ERROR"; payload: string }
  | { type: "DELETE_START"; payload: string }
  | { type: "DELETE_SUCCESS"; payload: string }
  | { type: "DELETE_ERROR"; payload: string }
  | { type: "BULK_DELETE_START" }
  | { type: "BULK_DELETE_SUCCESS"; payload: string[] }
  | { type: "BULK_DELETE_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

// ============================================================
//  CONSTANTS
// ============================================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const DEFAULT_FILTERS: ContactFilters = {
  sortField: "name",
  sortOrder: "asc",
};

// ============================================================
//  REDUCER
// ============================================================

function reducer(state: ContactsState, action: ContactsAction): ContactsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS": {
      const { contacts, total } = action.payload;
      const { page, limit } = state.pagination;
      const totalPages = Math.ceil(total / limit);
      return {
        ...state,
        loading: false,
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 }, // reset to page 1 on filter change
      };

    case "SET_PAGE":
      return {
        ...state,
        pagination: { ...state.pagination, page: action.payload },
      };

    case "SET_LIMIT":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          limit: Math.min(action.payload, MAX_LIMIT),
          page: 1,
        },
      };

    case "CREATE_START":
      return { ...state, creating: true, error: null };

    case "CREATE_SUCCESS":
      return {
        ...state,
        creating: false,
        contacts: [action.payload, ...state.contacts],
        pagination: { ...state.pagination, total: state.pagination.total + 1 },
      };

    case "CREATE_ERROR":
      return { ...state, creating: false, error: action.payload };

    case "UPDATE_START":
      return { ...state, updating: action.payload, error: null };

    case "UPDATE_SUCCESS":
      return {
        ...state,
        updating: null,
        contacts: state.contacts.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };

    case "UPDATE_ERROR":
      return { ...state, updating: null, error: action.payload };

    case "DELETE_START":
      return { ...state, deleting: action.payload, error: null };

    case "DELETE_SUCCESS":
      return {
        ...state,
        deleting: null,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
        pagination: { ...state.pagination, total: state.pagination.total - 1 },
      };

    case "DELETE_ERROR":
      return { ...state, deleting: null, error: action.payload };

    case "BULK_DELETE_START":
      return { ...state, bulkDeleting: true, error: null };

    case "BULK_DELETE_SUCCESS":
      return {
        ...state,
        bulkDeleting: false,
        contacts: state.contacts.filter((c) => !action.payload.includes(c.id)),
        pagination: {
          ...state.pagination,
          total: state.pagination.total - action.payload.length,
        },
      };

    case "BULK_DELETE_ERROR":
      return { ...state, bulkDeleting: false, error: action.payload };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

// ============================================================
//  INITIAL STATE
// ============================================================

function initialState(
  filters: ContactFilters,
  pagination: PaginationOptions,
): ContactsState {
  return {
    contacts: [],
    pagination: {
      ...DEFAULT_PAGINATION,
      page: pagination.page ?? 1,
      limit: Math.min(pagination.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
    },
    filters: { ...DEFAULT_FILTERS, ...filters },
    loading: false,
    error: null,
    creating: false,
    updating: null,
    deleting: null,
    bulkDeleting: false,
  };
}

// ============================================================
//  HOOK
// ============================================================

interface UseContactsOptions {
  filters?: ContactFilters;
  pagination?: PaginationOptions;
  enabled?: boolean; // set false to skip auto-fetch
}

interface UseContactsReturn {
  // data
  contacts: Contact[];
  pagination: PaginationMeta;
  filters: ContactFilters;

  // status
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
  bulkDeleting: boolean;

  // filter & pagination controls
  setFilters: (filters: ContactFilters) => void;
  setSearch: (search: string) => void;
  setType: (type: ContactType | undefined) => void;
  setCategory: (category: string | undefined) => void;
  setActiveStatus: (is_active: boolean | undefined) => void;
  setSort: (field: SortField, order?: SortOrder) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetFilters: () => void;

  // CRUD
  createContact: (data: ContactInsert) => Promise<Contact | null>;
  updateContact: (id: string, data: ContactUpdate) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  bulkDeleteContacts: (ids: string[]) => Promise<boolean>;
  toggleActive: (id: string) => Promise<Contact | null>;

  // utils
  refetch: () => void;
  clearError: () => void;
  getContactById: (id: string) => Contact | undefined;
}

export function useContacts(
  options: UseContactsOptions = {},
): UseContactsReturn {
  const {
    filters: initFilters = {},
    pagination: initPagination = {},
    enabled = true,
  } = options;

  const [state, dispatch] = useReducer(
    reducer,
    initialState(initFilters, initPagination),
  );

  // track mounted state to avoid state updates on unmounted component
  const mountedRef = useRef(true);
  const paginationRef = useRef(state.pagination);
  const filtersRef = useRef(state.filters);

  // keep refs in sync on every render — no re-render cost
  paginationRef.current = state.pagination;
  filtersRef.current = state.filters;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Fetch ────────────────────────────────────────────────
  // FIX: reads pagination/filters via refs so dep array stays
  // [enabled] — no new function ref on every filter/page change.

  const fetchContacts = useCallback(async () => {
    if (!enabled) return;

    dispatch({ type: "FETCH_START" });

    try {
      const { page, limit } = paginationRef.current;
      const { search, type, category, is_active, sortField, sortOrder } =
        filtersRef.current;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase.from("contacts").select("*", { count: "exact" });

      // ── filters ─────────────────────────────────────────
      if (search && search.trim() !== "") {
        // full-text search across name, email, company, phone
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`,
        );
      }

      if (type) query = query.eq("type", type);
      if (category) query = query.ilike("category", `%${category}%`);
      if (is_active !== undefined) query = query.eq("is_active", is_active);

      // ── sort ─────────────────────────────────────────────
      query = query.order(sortField ?? "name", {
        ascending: sortOrder !== "desc",
      });

      // ── pagination ───────────────────────────────────────
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!mountedRef.current) return;

      if (error) throw error;

      dispatch({
        type: "FETCH_SUCCESS",
        payload: { contacts: (data as Contact[]) ?? [], total: count ?? 0 },
      });
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to fetch contacts";
      dispatch({ type: "FETCH_ERROR", payload: message });
    }
  }, [enabled]); // stable — refs handle the changing values

  // FIX: watch specific values instead of fetchContacts to avoid loop
  useEffect(() => {
    fetchContacts();
  }, [
    fetchContacts,
    state.pagination.page,
    state.pagination.limit,
    state.filters,
  ]);

  // ── Create ───────────────────────────────────────────────

  const createContact = useCallback(
    async (data: ContactInsert): Promise<Contact | null> => {
      dispatch({ type: "CREATE_START" });
      try {
        const { data: created, error } = await supabase
          .from("contacts")
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        dispatch({ type: "CREATE_SUCCESS", payload: created as Contact });
        return created as Contact;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create contact";
        dispatch({ type: "CREATE_ERROR", payload: message });
        return null;
      }
    },
    [],
  );

  // ── Update ───────────────────────────────────────────────

  const updateContact = useCallback(
    async (id: string, data: ContactUpdate): Promise<Contact | null> => {
      dispatch({ type: "UPDATE_START", payload: id });
      try {
        const { data: updated, error } = await supabase
          .from("contacts")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        dispatch({ type: "UPDATE_SUCCESS", payload: updated as Contact });
        return updated as Contact;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update contact";
        dispatch({ type: "UPDATE_ERROR", payload: message });
        return null;
      }
    },
    [],
  );

  // ── Delete ───────────────────────────────────────────────

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: "DELETE_START", payload: id });
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);

      if (error) throw error;

      dispatch({ type: "DELETE_SUCCESS", payload: id });
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete contact";
      dispatch({ type: "DELETE_ERROR", payload: message });
      return false;
    }
  }, []);

  // ── Bulk Delete ──────────────────────────────────────────

  const bulkDeleteContacts = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (ids.length === 0) return true;
      dispatch({ type: "BULK_DELETE_START" });
      try {
        const { error } = await supabase
          .from("contacts")
          .delete()
          .in("id", ids);

        if (error) throw error;

        dispatch({ type: "BULK_DELETE_SUCCESS", payload: ids });
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete contacts";
        dispatch({ type: "BULK_DELETE_ERROR", payload: message });
        return false;
      }
    },
    [],
  );

  // ── Toggle Active ────────────────────────────────────────

  const getContactById = useCallback(
    (id: string): Contact | undefined => {
      return state.contacts.find((c) => c.id === id);
    },
    [state.contacts],
  );

  const toggleActive = useCallback(
    async (id: string): Promise<Contact | null> => {
      // FIX: use getContactById which already tracks state.contacts
      const contact = getContactById(id);
      if (!contact) return null;
      return updateContact(id, { is_active: !contact.is_active });
    },
    [getContactById, updateContact],
  );

  // ── Filter & Pagination Helpers ──────────────────────────

  const setFilters = useCallback((filters: ContactFilters) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const setSearch = useCallback((search: string) => {
    dispatch({ type: "SET_FILTERS", payload: { search } });
  }, []);

  const setType = useCallback((type: ContactType | undefined) => {
    dispatch({ type: "SET_FILTERS", payload: { type } });
  }, []);

  const setCategory = useCallback((category: string | undefined) => {
    dispatch({ type: "SET_FILTERS", payload: { category } });
  }, []);

  const setActiveStatus = useCallback((is_active: boolean | undefined) => {
    dispatch({ type: "SET_FILTERS", payload: { is_active } });
  }, []);

  const setSort = useCallback((field: SortField, order: SortOrder = "asc") => {
    dispatch({
      type: "SET_FILTERS",
      payload: { sortField: field, sortOrder: order },
    });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: "SET_PAGE", payload: Math.max(1, page) });
  }, []);

  const setLimit = useCallback((limit: number) => {
    dispatch({ type: "SET_LIMIT", payload: limit });
  }, []);

  const nextPage = useCallback(() => {
    if (state.pagination.hasNextPage) {
      dispatch({ type: "SET_PAGE", payload: state.pagination.page + 1 });
    }
  }, [state.pagination]);

  const prevPage = useCallback(() => {
    if (state.pagination.hasPrevPage) {
      dispatch({ type: "SET_PAGE", payload: state.pagination.page - 1 });
    }
  }, [state.pagination]);

  const resetFilters = useCallback(() => {
    dispatch({ type: "SET_FILTERS", payload: DEFAULT_FILTERS });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // ── Return ───────────────────────────────────────────────

  return {
    contacts: state.contacts,
    pagination: state.pagination,
    filters: state.filters,
    loading: state.loading,
    error: state.error,
    creating: state.creating,
    updating: state.updating,
    deleting: state.deleting,
    bulkDeleting: state.bulkDeleting,

    setFilters,
    setSearch,
    setType,
    setCategory,
    setActiveStatus,
    setSort,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    resetFilters,

    createContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts,
    toggleActive,

    refetch: fetchContacts,
    clearError,
    getContactById,
  };
}
