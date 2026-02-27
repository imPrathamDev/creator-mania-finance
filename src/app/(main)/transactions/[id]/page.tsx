"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Pencil,
  Check,
  X,
  Building2,
  Phone,
  Mail,
  Globe,
  Calendar,
  Bell,
  Tag,
  Paperclip,
  FileText,
  Receipt,
  StickyNote,
  Clock,
  UserCheck,
  ShoppingCart,
  Users,
  Loader,
  Trash2,
  MoreVertical,
  CircleCheck,
  Hash,
  Link as LinkIcon,
  CircleMinus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  PAYMENT_METHOD_MAP,
  PAYMENT_STATUS_MAP,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from "@/hooks/use-payments-helpers";
import type {
  Transaction,
  TransactionUpdate,
} from "@/types/hooks/use-transactions";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ============================================================
//  EXTENDED TYPES
// ============================================================

interface FullContact {
  id: string;
  name: string;
  type: "client" | "vendor" | "both";
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
}

interface Reminder {
  id: string;
  remind_at: string;
  status: "pending" | "sent" | "dismissed" | "snoozed";
  message: string | null;
  notify_via: string[];
  snoozed_until: string | null;
}

interface FullTransaction extends Omit<Transaction, "contact"> {
  contact: FullContact | null;
  reminders: Reminder[];
}

// ============================================================
//  HELPERS
// ============================================================

function fmt(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(d: string | null, withTime = false) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(d));
}

function dueDiffLabel(due: string | null, status: PaymentStatus) {
  if (!due || status === "paid" || status === "cancelled") return null;
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)
    return {
      text: `${Math.abs(diff)}d overdue`,
      cls: "text-red-600 dark:text-red-400",
    };
  if (diff === 0)
    return { text: "Due today", cls: "text-orange-600 dark:text-orange-400" };
  if (diff <= 7)
    return {
      text: `Due in ${diff}d`,
      cls: "text-yellow-600 dark:text-yellow-400",
    };
  return null;
}

const CONTACT_TYPE_CONFIG = {
  client: { label: "Client", icon: UserCheck },
  vendor: { label: "Vendor", icon: ShoppingCart },
  both: { label: "Both", icon: Users },
} as const;

const REMINDER_STATUS_CONFIG: Record<
  string,
  { label: string; dotCls: string }
> = {
  pending: { label: "Pending", dotCls: "bg-yellow-500" },
  sent: { label: "Sent", dotCls: "bg-green-500" },
  dismissed: { label: "Dismissed", dotCls: "bg-gray-400" },
  snoozed: { label: "Snoozed", dotCls: "bg-blue-500" },
};

// ============================================================
//  SECTION CARD  — consistent card wrapper
// ============================================================

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="size-4 text-muted-foreground" />
            {title}
          </span>
          {action}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// ============================================================
//  INLINE EDITABLE FIELD
// ============================================================

interface InlineFieldProps {
  label: string;
  value: string | null | undefined;
  onSave: (val: string | null) => Promise<void>;
  type?: "text" | "textarea" | "number" | "date";
  empty?: string;
  mono?: boolean;
}

