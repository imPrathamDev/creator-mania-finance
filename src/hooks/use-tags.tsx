import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  PaginationMeta,
  PaginationOptions,
  SortOrder,
  Tag,
  TagFilters,
  TagInsert,
  TagSortField,
  TagUpdate,
} from "../types/hooks/use-tags";
import { createClient } from "@/lib/supabase/client";
interface TagsState {
  tags: Tag[];
  pagination: PaginationMeta;
  filters: TagFilters;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
  bulkDeleting: boolean;
}

type TagsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { tags: Tag[]; total: number } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SET_FILTERS"; payload: TagFilters }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_LIMIT"; payload: number }
  | { type: "CREATE_START" }
  | { type: "CREATE_SUCCESS"; payload: Tag }
  | { type: "CREATE_ERROR"; payload: string }
  | { type: "UPDATE_START"; payload: string }
  | { type: "UPDATE_SUCCESS"; payload: Tag }
  | { type: "UPDATE_ERROR"; payload: string }
  | { type: "DELETE_START"; payload: string }
  | { type: "DELETE_SUCCESS"; payload: string }
  | { type: "DELETE_ERROR"; payload: string }
  | { type: "BULK_DELETE_START" }
  | { type: "BULK_DELETE_SUCCESS"; payload: string[] }
  | { type: "BULK_DELETE_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

const DEFAULT_LIMIT = 50; // tags lists are usually shown all at once
const MAX_LIMIT = 200;

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const DEFAULT_FILTERS: TagFilters = { sortField: "name", sortOrder: "asc" };

// ============================================================
//  REDUCER
// ============================================================

function buildPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

function reducer(state: TagsState, action: TagsAction): TagsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        tags: action.payload.tags,
        pagination: buildPagination(
          state.pagination.page,
          state.pagination.limit,
          action.payload.total,
        ),
      };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 },
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
        tags: [action.payload, ...state.tags],
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
        tags: state.tags.map((t) =>
          t.id === action.payload.id ? action.payload : t,
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
        tags: state.tags.filter((t) => t.id !== action.payload),
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
        tags: state.tags.filter((t) => !action.payload.includes(t.id)),
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
//  HOOK
// ============================================================

interface UseTagsOptions {
  filters?: TagFilters;
  pagination?: PaginationOptions;
  enabled?: boolean;
}

export interface UseTagsReturn {
  tags: Tag[];
  pagination: PaginationMeta;
  filters: TagFilters;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
  bulkDeleting: boolean;

  setSearch: (search: string) => void;
  setSort: (field: TagSortField, order?: SortOrder) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetFilters: () => void;

  createTag: (data: TagInsert) => Promise<Tag | null>;
  updateTag: (id: string, data: TagUpdate) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
  bulkDeleteTags: (ids: string[]) => Promise<boolean>;

  refetch: () => void;
  clearError: () => void;
  getTagById: (id: string) => Tag | undefined;
}

export function useTags(options: UseTagsOptions = {}): UseTagsReturn {
  const {
    filters: initFilters = {},
    pagination: initPagination = {},
    enabled = true,
  } = options;

  const [state, dispatch] = useReducer(reducer, {
    tags: [],
    pagination: {
      ...DEFAULT_PAGINATION,
      page: initPagination.page ?? 1,
      limit: Math.min(initPagination.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
    },
    filters: { ...DEFAULT_FILTERS, ...initFilters },
    loading: false,
    error: null,
    creating: false,
    updating: null,
    deleting: null,
    bulkDeleting: false,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Fetch ────────────────────────────────────────────────

  const fetchTags = useCallback(async () => {
    if (!enabled) return;
    dispatch({ type: "FETCH_START" });
    try {
      const { page, limit } = state.pagination;
      const { search, sortField, sortOrder } = state.filters;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const supabase = createClient();
      let query = supabase.from("tags").select("*", { count: "exact" });

      if (search?.trim()) {
        query = query.ilike("name", `%${search}%`);
      }

      query = query
        .order(sortField ?? "name", { ascending: sortOrder !== "desc" })
        .range(from, to);

      const { data, error, count } = await query;
      if (!mountedRef.current) return;
      if (error) throw error;
      dispatch({
        type: "FETCH_SUCCESS",
        payload: { tags: (data as Tag[]) ?? [], total: count ?? 0 },
      });
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      dispatch({
        type: "FETCH_ERROR",
        payload: err instanceof Error ? err.message : "Failed to fetch tags",
      });
    }
  }, [enabled, state.pagination, state.filters]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // ── CRUD ─────────────────────────────────────────────────

  const createTag = useCallback(
    async (data: TagInsert): Promise<Tag | null> => {
      dispatch({ type: "CREATE_START" });
      try {
        const supabase = createClient();
        const { data: created, error } = await supabase
          .from("tags")
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        dispatch({ type: "CREATE_SUCCESS", payload: created as Tag });
        return created as Tag;
      } catch (err: unknown) {
        dispatch({
          type: "CREATE_ERROR",
          payload: err instanceof Error ? err.message : "Failed to create tag",
        });
        return null;
      }
    },
    [],
  );

  const updateTag = useCallback(
    async (id: string, data: TagUpdate): Promise<Tag | null> => {
      dispatch({ type: "UPDATE_START", payload: id });
      try {
        const supabase = createClient();

        const { data: updated, error } = await supabase
          .from("tags")
          .update(data)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        dispatch({ type: "UPDATE_SUCCESS", payload: updated as Tag });
        return updated as Tag;
      } catch (err: unknown) {
        dispatch({
          type: "UPDATE_ERROR",
          payload: err instanceof Error ? err.message : "Failed to update tag",
        });
        return null;
      }
    },
    [],
  );

  const deleteTag = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: "DELETE_START", payload: id });
    try {
      const supabase = createClient();

      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
      dispatch({ type: "DELETE_SUCCESS", payload: id });
      return true;
    } catch (err: unknown) {
      dispatch({
        type: "DELETE_ERROR",
        payload: err instanceof Error ? err.message : "Failed to delete tag",
      });
      return false;
    }
  }, []);

  const bulkDeleteTags = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!ids.length) return true;
      dispatch({ type: "BULK_DELETE_START" });
      try {
        const supabase = createClient();

        const { error } = await supabase.from("tags").delete().in("id", ids);
        if (error) throw error;
        dispatch({ type: "BULK_DELETE_SUCCESS", payload: ids });
        return true;
      } catch (err: unknown) {
        dispatch({
          type: "BULK_DELETE_ERROR",
          payload: err instanceof Error ? err.message : "Failed to delete tags",
        });
        return false;
      }
    },
    [],
  );

  // ── Helpers ──────────────────────────────────────────────

  const setSearch = useCallback(
    (search: string) => dispatch({ type: "SET_FILTERS", payload: { search } }),
    [],
  );
  const setSort = useCallback(
    (field: TagSortField, order: SortOrder = "asc") =>
      dispatch({
        type: "SET_FILTERS",
        payload: { sortField: field, sortOrder: order },
      }),
    [],
  );
  const setPage = useCallback(
    (page: number) =>
      dispatch({ type: "SET_PAGE", payload: Math.max(1, page) }),
    [],
  );
  const setLimit = useCallback(
    (limit: number) => dispatch({ type: "SET_LIMIT", payload: limit }),
    [],
  );
  const nextPage = useCallback(() => {
    if (state.pagination.hasNextPage)
      dispatch({ type: "SET_PAGE", payload: state.pagination.page + 1 });
  }, [state.pagination]);
  const prevPage = useCallback(() => {
    if (state.pagination.hasPrevPage)
      dispatch({ type: "SET_PAGE", payload: state.pagination.page - 1 });
  }, [state.pagination]);
  const resetFilters = useCallback(
    () => dispatch({ type: "SET_FILTERS", payload: DEFAULT_FILTERS }),
    [],
  );
  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);
  const getTagById = useCallback(
    (id: string) => state.tags.find((t) => t.id === id),
    [state.tags],
  );

  return {
    tags: state.tags,
    pagination: state.pagination,
    filters: state.filters,
    loading: state.loading,
    error: state.error,
    creating: state.creating,
    updating: state.updating,
    deleting: state.deleting,
    bulkDeleting: state.bulkDeleting,
    setSearch,
    setSort,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    resetFilters,
    createTag,
    updateTag,
    deleteTag,
    bulkDeleteTags,
    refetch: fetchTags,
    clearError,
    getTagById,
  };
}
