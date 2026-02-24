import {
  PaginationMeta,
  PaginationOptions,
  SortOrder,
  Transaction,
  TransactionFilters,
  TransactionInsert,
  TransactionSummary,
  TransactionType,
  TransactionUpdate,
  TxnSortField,
} from "@/types/hooks/use-transactions";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { PaymentMethod, PaymentStatus } from "./use-payments-helpers";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface TransactionsState {
  transactions: Transaction[];
  pagination: PaginationMeta;
  filters: TransactionFilters;
  summary: TransactionSummary | null;
  loading: boolean;
  summaryLoading: boolean;
  error: string | null;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
  bulkDeleting: boolean;
}

type TransactionsAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: { transactions: Transaction[]; total: number };
    }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SUMMARY_START" }
  | { type: "SUMMARY_SUCCESS"; payload: TransactionSummary }
  | { type: "SUMMARY_ERROR" }
  | { type: "SET_FILTERS"; payload: TransactionFilters }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_LIMIT"; payload: number }
  | { type: "CREATE_START" }
  | { type: "CREATE_SUCCESS"; payload: Transaction }
  | { type: "CREATE_ERROR"; payload: string }
  | { type: "UPDATE_START"; payload: string }
  | { type: "UPDATE_SUCCESS"; payload: Transaction }
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

const DEFAULT_FILTERS: TransactionFilters = {
  sortField: "transaction_date",
  sortOrder: "desc",
};

const EMPTY_SUMMARY: TransactionSummary = {
  total_income: 0,
  total_expense: 0,
  net: 0,
  count_income: 0,
  count_expense: 0,
  count_pending: 0,
  count_overdue: 0,
};

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

