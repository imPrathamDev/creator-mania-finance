export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export type TagInsert = Omit<Tag, "id" | "created_at">;
export type TagUpdate = Partial<TagInsert>;

export type TagSortField = "name" | "created_at";
export type SortOrder = "asc" | "desc";

export interface TagFilters {
  search?: string;
  sortField?: TagSortField;
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
