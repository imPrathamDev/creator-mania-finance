import {
  ContactResult,
  NavLink,
  NavResult,
  ResultKind,
  SmartSearchResult,
  SmartSearchResults,
  TagResult,
  TransactionResult,
} from "@/types/hooks/use-smart-search";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, Settings, Sparkles, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const NAV_LINKS: NavLink[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Contacts", url: "/contacts", icon: UsersRound },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "AI Chat", url: "/ai", icon: Sparkles },
];

const EMPTY_RESULTS: SmartSearchResults = {
  transactions: [],
  contacts: [],
  tags: [],
  nav: [],
  all: [],
  total: 0,
};

// ============================================================
//  SCORING HELPER
//  Higher score = shown first.
//  Exact match > starts-with > contains > word match
// ============================================================

function score(field: string, term: string): number {
  const f = field.toLowerCase();
  const t = term.toLowerCase();
  if (f === t) return 100;
  if (f.startsWith(t)) return 75;
  if (f.includes(t)) return 50;
  // word boundary match: term matches any word in field
  if (f.split(/\s+/).some((w) => w.startsWith(t))) return 35;
  return 0;
}

function bestScore(
  fields: (string | null | undefined)[],
  term: string,
): number {
  return Math.max(0, ...fields.map((f) => (f ? score(f, term) : 0)));
}

// ============================================================
//  NAV SEARCH  (pure client-side)
// ============================================================

function searchNav(term: string): NavResult[] {
  if (!term.trim()) return [];
  return NAV_LINKS.map((link) => {
    const s = bestScore([link.title, link.url], term);
    if (s === 0) return null;
    return {
      kind: "nav" as const,
      id: `nav-${link.url}`,
      title: link.title,
      subtitle: link.url,
      url: link.url,
      icon: link.icon,
      score: s + 10, // nav gets a small boost so it always appears
    };
  }).filter(Boolean) as NavResult[];
}

// ============================================================
//  SUPABASE SEARCHES
// ============================================================

async function searchTransactions(
  term: string,
  limit: number,
): Promise<TransactionResult[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, title, description, notes, type, amount, currency, payment_status, payment_method, transaction_date, reference_number, invoice_number, contact_id",
    )
    .or(
      [
        `title.ilike.%${term}%`,
        `description.ilike.%${term}%`,
        `notes.ilike.%${term}%`,
        `reference_number.ilike.%${term}%`,
        `invoice_number.ilike.%${term}%`,
      ].join(","),
    )
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    kind: "transaction" as const,
    id: `txn-${row.id}`,
    title: row.title,
    subtitle: row.description ?? row.notes ?? null,
    url: `/transactions/${row.id}`,
    score: bestScore(
      [
        row.title,
        row.description,
        row.notes,
        row.reference_number,
        row.invoice_number,
      ],
      term,
    ),
    transaction_type: row.type,
    amount: Number(row.amount),
    currency: row.currency,
    payment_status: row.payment_status,
    payment_method: row.payment_method,
    date: row.transaction_date,
  }));
}

async function searchContacts(
  term: string,
  limit: number,
): Promise<ContactResult[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, type, email, phone, company, category, notes")
    .or(
      [
        `name.ilike.%${term}%`,
        `email.ilike.%${term}%`,
        `phone.ilike.%${term}%`,
        `company.ilike.%${term}%`,
        `category.ilike.%${term}%`,
        `notes.ilike.%${term}%`,
      ].join(","),
    )
    .eq("is_active", true)
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    kind: "contact" as const,
    id: `contact-${row.id}`,
    title: row.name,
    subtitle: row.company ?? row.email ?? null,
    url: `/contacts/${row.id}`,
    score: bestScore(
      [row.name, row.email, row.company, row.category, row.phone],
      term,
    ),
    contact_type: row.type,
    email: row.email,
    phone: row.phone,
    company: row.company,
  }));
}

async function searchTags(term: string, limit: number): Promise<TagResult[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color")
    .ilike("name", `%${term}%`)
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    kind: "tag" as const,
    id: `tag-${row.id}`,
    title: row.name,
    subtitle: null,
    url: `/transactions?tag=${row.id}`,
    score: bestScore([row.name], term),
    color: row.color,
  }));
}

// ============================================================
//  HOOK OPTIONS & RETURN
// ============================================================

interface UseSmartSearchOptions {
  /** Debounce delay in ms. Default: 300 */
  debounce?: number;
  /** Max results per category. Default: 5 */
  limitPerKind?: number;
  /** Minimum characters before searching. Default: 2 */
  minLength?: number;
  /** Which kinds to search. Default: all */
  kinds?: ResultKind[];
  /** Set false to disable. Default: true */
  enabled?: boolean;
}

export interface UseSmartSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SmartSearchResults;
  loading: boolean;
  error: string | null;
  clear: () => void;
  isEmpty: boolean; // true when query is empty or too short
}

// ============================================================
//  HOOK
// ============================================================

export function useSmartSearch(
  options: UseSmartSearchOptions = {},
): UseSmartSearchReturn {
  const {
    debounce: debounceMs = 300,
    limitPerKind = 5,
    minLength = 2,
    kinds = ["transaction", "contact", "tag", "nav"],
    enabled = true,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SmartSearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // abort controller ref — cancels in-flight requests when query changes
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(
    async (term: string) => {
      // cancel previous
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (!enabled || term.trim().length < minLength) {
        setResults(EMPTY_RESULTS);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // run all enabled searches in parallel
        const [txns, contacts, tags] = await Promise.all([
          kinds.includes("transaction")
            ? searchTransactions(term, limitPerKind)
            : Promise.resolve([]),
          kinds.includes("contact")
            ? searchContacts(term, limitPerKind)
            : Promise.resolve([]),
          kinds.includes("tag")
            ? searchTags(term, limitPerKind)
            : Promise.resolve([]),
        ]);

        const nav = kinds.includes("nav") ? searchNav(term) : [];

        // combine and sort by score descending
        const all: SmartSearchResult[] = [
          ...txns,
          ...contacts,
          ...tags,
          ...nav,
        ].sort((a, b) => b.score - a.score);

        setResults({
          transactions: txns,
          contacts,
          tags,
          nav,
          all,
          total: all.length,
        });
      } catch (err: unknown) {
        if ((err as any)?.name === "AbortError") return; // query changed — ignore
        setError(err instanceof Error ? err.message : "Search failed");
        setResults(EMPTY_RESULTS);
      } finally {
        setLoading(false);
      }
    },
    [enabled, minLength, limitPerKind, kinds],
  );

  // debounce
  useEffect(() => {
    const t = setTimeout(() => runSearch(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs, runSearch]);

  const clear = useCallback(() => {
    setQuery("");
    setResults(EMPTY_RESULTS);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clear,
    isEmpty: query.trim().length < minLength,
  };
}