function reducer(
  state: TransactionsState,
  action: TransactionsAction,
): TransactionsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        transactions: action.payload.transactions,
        pagination: buildPagination(
          state.pagination.page,
          state.pagination.limit,
          action.payload.total,
        ),
      };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SUMMARY_START":
      return { ...state, summaryLoading: true };

    case "SUMMARY_SUCCESS":
      return { ...state, summaryLoading: false, summary: action.payload };

    case "SUMMARY_ERROR":
      return { ...state, summaryLoading: false };

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
        transactions: [action.payload, ...state.transactions],
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
        transactions: state.transactions.map((t) =>
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
        transactions: state.transactions.filter((t) => t.id !== action.payload),
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
        transactions: state.transactions.filter(
          (t) => !action.payload.includes(t.id),
        ),
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
//  HOOK OPTIONS
// ============================================================

interface UseTransactionsOptions {
  filters?: TransactionFilters;
  pagination?: PaginationOptions;
  enabled?: boolean;
  withContact?: boolean;
  withTags?: boolean;
  withSummary?: boolean;
}

export interface UseTransactionsReturn {
  transactions: Transaction[];
  pagination: PaginationMeta;
  filters: TransactionFilters;
  summary: TransactionSummary | null;
  loading: boolean;
  summaryLoading: boolean;
  error: string | null;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
  bulkDeleting: boolean;
  setFilters: (f: TransactionFilters) => void;
  setSearch: (search: string) => void;
  setType: (type: TransactionType | undefined) => void;
  setStatus: (status: PaymentStatus | undefined) => void;
  setMethod: (method: PaymentMethod | undefined) => void;
  setContact: (contact_id: string | undefined) => void;
  setTags: (tag_ids: string[]) => void;
  setDateRange: (from: string | undefined, to: string | undefined) => void;
  setDueRange: (from: string | undefined, to: string | undefined) => void;
  setAmountRange: (min: number | undefined, max: number | undefined) => void;
  setSort: (field: TxnSortField, order?: SortOrder) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetFilters: () => void;
  createTransaction: (
    data: TransactionInsert,
    tagIds?: string[],
  ) => Promise<Transaction | null>;
  updateTransaction: (
    id: string,
    data: TransactionUpdate,
    tagIds?: string[],
  ) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  bulkDeleteTransactions: (ids: string[]) => Promise<boolean>;
  markAsPaid: (id: string, paidDate?: string) => Promise<Transaction | null>;
  markAsOverdue: (ids: string[]) => Promise<boolean>;
  refetch: () => void;
  refetchSummary: () => void;
  clearError: () => void;
  getTransactionById: (id: string) => Transaction | undefined;
}

// ============================================================
//  HOOK
// ============================================================

export function useTransactions(
  options: UseTransactionsOptions = {},
): UseTransactionsReturn {
  const {
    filters: initFilters = {},
    pagination: initPagination = {},
    enabled = true,
    withContact = true,
    withTags = true,
    withSummary = false,
  } = options;

  const [state, dispatch] = useReducer(reducer, {
    transactions: [],
    pagination: {
      page: initPagination.page ?? 1,
      limit: Math.min(initPagination.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    filters: { ...DEFAULT_FILTERS, ...initFilters },
    summary: null,
    loading: false,
    summaryLoading: false,
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

  // ─────────────────────────────────────────────────────────
  //  FIX: store pagination + filters in refs so fetchTransactions
  //  never needs them as useCallback deps. The ref always holds
  //  the latest values without causing a new function reference.
  // ─────────────────────────────────────────────────────────
  const paginationRef = useRef(state.pagination);
  const filtersRef = useRef(state.filters);
  const withTagsRef = useRef(withTags);
  const withContactRef = useRef(withContact);

  // keep refs in sync with state on every render (no re-render cost)
  paginationRef.current = state.pagination;
  filtersRef.current = state.filters;
  withTagsRef.current = withTags;
  withContactRef.current = withContact;

  // ── Build select string ──────────────────────────────────
  // FIX: not a useCallback — just a plain function called inside
  // fetchTransactions so it reads from refs and has zero deps.
  const buildSelect = () => {
    const parts = ["*"];
    if (withContactRef.current)
      parts.push("contact:contacts(id, name, type, company)");
    if (withTagsRef.current)
      parts.push("tags:transaction_tags(tag:tags(id, name, color))");
    return parts.join(", ");
  };

  // ── Fetch ────────────────────────────────────────────────
  // FIX: empty dependency array — function never changes reference.
  // It reads the latest pagination/filters through refs every call.
  const fetchTransactions = useCallback(async () => {
    if (!enabled) return;
    dispatch({ type: "FETCH_START" });

    try {
      const { page, limit } = paginationRef.current;
      const f = filtersRef.current;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from("transactions")
        .select(buildSelect(), { count: "exact" });

      if (f.search?.trim()) {
        query = query.or(
          `title.ilike.%${f.search}%,description.ilike.%${f.search}%,notes.ilike.%${f.search}%,reference_number.ilike.%${f.search}%`,
        );
      }

      if (f.type) query = query.eq("type", f.type);
      if (f.payment_status)
        query = query.eq("payment_status", f.payment_status);
      if (f.payment_method)
        query = query.eq("payment_method", f.payment_method);
      if (f.contact_id) query = query.eq("contact_id", f.contact_id);
      if (f.currency) query = query.eq("currency", f.currency);
      if (f.date_from) query = query.gte("transaction_date", f.date_from);
      if (f.date_to) query = query.lte("transaction_date", f.date_to);
      if (f.due_from) query = query.gte("due_date", f.due_from);
      if (f.due_to) query = query.lte("due_date", f.due_to);
      if (f.amount_min != null) query = query.gte("amount", f.amount_min);
      if (f.amount_max != null) query = query.lte("amount", f.amount_max);

      query = query
        .order(f.sortField ?? "transaction_date", {
          ascending: f.sortOrder !== "desc",
        })
        .range(from, to);

      const { data, error, count } = await query;
      if (!mountedRef.current) return;
      if (error) throw error;

      let transactions = (data ?? []).map((row: any) => ({
        ...row,
        tags: withTagsRef.current
          ? (row.tags ?? []).map((t: any) => t.tag).filter(Boolean)
          : undefined,
      })) as Transaction[];

      // client-side tag intersection filter
      if (f.tag_ids?.length) {
        transactions = transactions.filter((txn) =>
          f.tag_ids!.every((tid) => txn.tags?.some((t) => t.id === tid)),
        );
      }

      dispatch({
        type: "FETCH_SUCCESS",
        payload: { transactions, total: count ?? 0 },
      });
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      dispatch({
        type: "FETCH_ERROR",
        payload:
          err instanceof Error ? err.message : "Failed to fetch transactions",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // FIX: only re-create if enabled changes — refs handle the rest

  // ── Trigger fetch when pagination or filters change ──────
  // FIX: useEffect watches state directly (not fetchTransactions).
  // fetchTransactions is stable so this won't loop.
  useEffect(() => {
    fetchTransactions();
  }, [
    fetchTransactions,
    state.pagination.page,
    state.pagination.limit,
    state.filters, // object ref changes only on dispatch — safe here
  ]);

  // ── Summary ──────────────────────────────────────────────
  // FIX: stable ref, no state deps
  const fetchSummary = useCallback(async () => {
    if (!withSummary) return;
    dispatch({ type: "SUMMARY_START" });
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("type, payment_status, amount")
        .neq("payment_status", "cancelled");

      if (error) throw error;

      const summary = (data ?? []).reduce<TransactionSummary>(
        (acc, row: any) => {
          if (row.type === "income") {
            acc.total_income += Number(row.amount);
            acc.count_income++;
          }
          if (row.type === "expense") {
            acc.total_expense += Number(row.amount);
            acc.count_expense++;
          }
          if (row.payment_status === "pending") acc.count_pending++;
          if (row.payment_status === "overdue") acc.count_overdue++;
          acc.net = acc.total_income - acc.total_expense;
          return acc;
        },
        { ...EMPTY_SUMMARY },
      );

      if (!mountedRef.current) return;
      dispatch({ type: "SUMMARY_SUCCESS", payload: summary });
    } catch {
      if (!mountedRef.current) return;
      dispatch({ type: "SUMMARY_ERROR" });
    }
  }, [withSummary]); // stable — withSummary is a primitive prop

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ── Create ───────────────────────────────────────────────

  const createTransaction = useCallback(
    async (
      data: TransactionInsert,
      tagIds: string[] = [],
    ): Promise<Transaction | null> => {
      dispatch({ type: "CREATE_START" });
      try {
        const { data: created, error } = await supabase
          .from("transactions")
          .insert(data)
          .select()
          .single();
        if (error) throw error;

        if (tagIds.length) {
          await supabase
            .from("transaction_tags")
            .insert(
              tagIds.map((tag_id) => ({ transaction_id: created.id, tag_id })),
            );
        }

        const { data: full, error: fetchErr } = await supabase
          .from("transactions")
          .select(buildSelect())
          .eq("id", created.id)
          .single();
        if (fetchErr) throw fetchErr;

        const txn: Transaction = {
          ...(full as any),
          tags: withTagsRef.current
            ? ((full as any).tags ?? []).map((t: any) => t.tag).filter(Boolean)
            : undefined,
        };

        dispatch({ type: "CREATE_SUCCESS", payload: txn });
        return txn;
      } catch (err: unknown) {
        dispatch({
          type: "CREATE_ERROR",
          payload:
            err instanceof Error ? err.message : "Failed to create transaction",
        });
        return null;
      }
    },
    [],
  ); // FIX: no deps — reads withTagsRef inside

  // ── Update ───────────────────────────────────────────────

  const updateTransaction = useCallback(
    async (
      id: string,
      data: TransactionUpdate,
      tagIds?: string[],
    ): Promise<Transaction | null> => {
      dispatch({ type: "UPDATE_START", payload: id });
      try {
        const { error } = await supabase
          .from("transactions")
          .update(data)
          .eq("id", id);
        if (error) throw error;

        if (tagIds !== undefined) {
          await supabase
            .from("transaction_tags")
            .delete()
            .eq("transaction_id", id);
          if (tagIds.length) {
            await supabase
              .from("transaction_tags")
              .insert(tagIds.map((tag_id) => ({ transaction_id: id, tag_id })));
          }
        }

        const { data: full, error: fetchErr } = await supabase
          .from("transactions")
          .select(buildSelect())
          .eq("id", id)
          .single();
        if (fetchErr) throw fetchErr;

        const txn: Transaction = {
          ...(full as any),
          tags: withTagsRef.current
            ? ((full as any).tags ?? []).map((t: any) => t.tag).filter(Boolean)
            : undefined,
        };

        dispatch({ type: "UPDATE_SUCCESS", payload: txn });
        return txn;
      } catch (err: unknown) {
        dispatch({
          type: "UPDATE_ERROR",
          payload:
            err instanceof Error ? err.message : "Failed to update transaction",
        });
        return null;
      }
    },
    [],
  ); // FIX: no deps — reads withTagsRef inside

  // ── Delete ───────────────────────────────────────────────

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      dispatch({ type: "DELETE_START", payload: id });
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id);
        if (error) throw error;
        dispatch({ type: "DELETE_SUCCESS", payload: id });
        return true;
      } catch (err: unknown) {
        dispatch({
          type: "DELETE_ERROR",
          payload:
            err instanceof Error ? err.message : "Failed to delete transaction",
        });
        return false;
      }
    },
    [],
  );

  const bulkDeleteTransactions = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!ids.length) return true;
      dispatch({ type: "BULK_DELETE_START" });
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .in("id", ids);
        if (error) throw error;
        dispatch({ type: "BULK_DELETE_SUCCESS", payload: ids });
        return true;
      } catch (err: unknown) {
        dispatch({
          type: "BULK_DELETE_ERROR",
          payload: err instanceof Error ? err.message : "Failed to bulk delete",
        });
        return false;
      }
    },
    [],
  );

  // ── Status shortcuts ─────────────────────────────────────

  const markAsPaid = useCallback(
    async (
      id: string,
      paidDate: string = new Date().toISOString().split("T")[0],
    ): Promise<Transaction | null> => {
      return updateTransaction(id, {
        payment_status: "paid",
        paid_date: paidDate,
      });
    },
    [updateTransaction],
  );

  const markAsOverdue = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!ids.length) return true;
      try {
        const { error } = await supabase
          .from("transactions")
          .update({ payment_status: "overdue" })
          .in("id", ids)
          .eq("payment_status", "pending");
        if (error) throw error;
        // FIX: call fetchTransactions directly — it's now stable so
        // no circular dependency risk
        await fetchTransactions();
        return true;
      } catch {
        return false;
      }
    },
    [fetchTransactions],
  );

  // ── Filter & pagination helpers ──────────────────────────
  // All stable — only dispatch, no state reads

  const setFilters = useCallback(
    (f: TransactionFilters) => dispatch({ type: "SET_FILTERS", payload: f }),
    [],
  );
  const setSearch = useCallback(
    (search: string) => dispatch({ type: "SET_FILTERS", payload: { search } }),
    [],
  );
  const setType = useCallback(
    (type: TransactionType | undefined) =>
      dispatch({ type: "SET_FILTERS", payload: { type } }),
    [],
  );
  const setStatus = useCallback(
    (payment_status: PaymentStatus | undefined) =>
      dispatch({ type: "SET_FILTERS", payload: { payment_status } }),
    [],
  );
  const setMethod = useCallback(
    (payment_method: PaymentMethod | undefined) =>
      dispatch({ type: "SET_FILTERS", payload: { payment_method } }),
    [],
  );
  const setContact = useCallback(
    (contact_id: string | undefined) =>
      dispatch({ type: "SET_FILTERS", payload: { contact_id } }),
    [],
  );
  const setTags = useCallback(
    (tag_ids: string[]) =>
      dispatch({ type: "SET_FILTERS", payload: { tag_ids } }),
    [],
  );
  const setDateRange = useCallback(
    (date_from?: string, date_to?: string) =>
      dispatch({ type: "SET_FILTERS", payload: { date_from, date_to } }),
    [],
  );
  const setDueRange = useCallback(
    (due_from?: string, due_to?: string) =>
      dispatch({ type: "SET_FILTERS", payload: { due_from, due_to } }),
    [],
  );
  const setAmountRange = useCallback(
    (amount_min?: number, amount_max?: number) =>
      dispatch({ type: "SET_FILTERS", payload: { amount_min, amount_max } }),
    [],
  );
  const setSort = useCallback(
    (field: TxnSortField, order: SortOrder = "desc") =>
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
    if (paginationRef.current.hasNextPage)
      dispatch({ type: "SET_PAGE", payload: paginationRef.current.page + 1 });
  }, []);
  const prevPage = useCallback(() => {
    if (paginationRef.current.hasPrevPage)
      dispatch({ type: "SET_PAGE", payload: paginationRef.current.page - 1 });
  }, []);
  const resetFilters = useCallback(
    () => dispatch({ type: "SET_FILTERS", payload: DEFAULT_FILTERS }),
    [],
  );
  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  // FIX: reads from state.transactions via closure but getTransactionById
  // only needs to change when the list changes — acceptable single dep
  const getTransactionById = useCallback(
    (id: string) => state.transactions.find((t) => t.id === id),
    [state.transactions],
  );

  return {
    transactions: state.transactions,
    pagination: state.pagination,
    filters: state.filters,
    summary: state.summary,
    loading: state.loading,
    summaryLoading: state.summaryLoading,
    error: state.error,
    creating: state.creating,
    updating: state.updating,
    deleting: state.deleting,
    bulkDeleting: state.bulkDeleting,
    setFilters,
    setSearch,
    setType,
    setStatus,
    setMethod,
    setContact,
    setTags,
    setDateRange,
    setDueRange,
    setAmountRange,
    setSort,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    resetFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    markAsPaid,
    markAsOverdue,
    refetch: fetchTransactions,
    refetchSummary: fetchSummary,
    clearError,
    getTransactionById,
  };
}
