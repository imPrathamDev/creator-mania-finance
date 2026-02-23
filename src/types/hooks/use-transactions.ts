import { PaymentMethod, PaymentStatus } from "@/hooks/use-payments-helpers";
import { Contact } from "./use-contacts";
import { Tag } from "./use-tags";
import { Database } from "../supabase";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  transaction_date: string;
  due_date: string | null;
  paid_date: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  contact_id: string | null;
  invoice_number: string | null;
  receipt_url: string | null;
  notes: string | null;
  attachments: Attachment[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;

  // joined fields (populated when withContact / withTags is true)
  contact?: Pick<Contact, "id" | "name" | "type" | "company"> | null;
  tags?: Pick<Tag, "id" | "name" | "color">[];
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];

// export type TransactionUpdate = Partial<TransactionInsert>;
export type TransactionUpdate =
  Database["public"]["Tables"]["transactions"]["Update"];
// ─── Filters ────────────────────────────────────────────────

export type TxnSortField =
  | "transaction_date"
  | "amount"
  | "title"
  | "created_at"
  | "due_date"
  | "updated_at";

export type SortOrder = "asc" | "desc";

export interface TransactionFilters {
  search?: string; // searches title, description, notes, reference_number
  type?: TransactionType;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  contact_id?: string;
  tag_ids?: string[]; // transactions that have ALL these tags
  currency?: string;
  date_from?: string; // ISO date string YYYY-MM-DD
  date_to?: string;
  due_from?: string;
  due_to?: string;
  amount_min?: number;
  amount_max?: number;
  sortField?: TxnSortField;
  sortOrder?: SortOrder;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Summary ────────────────────────────────────────────────

export interface TransactionSummary {
  total_income: number;
  total_expense: number;
  net: number;
  count_income: number;
  count_expense: number;
  count_pending: number;
  count_overdue: number;
}
