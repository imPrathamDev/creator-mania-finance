"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Trash2,
  Loader,
  Hash,
  Link as LinkIcon,
  Receipt,
  Settings as SettingsIcon,
  BarChart3,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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

import { useGeneralStore } from "@/context/genral-context";
import type { Settings } from "@/types/context";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// ============================================================
//  TYPES
// ============================================================

interface EmailEntry {
  id: number;
  email: string;
  created_at: string;
}

// ============================================================
//  SECTION CARD  — consistent wrapper
// ============================================================

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ============================================================
//  SETTING ROW  — label + description + control on right
// ============================================================

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 border-b last:border-b-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ============================================================
//  SETTINGS PAGE
// ============================================================

export default function SettingsPage() {
  const { settings, setSettings } = useGeneralStore();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ── email list state ───────────────────────────────────
  const [emails, setEmails] = React.useState<EmailEntry[]>([]);
  const [emailsLoading, setEmailsLoading] = React.useState(true);
  const [emailsError, setEmailsError] = React.useState<string | null>(null);
  const [newEmail, setNewEmail] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EmailEntry | null>(
    null,
  );
  const [deleting, setDeleting] = React.useState(false);

  // ── load emails ────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setEmailsLoading(true);
    supabase
      .from("email_list")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setEmailsError(error.message);
        else setEmails((data ?? []) as EmailEntry[]);
        setEmailsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── setting helpers ────────────────────────────────────
  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const setFieldSetting = (key: keyof Settings["field"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      field: { ...prev.field, [key]: value },
    }));
  };

  // ── add email ──────────────────────────────────────────
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setAddError("Enter a valid email address");
      return;
    }
    if (emails.some((e) => e.email === trimmed)) {
      setAddError("Email already in list");
      return;
    }

    setAddError(null);
    setAdding(true);
    const { data, error } = await supabase
      .from("email_list")
      .insert({ email: trimmed })
      .select()
      .single();

    setAdding(false);
    if (error) {
      setAddError(error.message);
    } else {
      setEmails((prev) => [data as EmailEntry, ...prev]);
      setNewEmail("");
    }
  };

  // ── delete email ───────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("email_list")
      .delete()
      .eq("id", deleteTarget.id);

    setDeleting(false);
    if (!error) {
      setEmails((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  function fmtDate(d: string) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  }

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <>
      {/* ── Delete email confirm ─────────────────────────── */}
      <AlertDialog open={!!deleteTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove email?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{deleteTarget?.email}</span> will be
              removed from the notification list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-6 px-4 lg:px-6 py-6 max-w-3xl">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your app preferences and notification list.
          </p>
        </div>

        {/* ── General ───────────────────────────────────────── */}
        <SectionCard
          title="General"
          description="Control how numbers and data are displayed across the app."
          icon={SettingsIcon}
        >
          <SettingRow
            label="Compact numbers"
            description="Show large numbers in short form — ₹1,20,000 becomes ₹1.2L"
          >
            <Switch
              checked={mounted ? !!settings.is_millify_number : false}
              onCheckedChange={(v) => setSetting("is_millify_number", v)}
            />
          </SettingRow>

          <SettingRow
            label="AI Model"
            description="Model used for the AI financial assistant."
          >
            <Badge
              variant="outline"
              className="text-muted-foreground px-1.5 font-mono text-xs"
              suppressHydrationWarning
            >
              {mounted ? settings.model : "gpt-4o"}
            </Badge>
          </SettingRow>
        </SectionCard>

        {/* ── Transaction Fields ────────────────────────────── */}
        <SectionCard
          title="Transaction Fields"
          description="Choose which optional fields are visible when creating or viewing transactions."
          icon={Receipt}
        >
          <SettingRow
            label="Invoice Number"
            description="Track invoice numbers on transactions."
          >
            <Switch
              checked={mounted ? !!settings.field?.invoice_number : false}
              onCheckedChange={(v) => setFieldSetting("invoice_number", v)}
            />
          </SettingRow>

          <SettingRow
            label="Reference Number"
            description="Track bank / payment reference numbers."
          >
            <Switch
              checked={mounted ? !!settings.field?.reference_number : false}
              onCheckedChange={(v) => setFieldSetting("reference_number", v)}
            />
          </SettingRow>

          <SettingRow
            label="Receipt URL"
            description="Attach receipt links to transactions."
          >
            <Switch
              checked={mounted ? !!settings.field?.receipt_url : false}
              onCheckedChange={(v) => setFieldSetting("receipt_url", v)}
            />
          </SettingRow>
        </SectionCard>

        {/* ── Email Notification List ───────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-muted-foreground" />
              Email Notification List
            </CardTitle>
            <CardDescription>
              Emails added here receive reminders and payment notifications.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {/* Add email form */}
            <form onSubmit={handleAddEmail} className="flex items-start gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setAddError(null);
                  }}
                  className={`h-8 text-sm ${addError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  disabled={adding}
                />
                {addError && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" />
                    {addError}
                  </span>
                )}
              </div>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                disabled={adding || !newEmail.trim()}
              >
                {adding ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add
              </Button>
            </form>

            {/* Error loading emails */}
            {emailsError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {emailsError}
              </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {emailsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {[1, 2, 3].map((j) => (
                          <TableCell key={j}>
                            <div className="h-4 animate-pulse rounded bg-muted" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : emails.length ? (
                    emails.map((entry) => (
                      <TableRow key={entry.id} data-state={undefined}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                              {entry.email[0].toUpperCase()}
                            </div>
                            <span className="text-sm">{entry.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm tabular-nums">
                            {fmtDate(entry.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(entry)}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <Mail className="size-8 opacity-40" />
                          No emails added yet.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {emails.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {emails.length} email{emails.length !== 1 ? "s" : ""} in
                notification list
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
