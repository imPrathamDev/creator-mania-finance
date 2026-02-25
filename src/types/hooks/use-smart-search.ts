// ============================================================
//  NAV LINKS  (internal — edit to match your actual nav)
// ============================================================

import { LucideIcon } from "lucide-react";

export interface NavLink {
    title: string;
    url: string;
    icon: LucideIcon;
}

// ============================================================
//  RESULT TYPES
// ============================================================

export type ResultKind = "transaction" | "contact" | "tag" | "nav";

export interface BaseResult {
    kind: ResultKind;
    id: string; // unique across all kinds
    title: string; // primary display text
    subtitle: string | null;
    url: string | null;
    score: number; // higher = more relevant
}

export interface TransactionResult extends BaseResult {
    kind: "transaction";
    transaction_type: "income" | "expense";
    amount: number;
    currency: string;
    payment_status: string;
    payment_method: string | null;
    date: string;
}

export interface ContactResult extends BaseResult {
    kind: "contact";
    contact_type: "client" | "vendor" | "both";
    email: string | null;
    phone: string | null;
    company: string | null;
}

export interface TagResult extends BaseResult {
    kind: "tag";
    color: string | null;
}

export interface NavResult extends BaseResult {
    kind: "nav";
    icon: LucideIcon;
}

export type SmartSearchResult =
    | TransactionResult
    | ContactResult
    | TagResult
    | NavResult;

// ============================================================
//  GROUPED RESULTS
// ============================================================

export interface SmartSearchResults {
    transactions: TransactionResult[];
    contacts: ContactResult[];
    tags: TagResult[];
    nav: NavResult[];
    all: SmartSearchResult[]; // sorted by score desc
    total: number;
}
