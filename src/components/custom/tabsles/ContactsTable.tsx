"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building2,
  Phone,
  Globe,
  Users,
  UserCheck,
  ShoppingCart,
  CircleCheck,
  CircleMinus,
  Loader,
  Columns3Cog,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useContacts } from "@/hooks/use-contacts";
import { Contact, ContactType } from "@/types/hooks/use-contacts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// ============================================================
//  TYPE BADGE CONFIG
// ============================================================

const CONTACT_TYPE_CONFIG: Record<
  ContactType,
  { label: string; icon: React.ElementType }
> = {
  client: { label: "Client", icon: UserCheck },
  vendor: { label: "Vendor", icon: ShoppingCart },
  both: { label: "Both", icon: Users },
};

// ============================================================
//  COLUMNS
// ============================================================

function buildColumns(
  onEdit: (contact: Contact) => void,
  onDelete: (id: string) => void,
  onToggle: (id: string) => void,
  deletingId: string | null,
  updatingId: string | null,
): ColumnDef<Contact>[] {
  return [
    // ── Select ──────────────────────────────────────────────
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // ── Name ─────────────────────────────────────────────────
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const c = row.original;
        const initials = c.name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {initials}
            </div>
            <div>
              <p className="font-medium">{c.name}</p>
              {c.email && (
                <p className="text-muted-foreground text-sm">{c.email}</p>
              )}
            </div>
          </div>
        );
      },
      enableHiding: false,
    },

    // ── Company ──────────────────────────────────────────────
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) =>
        row.original.company ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="size-4 shrink-0" />
            {row.original.company}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },

    // ── Type ─────────────────────────────────────────────────
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const cfg = CONTACT_TYPE_CONFIG[row.original.type];
        const Icon = cfg.icon;
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            <Icon className="size-3.5 mr-1" />
            {cfg.label}
          </Badge>
        );
      },
    },

    // ── Category ─────────────────────────────────────────────
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) =>
        row.original.category ? (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.category}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },

    // ── Phone ────────────────────────────────────────────────
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        row.original.phone ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="size-4 shrink-0" />
            {row.original.phone}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },

    // ── Website ──────────────────────────────────────────────
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) =>
        row.original.website ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="size-4 shrink-0" />
            {row.original.website.replace(/^https?:\/\//, "")}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },

    // ── Status ───────────────────────────────────────────────
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.is_active ? (
            <CircleCheck className="fill-green-500 dark:fill-green-400 text-white dark:text-black size-3.5 mr-1" />
          ) : (
            <CircleMinus className="size-3.5 mr-1" />
          )}
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },

    // ── Actions ──────────────────────────────────────────────
    {
      id: "actions",
      cell: ({ row }) => {
        const c = row.original;
        const busy = deletingId === c.id || updatingId === c.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
                disabled={busy}
              >
                <MoreVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onEdit(c)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggle(c.id)}>
                {c.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(c.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

// ============================================================
//  MAIN COMPONENT
// ============================================================

interface ContactsTableProps {
  onCreateContact?: () => void;
  onEditContact?: (contact: Contact) => void;
}

export function ContactsTable({
  onCreateContact,
  onEditContact,
}: ContactsTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      phone: false,
      website: false,
    });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // ── hook ──────────────────────────────────────────────────
  const {
    contacts,
    loading,
    error,
    deleting,
    updating,
    bulkDeleting,
    deleteContact,
    bulkDeleteContacts,
    toggleActive,
    setSearch,
    setType,
    setActiveStatus,
    setSort,
    pagination: serverPagination,
    setPage,
    setLimit,
  } = useContacts({ pagination: { limit: 10 } });
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  // ── debounced search ──────────────────────────────────────
  const [localSearch, setLocalSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  // ── sync sorting → hook ───────────────────────────────────
  React.useEffect(() => {
    if (sorting.length > 0) {
      const s = sorting[0];
      setSort(s.id as any, s.desc ? "desc" : "asc");
    }
  }, [sorting, setSort]);

  // ── sync pagination → hook ────────────────────────────────
  React.useEffect(() => {
    setPage(pagination.pageIndex + 1);
    setLimit(pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, setPage, setLimit]);

  // ── bulk delete ───────────────────────────────────────────
  const handleBulkDelete = async () => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (!ids.length) return;
    await bulkDeleteContacts(ids);
    setRowSelection({});
  };

  // ── columns ───────────────────────────────────────────────
  const columns = React.useMemo(
    () =>
      buildColumns(
        (c) => onEditContact?.(c),
        (id: string) => {
          setDeleteId(id);
        },
        toggleActive,
        deleting,
        updating,
      ),
    [deleteContact, toggleActive, deleting, updating, onEditContact],
  );

  // ── table ─────────────────────────────────────────────────
  const table = useReactTable({
    data: contacts,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    manualSorting: true,
    manualPagination: true,
    pageCount: serverPagination.totalPages,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedCount = table.getSelectedRowModel().rows.length;

  // ============================================================
  //  RENDER
  // ============================================================

  return (
    <div className="w-full flex flex-col justify-start gap-6">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Type filter */}
          <Select
            value={
              (columnFilters.find((f) => f.id === "type")?.value as string) ??
              "all"
            }
            onValueChange={(val) => {
              setType(val === "all" ? undefined : (val as ContactType));
              setColumnFilters((prev) =>
                val === "all"
                  ? prev.filter((f) => f.id !== "type")
                  : [
                      ...prev.filter((f) => f.id !== "type"),
                      { id: "type", value: val },
                    ],
              );
            }}
          >
            <SelectTrigger className="w-fit h-8" size="sm">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={
              (columnFilters.find((f) => f.id === "is_active")
                ?.value as string) ?? "all"
            }
            onValueChange={(val) => {
              setActiveStatus(val === "all" ? undefined : val === "true");
              setColumnFilters((prev) =>
                val === "all"
                  ? prev.filter((f) => f.id !== "is_active")
                  : [
                      ...prev.filter((f) => f.id !== "is_active"),
                      { id: "is_active", value: val },
                    ],
              );
            }}
          >
            <SelectTrigger className="w-fit h-8" size="sm">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk delete — shown when rows selected */}
          {selectedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="h-8 gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete {selectedCount}
            </Button>
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Cog />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add */}
          <Button variant="outline" size="sm" onClick={onCreateContact}>
            <Plus />
            <span className="hidden lg:inline">Add Contact</span>
          </Button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 lg:mx-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Users className="size-8 opacity-40" />
                      No contacts found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {selectedCount > 0
              ? `${selectedCount} of ${serverPagination.total} row(s) selected.`
              : `${serverPagination.total} contact(s) total.`}
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            {/* Rows per page */}
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page count */}
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {serverPagination.page} of {serverPagination.totalPages || 1}
            </div>

            {/* Nav */}
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage() || loading}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage() || loading}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage() || loading}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage() || loading}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(e) => {
          if (!e) {
            setDeleteId(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  deleteContact(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