function InlineField({
  label,
  value,
  onSave,
  type = "text",
  empty = "—",
  mono,
}: InlineFieldProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? "");
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<any>(null);

  React.useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const open = () => {
    setDraft(value ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const close = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    await onSave(draft.trim() || null);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>

      {editing ? (
        <div className="flex items-start gap-1.5">
          {type === "textarea" ? (
            <Textarea
              ref={inputRef}
              value={draft}
              rows={3}
              className="text-sm resize-none"
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            <Input
              ref={inputRef}
              type={type}
              value={draft}
              className="h-8 text-sm"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") close();
              }}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            disabled={saving}
            onClick={save}
          >
            {saving ? (
              <Loader className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5 text-green-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={close}
          >
            <X className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        <button
          onClick={open}
          className="group flex items-center gap-1.5 text-left rounded px-1 -mx-1 py-0.5 hover:bg-muted/50 transition-colors w-full"
        >
          <span
            className={`text-sm flex-1 ${value ? "text-foreground" : "text-muted-foreground italic"} ${mono ? "font-mono" : ""}`}
          >
            {value || empty}
          </span>
          <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      )}
    </div>
  );
}

// ============================================================
//  INLINE SELECT FIELD
// ============================================================

interface InlineSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSave: (val: string) => Promise<void>;
  render: (val: string) => React.ReactNode;
}

function InlineSelectField({
  label,
  value,
  options,
  onSave,
  render,
}: InlineSelectProps) {
  const [saving, setSaving] = React.useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {saving ? (
        <Loader className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <Select
          value={value}
          onValueChange={async (v) => {
            setSaving(true);
            await onSave(v);
            setSaving(false);
          }}
        >
          <SelectTrigger className="border-0 p-0 h-auto shadow-none w-fit gap-1.5 focus:ring-0 [&>svg]:opacity-40 hover:[&>svg]:opacity-100">
            <SelectValue>{render(value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ============================================================
//  FETCH
// ============================================================

async function fetchFullTransaction(
  id: string,
): Promise<FullTransaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      contact:contacts(id, name, type, company, email, phone, website, is_active),
      tags:transaction_tags(tag:tags(id, name, color)),
      reminders(id, remind_at, status, message, notify_via, snoozed_until)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    tags: (data.tags ?? []).map((t: any) => t.tag).filter(Boolean),
    reminders: data.reminders ?? [],
  } as FullTransaction;
}

// ============================================================
//  PAGE
// ============================================================

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [txn, setTxn] = React.useState<FullTransaction | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // ── load ────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFullTransaction(id).then((data) => {
      if (cancelled) return;
      if (!data) setPageError("Transaction not found");
      else setTxn(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── update helper ─────────────────────────────────────
  const patch = React.useCallback(
    async (updates: TransactionUpdate) => {
      if (!txn) return;
      const { data, error } = await supabase
        .from("transactions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", txn.id)
        .select()
        .single();
      if (!error && data)
        setTxn((prev) => (prev ? ({ ...prev, ...data } as any) : prev));
    },
    [txn],
  );

  // field shortcuts
  const patchField =
    (key: keyof TransactionUpdate) => async (val: string | null) =>
      patch({ [key]: val ?? null } as any);

  // ── delete ────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from("transactions").delete().eq("id", id);
    setDeleting(false);
    router.push("/transactions");
  };

  // ── mark paid ─────────────────────────────────────────
  const handleMarkPaid = () =>
    patch({
      payment_status: "paid",
      paid_date: new Date().toISOString().split("T")[0],
    });

  // ── loading / error states ───────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageError || !txn) {
    return (
      <div className="px-4 lg:px-6 mt-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError ?? "Transaction not found"}
        </div>
      </div>
    );
  }

  // ── derived ───────────────────────────────────────────
  const isIncome = txn.type === "income";
  const statusCfg = PAYMENT_STATUS_MAP[txn.payment_status];
  const methodCfg = txn.payment_method
    ? PAYMENT_METHOD_MAP[txn.payment_method]
    : null;
  const StatusIcon = statusCfg.icon;
  const MethodIcon = methodCfg?.icon;
  const dueDiff = dueDiffLabel(txn.due_date, txn.payment_status);
  const contact = txn.contact;
  const tags = txn.tags ?? [];
  const reminders = txn.reminders ?? [];
  const attachments = txn.attachments ?? [];

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <>
      {/* ── Delete dialog ──────────────────────────────────── */}
      <AlertDialog open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{txn.title}&rdquo; will be permanently deleted. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-6 px-4 lg:px-6 py-6">
        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {txn.payment_status !== "paid" &&
              txn.payment_status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkPaid}
                  className="gap-1.5"
                >
                  <CircleCheck className="size-4" />
                  Mark as paid
                </Button>
              )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Hero banner ─────────────────────────────────── */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 lg:p-6">
          {/* type icon */}
          <div
            className={`flex size-14 shrink-0 items-center justify-center rounded-full ${
              isIncome
                ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {isIncome ? (
              <TrendingUp className="size-7" />
            ) : (
              <TrendingDown className="size-7" />
            )}
          </div>

          {/* title + badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{txn.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Status — clickable select */}
              <InlineSelectField
                label=""
                value={txn.payment_status}
                options={PAYMENT_STATUSES.map((s) => ({
                  value: s.key,
                  label: s.name,
                }))}
                onSave={(v) => patch({ payment_status: v as PaymentStatus })}
                render={(v) => {
                  const cfg = PAYMENT_STATUS_MAP[v as PaymentStatus];
                  const Icon = cfg.icon;
                  return (
                    <Badge
                      variant="outline"
                      className={`text-muted-foreground px-1.5 ${cfg.border} ${cfg.bg}`}
                    >
                      <Icon
                        className={`size-3.5 mr-1 ${
                          v === "paid"
                            ? "fill-green-500 dark:fill-green-400"
                            : v === "overdue"
                              ? "fill-red-500 dark:fill-red-400"
                              : cfg.color
                        }`}
                      />
                      <span className={cfg.color}>{cfg.name}</span>
                    </Badge>
                  );
                }}
              />

              <Badge variant="outline" className="text-muted-foreground px-1.5">
                {isIncome ? "Income" : "Expense"}
              </Badge>

              {dueDiff && (
                <span className={`text-xs font-medium ${dueDiff.cls}`}>
                  {dueDiff.text}
                </span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div
            className={`text-right shrink-0 ${
              isIncome
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            <div className="text-3xl font-bold tabular-nums">
              {isIncome ? "+" : "−"}
              {fmt(txn.amount, txn.currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {txn.currency}
            </div>
          </div>
        </div>

        {/* ── Main grid ──────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* ═══ LEFT COL (2/3) ═══════════════════════════════ */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* Details */}
            <SectionCard title="Transaction Details" icon={Receipt}>
              <div className="grid gap-5 sm:grid-cols-2">
                <InlineField
                  label="Title"
                  value={txn.title}
                  onSave={patchField("title")}
                />
                <InlineSelectField
                  label="Type"
                  value={txn.type}
                  options={[
                    { value: "income", label: "Income" },
                    { value: "expense", label: "Expense" },
                  ]}
                  onSave={(v) => patch({ type: v as any })}
                  render={(v) => (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground px-1.5"
                    >
                      {v === "income" ? (
                        <TrendingUp className="size-3.5 mr-1 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="size-3.5 mr-1 text-red-600   dark:text-red-400" />
                      )}
                      {v === "income" ? "Income" : "Expense"}
                    </Badge>
                  )}
                />
                <InlineField
                  label="Amount"
                  value={String(txn.amount)}
                  onSave={async (v) => patch({ amount: Number(v) })}
                  type="number"
                />
                <InlineField
                  label="Currency"
                  value={txn.currency}
                  onSave={patchField("currency")}
                />
                <InlineSelectField
                  label="Payment Method"
                  value={txn.payment_method ?? "other"}
                  options={PAYMENT_METHODS.map((m) => ({
                    value: m.key,
                    label: m.name,
                  }))}
                  onSave={(v) => patch({ payment_method: v as PaymentMethod })}
                  render={(v) => {
                    const cfg = PAYMENT_METHOD_MAP[v as PaymentMethod];
                    const Icon = cfg?.icon;
                    return (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground px-1.5"
                      >
                        {Icon && <Icon className="size-3.5 mr-1" />}
                        {cfg?.name ?? v}
                      </Badge>
                    );
                  }}
                />
                <InlineField
                  label="Description"
                  value={txn.description}
                  onSave={patchField("description")}
                  type="textarea"
                  empty="Add description…"
                />
              </div>
            </SectionCard>

            {/* Dates */}
            <SectionCard title="Dates" icon={Calendar}>
              <div className="grid gap-5 sm:grid-cols-3">
                <InlineField
                  label="Transaction Date"
                  value={txn.transaction_date}
                  onSave={patchField("transaction_date")}
                  type="date"
                />
                <InlineField
                  label="Due Date"
                  value={txn.due_date}
                  onSave={patchField("due_date")}
                  type="date"
                  empty="Not set"
                />
                <InlineField
                  label="Paid Date"
                  value={txn.paid_date}
                  onSave={patchField("paid_date")}
                  type="date"
                  empty="Not paid"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Created
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {fmtDate(txn.created_at, true)}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Last updated
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {fmtDate(txn.updated_at, true)}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* References */}
            <SectionCard title="References" icon={Hash}>
              <div className="grid gap-5 sm:grid-cols-2">
                <InlineField
                  label="Invoice Number"
                  value={txn.invoice_number}
                  onSave={patchField("invoice_number")}
                  mono
                  empty="Not set"
                />
                <InlineField
                  label="Reference Number"
                  value={txn.reference_number}
                  onSave={patchField("reference_number")}
                  mono
                  empty="Not set"
                />
                <div className="sm:col-span-2">
                  <InlineField
                    label="Receipt URL"
                    value={txn.receipt_url}
                    onSave={patchField("receipt_url")}
                    empty="Not set"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Notes */}
            <SectionCard title="Notes" icon={StickyNote}>
              <InlineField
                label=""
                value={txn.notes}
                onSave={patchField("notes")}
                type="textarea"
                empty="Click to add a note…"
              />
            </SectionCard>

            {/* Reminders */}
            {reminders.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Bell className="size-4 text-muted-foreground" />
                    Reminders
                    <Badge
                      variant="outline"
                      className="text-muted-foreground px-1.5 ml-auto text-xs"
                    >
                      {reminders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead>Remind At</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Notify Via</TableHead>
                          <TableHead>Snoozed Until</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reminders.map((r) => {
                          const cfg = REMINDER_STATUS_CONFIG[r.status];
                          return (
                            <TableRow key={r.id}>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="size-3.5 shrink-0" />
                                  <span className="text-sm tabular-nums">
                                    {fmtDate(r.remind_at, true)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground px-1.5 gap-1"
                                >
                                  <span
                                    className={`size-1.5 rounded-full shrink-0 ${cfg?.dotCls ?? "bg-gray-400"}`}
                                  />
                                  {cfg?.label ?? r.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {r.message ?? "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {r.notify_via?.length ? (
                                    r.notify_via.map((v) => (
                                      <Badge
                                        key={v}
                                        variant="outline"
                                        className="text-muted-foreground px-1.5 text-xs capitalize"
                                      >
                                        {v}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground tabular-nums">
                                  {r.snoozed_until
                                    ? fmtDate(r.snoozed_until, true)
                                    : "—"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <SectionCard title="Attachments" icon={Paperclip}>
                <div className="flex flex-col gap-2">
                  {attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{att.name}</span>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground px-1.5 text-xs shrink-0"
                      >
                        {att.type}
                      </Badge>
                    </a>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* ═══ RIGHT COL (1/3) ═══════════════════════════════ */}
          <div className="flex flex-col gap-4">
            {/* Tags */}
            <SectionCard title="Tags" icon={Tag}>
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">
                  No tags assigned
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-muted-foreground px-1.5"
                      style={
                        tag.color
                          ? { borderColor: tag.color, color: tag.color }
                          : {}
                      }
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Contact */}
            {contact &&
              (() => {
                const cfg =
                  CONTACT_TYPE_CONFIG[
                    contact.type as keyof typeof CONTACT_TYPE_CONFIG
                  ];
                const TypeIcon = cfg?.icon ?? Users;
                const initials = contact.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();
                return (
                  <SectionCard title="Contact" icon={Users}>
                    <div className="flex flex-col gap-4">
                      {/* avatar + name */}
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{contact.name}</p>
                          {contact.company && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="size-3" />
                              {contact.company}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* type + status */}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-muted-foreground px-1.5"
                        >
                          <TypeIcon className="size-3.5 mr-1" />
                          {cfg?.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-muted-foreground px-1.5"
                        >
                          {contact.is_active ? (
                            <CircleCheck className="size-3.5 mr-1 fill-green-500 dark:fill-green-400 text-white dark:text-black" />
                          ) : (
                            <CircleMinus className="size-3.5 mr-1" />
                          )}
                          {contact.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <Separator />

                      {/* contact info */}
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            <Phone className="size-3.5 shrink-0" />
                            {contact.phone}
                          </a>
                        )}
                        {contact.website && (
                          <a
                            href={contact.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            <Globe className="size-3.5 shrink-0" />
                            <span className="truncate">
                              {contact.website.replace(/^https?:\/\//, "")}
                            </span>
                          </a>
                        )}
                        {!contact.email &&
                          !contact.phone &&
                          !contact.website && (
                            <span className="italic">No contact info</span>
                          )}
                      </div>
                    </div>
                  </SectionCard>
                );
              })()}

            {/* Quick summary card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Quick Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Amount", value: fmt(txn.amount, txn.currency) },
                    { label: "Status", value: statusCfg.name },
                    { label: "Method", value: methodCfg?.name ?? "—" },
                    { label: "Txn Date", value: fmtDate(txn.transaction_date) },
                    { label: "Due Date", value: fmtDate(txn.due_date) },
                    { label: "Paid Date", value: fmtDate(txn.paid_date) },
                    {
                      label: "Tags",
                      value: tags.length
                        ? tags.map((t) => t.name).join(", ")
                        : "None",
                    },
                    { label: "Reminders", value: String(reminders.length) },
                    { label: "Attachments", value: String(attachments.length) },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-xs font-medium text-right truncate max-w-[60%]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
