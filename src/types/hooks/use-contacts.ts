export type ContactType = "client" | "vendor" | "both";

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  website: string | null;
  category: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Omit<Contact, "id" | "created_at" | "updated_at">;
export type ContactUpdate = Partial<ContactInsert>;

// ─── Filters ────────────────────────────────────────────────

export type SortField =
  | "name"
  | "company"
  | "category"
  | "created_at"
  | "updated_at";
export type SortOrder = "asc" | "desc";

export interface ContactFilters {
  search?: string; // searches name, email, company, phone
  type?: ContactType; // filter by contact type
  category?: string; // filter by category
  is_active?: boolean; // filter by active status
  sortField?: SortField; // default: 'name'
  sortOrder?: SortOrder; // default: 'asc'
}

// ─── Pagination ─────────────────────────────────────────────

export interface PaginationOptions {
  page?: number; // 1-based, default: 1
  limit?: number; // default: 20, max: 100
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
