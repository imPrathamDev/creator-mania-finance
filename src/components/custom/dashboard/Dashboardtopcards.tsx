"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import {
  TrendingUp,
  TrendingDown,
  UserCheck,
  ShoppingCart,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ContactStat, TopTransaction } from "@/lib/analytics";

// ============================================================
//  HELPERS
// ============================================================

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
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

const CONTACT_TYPE_CONFIG = {
  client: { label: "Client", icon: UserCheck },
  vendor: { label: "Vendor", icon: ShoppingCart },
  both: { label: "Both", icon: Users },
} as const;

// Skeleton row
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ============================================================
//  1.  TOP CONTACTS CARD
// ============================================================

const contactColumns: ColumnDef<ContactStat>[] = [
  {
    accessorKey: "contact_name",
    header: "Contact",
    cell: ({ row }) => {
      const c = row.original;
      const initials = c.contact_name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      const cfg =
        CONTACT_TYPE_CONFIG[c.contact_type as keyof typeof CONTACT_TYPE_CONFIG];
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {initials}
          </div>
          <div>
            <p className="font-medium leading-none">{c.contact_name}</p>
            {c.company && (
              <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                <Building2 className="size-3" />
                {c.company}
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "contact_type",
    header: "Type",
    cell: ({ row }) => {
      const cfg =
        CONTACT_TYPE_CONFIG[
          row.original.contact_type as keyof typeof CONTACT_TYPE_CONFIG
        ];
      if (!cfg) return null;
      const Icon = cfg.icon;
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          <Icon className="size-3.5 mr-1" />
          {cfg.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "total_income",
    header: () => <div className="text-right">Income</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums text-green-600 dark:text-green-400">
        {formatCurrency(row.original.total_income)}
      </div>
    ),
  },
  {
    accessorKey: "total_expense",
    header: () => <div className="text-right">Expense</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums text-red-600 dark:text-red-400">
        {formatCurrency(row.original.total_expense)}
      </div>
    ),
  },
  {
    accessorKey: "txn_count",
    header: () => <div className="text-right">Txns</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {row.original.txn_count}
      </div>
    ),
  },
];

interface TopContactsCardProps {
  data: ContactStat[];
  loading?: boolean;
  onViewAll?: () => void;
}

export function TopContactsCard({
  data,
  loading = false,
  onViewAll,
}: TopContactsCardProps) {
  const table = useReactTable({
    data,
    columns: contactColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Top Contacts</CardTitle>
        <CardDescription>
          Most active clients and vendors this period
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 flex-1">
        <div className="overflow-hidden">
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
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={contactColumns.length} />
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
                    colSpan={contactColumns.length}
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
      </CardContent>

      {onViewAll && (
        <CardFooter className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewAll}
          >
            View all contacts
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ============================================================
//  2 & 3.  TOP TRANSACTIONS CARD  (income OR expense)
// ============================================================

const txnColumns = (
  type: "income" | "expense",
): ColumnDef<TopTransaction>[] => [
  {
    accessorKey: "title",
    header: "Transaction",
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
              type === "income"
                ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {type === "income" ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
          </div>
          <div>
            <p className="font-medium leading-none">{t.title}</p>
            {t.contact_name && (
              <p className="text-muted-foreground text-sm mt-0.5">
                {t.contact_name}
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm tabular-nums">
        {formatDate(row.original.date)}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div
        className={`text-right font-medium tabular-nums ${
          type === "income"
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {type === "income" ? "+" : "−"}
        {formatCurrency(row.original.amount)}
      </div>
    ),
  },
];

interface TopTransactionsCardProps {
  type: "income" | "expense";
  data: TopTransaction[];
  loading?: boolean;
  onViewAll?: () => void;
}

export function TopTransactionsCard({
  type,
  data,
  loading = false,
  onViewAll,
}: TopTransactionsCardProps) {
  const columns = React.useMemo(() => txnColumns(type), [type]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isIncome = type === "income";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isIncome ? (
            <TrendingUp className="size-5 text-green-500" />
          ) : (
            <TrendingDown className="size-5 text-red-500" />
          )}
          Top {isIncome ? "Income" : "Expenses"}
        </CardTitle>
        <CardDescription>
          {isIncome
            ? "Largest income transactions this period"
            : "Largest expense transactions this period"}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 flex-1">
        <div className="overflow-hidden">
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
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={columns.length} />
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
                      {isIncome ? (
                        <TrendingUp className="size-8 opacity-40" />
                      ) : (
                        <TrendingDown className="size-8 opacity-40" />
                      )}
                      No {isIncome ? "income" : "expense"} transactions found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {onViewAll && (
        <CardFooter className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewAll}
          >
            View all transactions
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ============================================================
//  COMPOSED DASHBOARD ROW  — drop this straight into a page
// ============================================================

interface DashboardTopCardsProps {
  contacts: ContactStat[];
  topIncome: TopTransaction[];
  topExpense: TopTransaction[];
  loading?: boolean;
  onViewContacts?: () => void;
  onViewTransactions?: () => void;
}

export function DashboardTopCards({
  contacts,
  topIncome,
  topExpense,
  loading = false,
  onViewContacts,
  onViewTransactions,
}: DashboardTopCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TopContactsCard
        data={contacts}
        loading={loading}
        onViewAll={onViewContacts}
      />
      <TopTransactionsCard
        type="income"
        data={topIncome}
        loading={loading}
        onViewAll={onViewTransactions}
      />
      <TopTransactionsCard
        type="expense"
        data={topExpense}
        loading={loading}
        onViewAll={onViewTransactions}
      />
    </div>
  );
}
