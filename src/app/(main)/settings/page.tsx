"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Trash2,
  Loader,
  Receipt,
  Settings as SettingsIcon,
  AlertCircle,
  UserPlus,
  UserMinus,
  ShieldAlert,
  Eye,
  EyeOff,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useGeneralStore } from "@/context/genral-context";
import type { Settings } from "@/types/context";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const ALLOWED_EMAIL = "harsh@creatormania.in";
const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-users`;

// ============================================================
//  TYPES
// ============================================================

interface EmailEntry {
  id: number;
  email: string;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

// ============================================================
//  SECTION CARD
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
//  SETTING ROW
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
//  USER MANAGEMENT SECTION
// ============================================================

function UserManagementSection() {
  const [callerEmail, setCallerEmail] = React.useState<string | null>(null);
  const [callerToken, setCallerToken] = React.useState<string | null>(null);

  // Create user state
  const [createEmail, setCreateEmail] = React.useState("");
  const [createPassword, setCreatePassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);

  // Delete user state
  const [deleteEmail, setDeleteEmail] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<{ email: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = React.useState<string | null>(null);

  // Load current session
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session) {
        setCallerEmail(session.user.email ?? null);
        setCallerToken(session.access_token);
      }
    });
  }, []);

  const isAllowed = callerEmail === ALLOWED_EMAIL;

  async function callEdge(body: Record<string, string>) {
    if (!callerToken) throw new Error("Not authenticated");
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${callerToken}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  }

  // ── Create ─────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    const email = createEmail.trim().toLowerCase();
    if (!email || !createPassword) {
      setCreateError("Email and password are required");
      return;
    }
    setCreating(true);
    try {
      const data = await callEdge({ action: "create", email, password: createPassword });
      setCreateSuccess(`User ${data.user?.email} created successfully`);
      setCreateEmail("");
      setCreatePassword("");
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    setDeleting(true);
    try {
      await callEdge({ action: "delete", email: deleteTarget.email });
      setDeleteSuccess(`User ${deleteTarget.email} deleted successfully`);
      setDeleteEmail("");
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget?.email}</span> and
              revoke their access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-muted-foreground" />
            User Management
          </CardTitle>
          <CardDescription className="flex items-center justify-between gap-2 flex-wrap">
            <span>Create or remove user accounts in the system.</span>
            {!isAllowed && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <ShieldAlert className="size-3" />
                View only — actions restricted to {ALLOWED_EMAIL}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="create" className="flex-1 gap-1.5">
                <UserPlus className="size-3.5" />
                Create User
              </TabsTrigger>
              <TabsTrigger value="delete" className="flex-1 gap-1.5">
                <UserMinus className="size-3.5" />
                Delete User
              </TabsTrigger>
            </TabsList>

            {/* ── CREATE TAB ──────────────────────────────── */}
            <TabsContent value="create">
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-user-email" className="text-sm">
                    Email address
                  </Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    placeholder="user@example.com"
                    value={createEmail}
                    onChange={(e) => {
                      setCreateEmail(e.target.value);
                      setCreateError(null);
                      setCreateSuccess(null);
                    }}
                    disabled={!isAllowed || creating}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-user-password" className="text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-user-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={createPassword}
                      onChange={(e) => {
                        setCreatePassword(e.target.value);
                        setCreateError(null);
                        setCreateSuccess(null);
                      }}
                      disabled={!isAllowed || creating}
                      className="h-8 text-sm pr-8"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {createError && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3 shrink-0" />
                    {createError}
                  </p>
                )}
                {createSuccess && (
                  <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ {createSuccess}
                  </p>
                )}

                <Button
                  type="submit"
                  size="sm"
                  className="self-start h-8"
                  disabled={!isAllowed || creating || !createEmail || !createPassword}
                >
                  {creating ? (
                    <Loader className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <UserPlus className="size-3.5 mr-1.5" />
                  )}
                  {creating ? "Creating…" : "Create User"}
                </Button>
              </form>
            </TabsContent>

            {/* ── DELETE TAB ──────────────────────────────── */}
            <TabsContent value="delete">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="del-user-email" className="text-sm">
                    User email to delete
                  </Label>
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <Input
                        id="del-user-email"
                        type="email"
                        placeholder="user@example.com"
                        value={deleteEmail}
                        onChange={(e) => {
                          setDeleteEmail(e.target.value);
                          setDeleteError(null);
                          setDeleteSuccess(null);
                        }}
                        disabled={!isAllowed || deleting}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 shrink-0"
                      disabled={!isAllowed || deleting || !deleteEmail.trim()}
                      onClick={() => {
                        const trimmed = deleteEmail.trim().toLowerCase();
                        if (!trimmed) return;
                        setDeleteError(null);
                        setDeleteSuccess(null);
                        setDeleteTarget({ email: trimmed });
                      }}
                    >
                      <Trash2 className="size-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                {deleteError && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3 shrink-0" />
                    {deleteError}
                  </p>
                )}
                {deleteSuccess && (
                  <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ {deleteSuccess}
                  </p>
                )}

                <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                  <span>
                    Deleting a user is irreversible. Their account and all associated
                    sessions will be permanently removed.
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
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
  const [deleteTarget, setDeleteTarget] = React.useState<EmailEntry | null>(null);
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
            <AlertDialogCancel onClick={() => setDeleteTarget(null)} disabled={deleting}>
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

        {/* ── User Management ───────────────────────────────── */}
        <UserManagementSection />
      </div>
    </>
  );
}