"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader,
  TrendingUp,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useBanks, type Bank } from "@/hooks/use-banks";
import { fmt, fmtDate, balanceClass } from "@/lib/utils";
// ============================================================
//  HELPERS
// ============================================================

// ============================================================
//  INLINE CELL EDITOR  (used inside table cell)
// ============================================================

interface CellEditorProps {
  value: string;
  type?: "text" | "number";
  onSave: (v: string) => Promise<void>;
  onCancel: () => void;
}

function CellEditor({
  value: initial,
  type = "text",
  onSave,
  onCancel,
}: CellEditorProps) {
  const [val, setVal] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const save = async () => {
    if (!val.trim()) return;
    setSaving(true);
    await onSave(val);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={ref}
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onCancel();
        }}
        className="h-7 text-sm w-full"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        disabled={saving}
        onClick={save}
      >
        {saving ? (
          <Loader className="size-3 animate-spin" />
        ) : (
          <Check className="size-3 text-green-600" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={onCancel}
      >
        <X className="size-3 text-muted-foreground" />
      </Button>
    </div>
  );
}

// ============================================================
//  ADD BANK DIALOG
// ============================================================

interface AddBankDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, balance: number) => Promise<void>;
  creating: boolean;
}

function AddBankDialog({
  open,
  onClose,
  onCreate,
  creating,
}: AddBankDialogProps) {
  const [name, setName] = React.useState("");
  const [balance, setBalance] = React.useState("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate(name.trim(), Number(balance));
    setName("");
    setBalance("0");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
          <DialogDescription>
            Add a new bank or account to track.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bank-name">Name</Label>
              <Input
                id="bank-name"
                placeholder="e.g. HDFC Savings, Petty Cash"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bank-balance">Opening Balance (₹)</Label>
              <Input
                id="bank-balance"
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? (
                <Loader className="size-4 animate-spin mr-2" />
              ) : null}
              Add Bank
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
//  BANKS PAGE
// ============================================================

export default function BanksPage() {
  const {
    banks,
    loading,
    error,
    creating,
    updating,
    deleting,
    totalBalance,
    createBank,
    updateBank,
    deleteBank,
  } = useBanks();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Bank | null>(null);

  // inline edit state: { bankId: "name" | "balance" }
  const [editing, setEditing] = React.useState<{
    id: string;
    field: "name" | "balance";
  } | null>(null);

  // ── handlers ────────────────────────────────────────────
  const handleCreate = async (name: string, balance: number) => {
    await createBank({ name, balance });
    setAddOpen(false);
  };

  const handleUpdate = async (
    id: string,
    field: "name" | "balance",
    val: string,
  ) => {
    await updateBank(id, { [field]: field === "balance" ? Number(val) : val });
    setEditing(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteBank(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ── columns ──────────────────────────────────────────────
  const columns: ColumnDef<Bank>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Account
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="size-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronsUpDown className="size-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const b = row.original;
        const isEditing = editing?.id === b.id && editing.field === "name";
        const initials = b.name.slice(0, 2).toUpperCase();

        if (isEditing) {
          return (
            <CellEditor
              value={b.name}
              onSave={(v) => handleUpdate(b.id, "name", v)}
              onCancel={() => setEditing(null)}
            />
          );
        }
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {initials}
            </div>
            <div className="flex items-center gap-1.5 group/name">
              <span className="font-medium">{b.name}</span>
              <button
                onClick={() => setEditing({ id: b.id, field: "name" })}
                className="opacity-0 group-hover/name:opacity-100 transition-opacity"
              >
                <Pencil className="size-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <div className="text-right">
          <button
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-foreground ml-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Balance
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="size-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronsUpDown className="size-3 opacity-40" />
            )}
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const b = row.original;
        const isEditing = editing?.id === b.id && editing.field === "balance";
        const busy = updating === b.id;

        if (isEditing) {
          return (
            <div className="flex justify-end">
              <div className="w-40">
                <CellEditor
                  value={String(b.balance)}
                  type="number"
                  onSave={(v) => handleUpdate(b.id, "balance", v)}
                  onCancel={() => setEditing(null)}
                />
              </div>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1.5 group/bal">
            {busy ? (
              <Loader className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <span
                className={`font-medium tabular-nums ${balanceClass(b.balance)}`}
              >
                {fmt(b.balance)}
              </span>
            )}
            <button
              onClick={() => setEditing({ id: b.id, field: "balance" })}
              className="opacity-0 group-hover/bal:opacity-100 transition-opacity"
            >
              <Pencil className="size-3 text-muted-foreground" />
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Added",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {fmtDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const b = row.original;
        const busy = deleting === b.id;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive data-[state=open]:bg-muted"
            disabled={busy}
            onClick={() => setDeleteTarget(b)}
          >
            {busy ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: banks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <>
      {/* ── Delete confirm ───────────────────────────────── */}
      <AlertDialog open={!!deleteTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              disabled={!!deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add dialog ───────────────────────────────────── */}
      <AddBankDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
        creating={creating}
      />

      <div className="flex flex-col gap-6 px-4 lg:px-6 py-6">
        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Bank Accounts</h1>
            <p className="text-sm text-muted-foreground">
              {banks.length} account{banks.length !== 1 ? "s" : ""} · Total{" "}
              <span className={balanceClass(totalBalance)}>
                {fmt(totalBalance)}
              </span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            Add Bank
          </Button>
        </div>

        {/* ── Error ───────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Table ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} colSpan={h.colSpan}>
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
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
                      <Landmark className="size-8 opacity-40" />
                      No bank accounts yet.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Total row ───────────────────────────────────── */}
        {!loading && banks.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5">
            <span className="text-sm font-medium">Total Balance</span>
            <span
              className={`text-sm font-bold tabular-nums ${balanceClass(totalBalance)}`}
            >
              {fmt(totalBalance)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
