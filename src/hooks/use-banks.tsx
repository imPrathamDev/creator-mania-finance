import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useReducer, useRef } from "react";

const supabase = createClient();

// ============================================================
//  TYPES
// ============================================================

export interface Bank {
  id: string;
  name: string;
  balance: number;
  created_at: string;
}

export type BankInsert = Omit<Bank, "id" | "created_at">;
export type BankUpdate = Partial<BankInsert>;

// ============================================================
//  STATE / REDUCER
// ============================================================

interface BankState {
  banks: Bank[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: string | null; // id of bank being updated
  deleting: string | null; // id of bank being deleted
}

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Bank[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "CREATE_START" }
  | { type: "CREATE_SUCCESS"; payload: Bank }
  | { type: "CREATE_ERROR" }
  | { type: "UPDATE_START"; payload: string }
  | { type: "UPDATE_SUCCESS"; payload: Bank }
  | { type: "UPDATE_ERROR" }
  | { type: "DELETE_START"; payload: string }
  | { type: "DELETE_SUCCESS"; payload: string }
  | { type: "DELETE_ERROR" };

const initialState: BankState = {
  banks: [],
  loading: false,
  error: null,
  creating: false,
  updating: null,
  deleting: null,
};

function reducer(state: BankState, action: Action): BankState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, banks: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "CREATE_START":
      return { ...state, creating: true };
    case "CREATE_SUCCESS":
      return {
        ...state,
        creating: false,
        banks: [...state.banks, action.payload],
      };
    case "CREATE_ERROR":
      return { ...state, creating: false };

    case "UPDATE_START":
      return { ...state, updating: action.payload };
    case "UPDATE_SUCCESS":
      return {
        ...state,
        updating: null,
        banks: state.banks.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        ),
      };
    case "UPDATE_ERROR":
      return { ...state, updating: null };

    case "DELETE_START":
      return { ...state, deleting: action.payload };
    case "DELETE_SUCCESS":
      return {
        ...state,
        deleting: null,
        banks: state.banks.filter((b) => b.id !== action.payload),
      };
    case "DELETE_ERROR":
      return { ...state, deleting: null };

    default:
      return state;
  }
}

// ============================================================
//  HOOK
// ============================================================

interface UseBanksOptions {
  enabled?: boolean;
}

export function useBanks(options: UseBanksOptions = {}) {
  const { enabled = true } = options;
  const [state, dispatch] = useReducer(reducer, initialState);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // ── fetch ────────────────────────────────────────────────
  const fetchBanks = useCallback(async () => {
    if (!enabledRef.current) return;
    dispatch({ type: "FETCH_START" });
    const { data, error } = await supabase
      .from("banks")
      .select("*")
      .order("name", { ascending: true });

    if (error) dispatch({ type: "FETCH_ERROR", payload: error.message });
    else dispatch({ type: "FETCH_SUCCESS", payload: data as Bank[] });
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  // ── create ───────────────────────────────────────────────
  const createBank = useCallback(
    async (input: BankInsert): Promise<Bank | null> => {
      dispatch({ type: "CREATE_START" });
      const { data, error } = await supabase
        .from("banks")
        .insert(input)
        .select()
        .single();

      if (error || !data) {
        dispatch({ type: "CREATE_ERROR" });
        return null;
      }
      dispatch({ type: "CREATE_SUCCESS", payload: data as Bank });
      return data as Bank;
    },
    [],
  );

  // ── update ───────────────────────────────────────────────
  const updateBank = useCallback(
    async (id: string, input: BankUpdate): Promise<boolean> => {
      dispatch({ type: "UPDATE_START", payload: id });
      const { data, error } = await supabase
        .from("banks")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        dispatch({ type: "UPDATE_ERROR" });
        return false;
      }
      dispatch({ type: "UPDATE_SUCCESS", payload: data as Bank });
      return true;
    },
    [],
  );

  // ── delete ───────────────────────────────────────────────
  const deleteBank = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: "DELETE_START", payload: id });
    const { error } = await supabase.from("banks").delete().eq("id", id);
    if (error) {
      dispatch({ type: "DELETE_ERROR" });
      return false;
    }
    dispatch({ type: "DELETE_SUCCESS", payload: id });
    return true;
  }, []);

  // ── totals ───────────────────────────────────────────────
  const totalBalance = state.banks.reduce((sum, b) => sum + b.balance, 0);

  return {
    banks: state.banks,
    loading: state.loading,
    error: state.error,
    creating: state.creating,
    updating: state.updating,
    deleting: state.deleting,
    totalBalance,
    createBank,
    updateBank,
    deleteBank,
    refetch: fetchBanks,
  };
}
