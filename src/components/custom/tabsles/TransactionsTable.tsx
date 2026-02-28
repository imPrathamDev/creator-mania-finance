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
  Columns3Cog,
  Plus,
  MoreVertical,
  Trash2,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Tag,
  Calendar,
  CircleCheck,
  Clock,
  CircleAlert,
  CircleX,
  CircleDashed,
  Banknote,
  Building2,
  CreditCard,
  Wallet,
  Smartphone,
  FileText,
  Bitcoin,
  CircleEllipsis,
  Pencil,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

import { useTransactions } from "@/hooks/use-transactions";
import { Transaction } from "@/types/hooks/use-transactions";
import { useTags } from "@/hooks/use-tags";
import {
  PAYMENT_METHOD_MAP,
  PAYMENT_STATUS_MAP,
  type PaymentStatus,
  type PaymentMethod,
} from "@/hooks/use-payments-helpers";
import { useQueryState } from "nuqs";
import { millifyNumbers } from "@/lib/utils";
import { useGeneralStore } from "@/context/genral-context";
import { useSearchParams } from "next/navigation";

// ============================================================
//  HELPERS
// ============================================================

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getDueDaysLabel(due: string | null): {
  label: string;
  className: string;
} | null {
  if (!due) return null;
  const diff = Math.ceil(
    (new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0)
    return {
      label: `${Math.abs(diff)}d overdue`,
      className: "text-red-500 dark:text-red-400",
    };
  if (diff === 0)
    return {
      label: "Due today",
      className: "text-orange-500 dark:text-orange-400",
    };
  if (diff <= 7)
    return {
      label: `Due in ${diff}d`,
      className: "text-yellow-600 dark:text-yellow-400",
    };
  return {
    label: `Due ${formatDate(due)}`,
    className: "text-muted-foreground",
  };
}

const PAYMENT_METHOD_ICON: Record<PaymentMethod, React.ElementType> = {
  cash: Banknote,
  bank_transfer: Building2,
  credit_card: CreditCard,
  debit_card: Wallet,
  upi: Smartphone,
  cheque: FileText,
  crypto: Bitcoin,
  other: CircleEllipsis,
};

// ============================================================
//  DELETE CONFIRM DIALOG
// ============================================================

interface DeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function DeleteDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            variant={"destructive"}
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
//  COLUMNS
// ============================================================

function buildColumns(
  onEdit: (t: Transaction) => void,
  onDelete: (t: Transaction) => void,
  onMarkPaid: (id: string) => void,
  onDuplicate: (t: Transaction) => void,
  deletingId: string | null,
  updatingId: string | null,
  is_millify_number?: boolean,
): ColumnDef<Transaction>[] {
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

    // ── Title / Contact ──────────────────────────────────────
    {
      accessorKey: "title",
      header: "Transaction",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex items-center gap-3">
            {/* Type indicator */}
            <div
              className={`flex size-8 border shrink-0 items-center justify-center rounded-full ${
                t.type === "income"
                  ? "border-green-600 text-green-600 bg-transparent dark:border-green-400 dark:text-green-400"
                  : "border-red-600 dark:border-red-400 text-red-600 dark:text-red-400"
              }`}
            >
              {t.type === "income" ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
            </div>
            <div>
              <p className="font-medium">{t.title}</p>
              {t.contact && (
                <p className="text-muted-foreground text-sm">
                  {t.contact.name}
                </p>
              )}
            </div>
          </div>
        );
      },
      enableHiding: false,
    },

    // ── Amount ───────────────────────────────────────────────
    {
      accessorKey: "amount",
      header: () => <div className="w-full text-right">Amount</div>,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div
            className={`text-right font-medium tabular-nums ${
              t.type === "income"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {t.type === "expense" ? "−" : "+"}
            {is_millify_number
              ? millifyNumbers(t.amount)
              : formatCurrency(t.amount, t.currency)}
          </div>
        );
      },
    },

    // ── Date ─────────────────────────────────────────────────
    {
      accessorKey: "transaction_date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          {formatDate(row.original.transaction_date)}
        </div>
      ),
    },

    // ── Payment Status ───────────────────────────────────────
    {
      accessorKey: "payment_status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.payment_status;
        const cfg = PAYMENT_STATUS_MAP[s];
        const Icon = cfg.icon;
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            <Icon
              className={`size-3.5 mr-1 ${
                s === "paid"
                  ? "fill-green-500 dark:fill-green-400"
                  : s === "overdue"
                    ? "fill-red-500 dark:fill-red-400"
                    : s === "pending"
                      ? "text-yellow-500"
                      : s === "partially_paid"
                        ? "text-blue-500"
                        : "text-muted-foreground"
              }`}
            />
            {cfg.name}
          </Badge>
        );
      },
    },

    // ── Payment Method ───────────────────────────────────────
    {
      accessorKey: "payment_method",
      header: "Method",
      cell: ({ row }) => {
        const method = row.original.payment_method;
        if (!method) return <span className="text-muted-foreground">—</span>;
        const cfg = PAYMENT_METHOD_MAP[method];
        const Icon = PAYMENT_METHOD_ICON[method];
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            <Icon className="size-3.5 mr-1" />
            {cfg.name}
          </Badge>
        );
      },
    },

    // ── Due Date / Reminder ──────────────────────────────────
    {
      accessorKey: "due_date",
      header: "Due / Reminder",
      cell: ({ row }) => {
        const t = row.original;
        const due = getDueDaysLabel(t.due_date);

        // Only show due for non-paid
        if (t.payment_status === "paid" || t.payment_status === "cancelled") {
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BellOff className="size-3.5 shrink-0" />
              <span className="text-sm">—</span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-0.5">
            {due && (
              <div
                className={`flex items-center gap-1.5 text-sm ${due.className}`}
              >
                <Bell className="size-3.5 shrink-0" />
                {due.label}
              </div>
            )}
            {t.due_date && (
              <span className="text-muted-foreground text-xs pl-5">
                {formatDate(t.due_date)}
              </span>
            )}
          </div>
        );
      },
    },

    // ── Tags ─────────────────────────────────────────────────
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.original.tags ?? [];
        if (!tags.length)
          return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-muted-foreground px-1.5 text-xs"
                style={
                  tag.color ? { borderColor: tag.color, color: tag.color } : {}
                }
              >
                {tag.name}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge
                variant="outline"
                className="text-muted-foreground px-1.5 text-xs"
              >
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },

    // ── Reference ────────────────────────────────────────────
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ row }) =>
        row.original.reference_number ? (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.reference_number}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },

    // ── Actions ──────────────────────────────────────────────
    {
      id: "actions",
      cell: ({ row }) => {
        const t = row.original;
        const busy = deletingId === t.id || updatingId === t.id;
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(t)}>
                <Pencil className="mr-2 size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(t)}>
                <Copy className="mr-2 size-3.5" />
                Duplicate
              </DropdownMenuItem>
              {t.payment_status !== "paid" && (
                <DropdownMenuItem onClick={() => onMarkPaid(t.id)}>
                  <CircleCheck className="mr-2 size-3.5" />
                  Mark as paid
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(t)}
              >
                <Trash2 className="mr-2 size-3.5" />
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

interface TransactionsTableProps {
  onCreateTransaction?: () => void;
  onEditTransaction?: (t: Transaction) => void;
  onDuplicateTransaction?: (t: Transaction) => void;
  contactId?: string;
}

export function TransactionsTable({
  onCreateTransaction,
  onEditTransaction,
  onDuplicateTransaction,
  contactId,
}: TransactionsTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      reference_number: false,
    });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const { settings } = useGeneralStore();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // ── delete dialog state ───────────────────────────────────
  const [deleteTarget, setDeleteTarget] = React.useState<Transaction | null>(
    null,
  );
  const [deletingBulk, setDeletingBulk] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const searchParams = useSearchParams();
  const _tag_id = searchParams.get("tag");
  const _payment_status = searchParams.get("status");
  // ── transactions hook ─────────────────────────────────────
  const {
    transactions,
    loading,
    error,
    deleting,
    updating,
    bulkDeleting,
    deleteTransaction,
    bulkDeleteTransactions,
    markAsPaid,
    setSearch,
    setType,
    setStatus,
    setMethod,
    setTags,
    setDateRange,
    setAmountRange,
    setSort,
    pagination: serverPagination,
    setPage,
    setLimit,
    setContact,
  } = useTransactions({
    withContact: true,
    withTags: true,
    pagination: { limit: 10 },
    filters: {
      ...(contactId && {
        contact_id: contactId,
      }),
      ...(_tag_id && {
        tag_ids: [_tag_id],
      }),
      ...(_payment_status && {
        payment_status: _payment_status as any,
      }),
    },
  });

  // ── tags hook (for filter dropdown) ──────────────────────
  const { tags } = useTags({ pagination: { limit: 200 } });

  // ── local filter state ────────────────────────────────────
  const [localSearch, setLocalSearch] = useQueryState("localSearch", {
    defaultValue: "",
  });
  const [typeFilter, setTypeFilter] = useQueryState("typeFilter", {
    defaultValue: "all",
  });
  const [statusFilter, setStatusFilter] = useQueryState("statusFilter", {
    defaultValue: "all",
  });
  const [methodFilter, setMethodFilter] = useQueryState("methodFilter", {
    defaultValue: "all",
  });
  const [tagFilter, setTagFilter] = useQueryState("tagFilter", {
    defaultValue: "all",
  });

  // ── debounced search ──────────────────────────────────────
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  // ── sync sorting ──────────────────────────────────────────
  React.useEffect(() => {
    if (sorting.length > 0) {
      const s = sorting[0];
      setSort(s.id as any, s.desc ? "desc" : "asc");
    }
  }, [sorting, setSort]);

  // ── sync pagination ───────────────────────────────────────
  React.useEffect(() => {
    setPage(pagination.pageIndex + 1);
    setLimit(pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, setPage, setLimit]);

  React.useEffect(() => {
    if (_payment_status) {
      setStatusFilter(_payment_status);
    }

    if (_tag_id) {
      setTagFilter(_tag_id);
    }
  }, [_payment_status]);

  // ── filter handlers ───────────────────────────────────────
  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    setType(val === "all" ? undefined : (val as any));
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setStatus(val === "all" ? undefined : (val as PaymentStatus));
  };

  const handleMethodChange = (val: string) => {
    setMethodFilter(val);
    setMethod(val === "all" ? undefined : (val as PaymentMethod));
  };

  const handleTagChange = (val: string) => {
    setTagFilter(val);
    setTags(val === "all" ? [] : [val]);
  };

  // ── delete handlers ───────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    setDeletingBulk(true);
    await bulkDeleteTransactions(ids);
    setDeletingBulk(false);
    setBulkDeleteOpen(false);
    setRowSelection({});
  };

  // React.useEffect(() => {
  //   if (contactId) {
  //     setContact(contactId);
  //   }
  // }, [contactId]);

  // ── columns ───────────────────────────────────────────────
  const columns = React.useMemo(
    () =>
      buildColumns(
        (t) => onEditTransaction?.(t),
        (t) => setDeleteTarget(t),
        (id) => markAsPaid(id),
        (t) => onDuplicateTransaction?.(t),
        deleting,
        updating,
        settings.is_millify_number,
      ),
    [
      deleting,
      updating,
      onEditTransaction,
      onDuplicateTransaction,
      markAsPaid,
      settings.is_millify_number,
    ],
  );

  // ── table ─────────────────────────────────────────────────
  const table = useReactTable({
    data: transactions,
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
    <>
      {/* ── Single delete confirm ─────────────────────────── */}
      <DeleteDialog
        open={!!deleteTarget}
        title="Delete transaction?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently deleted. This action cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={!!deleting}
      />

      {/* ── Bulk delete confirm ───────────────────────────── */}
      <DeleteDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedCount} transaction${selectedCount > 1 ? "s" : ""}?`}
        description="These transactions will be permanently deleted. This action cannot be undone."
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setBulkDeleteOpen(false)}
        loading={deletingBulk}
      />

      <div className="w-full flex flex-col justify-start gap-6">
        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          {/* Search */}
          <Input
            placeholder="Search transactions..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-8 w-full max-w-sm text-sm"
          />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Bulk delete */}
            {selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
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
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add */}
            <Button variant="outline" size="sm" onClick={onCreateTransaction}>
              <Plus />
              <span className="hidden lg:inline">Add Transaction</span>
            </Button>
          </div>
        </div>

        {/* ── Filter row ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 pt-2">
          {/* Type */}
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-fit h-8" size="sm">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" /> Income
                </span>
              </SelectItem>
              <SelectItem value="expense">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="size-3.5" /> Expense
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-fit h-8" size="sm">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="paid">
                <span className="flex items-center gap-1.5">
                  <CircleCheck className="size-3.5" /> Paid
                </span>
              </SelectItem>
              <SelectItem value="pending">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Pending
                </span>
              </SelectItem>
              <SelectItem value="overdue">
                <span className="flex items-center gap-1.5">
                  <CircleAlert className="size-3.5" /> Overdue
                </span>
              </SelectItem>
              <SelectItem value="partially_paid">
                <span className="flex items-center gap-1.5">
                  <CircleDashed className="size-3.5" /> Partially Paid
                </span>
              </SelectItem>
              <SelectItem value="cancelled">
                <span className="flex items-center gap-1.5">
                  <CircleX className="size-3.5" /> Cancelled
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Method */}
          <Select value={methodFilter} onValueChange={handleMethodChange}>
            <SelectTrigger className="w-fit h-8" size="sm">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="cash">
                <span className="flex items-center gap-1.5">
                  <Banknote className="size-3.5" /> Cash
                </span>
              </SelectItem>
              <SelectItem value="bank_transfer">
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5" /> Bank Transfer
                </span>
              </SelectItem>
              <SelectItem value="credit_card">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="size-3.5" /> Credit Card
                </span>
              </SelectItem>
              <SelectItem value="debit_card">
                <span className="flex items-center gap-1.5">
                  <Wallet className="size-3.5" /> Debit Card
                </span>
              </SelectItem>
              <SelectItem value="upi">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="size-3.5" /> UPI
                </span>
              </SelectItem>
              <SelectItem value="cheque">
                <span className="flex items-center gap-1.5">
                  <FileText className="size-3.5" /> Cheque
                </span>
              </SelectItem>
              <SelectItem value="crypto">
                <span className="flex items-center gap-1.5">
                  <Bitcoin className="size-3.5" /> Crypto
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Tags (from useTags) */}
          {tags.length > 0 && (
            <Select value={tagFilter} onValueChange={handleTagChange}>
              <SelectTrigger className="w-fit h-8" size="sm">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5" /> All tags
                  </span>
                </SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <span className="flex items-center gap-1.5">
                      {tag.color && (
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      {tag.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Result count */}
          <span className="ml-auto text-muted-foreground text-sm">
            {loading
              ? "Loading..."
              : `${serverPagination.total} transaction(s)`}
          </span>
        </div>

        {/* ── Error ────────────────────────────────────────── */}
        {error && (
          <div className="mx-4 lg:mx-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Table ────────────────────────────────────────── */}
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
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ─────────────────────────────────── */}
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {selectedCount > 0
                ? `${selectedCount} of ${serverPagination.total} row(s) selected.`
                : `${serverPagination.total} transaction(s) total.`}
            </div>

            <div className="flex w-full items-center gap-8 lg:w-fit">
              {/* Rows per page */}
              <div className="hidden items-center gap-2 lg:flex">
                <Label
                  htmlFor="rows-per-page-txn"
                  className="text-sm font-medium"
                >
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-20"
                    id="rows-per-page-txn"
                  >
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

              {/* Page indicator */}
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {serverPagination.page} of{" "}
                {serverPagination.totalPages || 1}
              </div>

              {/* Nav buttons */}
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
      </div>
    </>
  );
}
