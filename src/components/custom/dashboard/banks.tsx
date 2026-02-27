// ============================================================
//  DASHBOARD COMPONENTS  (exported separately for reuse)
// ============================================================

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bank } from "@/hooks/use-banks";
import { fmt, fmtDate, balanceClass } from "@/lib/utils";
import { ArrowUpRight, Landmark, Wallet } from "lucide-react";

// ── 1. Single bank mini-card ──────────────────────────────

interface BankCardProps {
  bank: Bank;
  onEdit?: (bank: Bank) => void;
}

export function BankCard({ bank, onEdit }: BankCardProps) {
  const initials = bank.name.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium">{bank.name}</p>
          <p className="text-xs text-muted-foreground">
            Added {fmtDate(bank.created_at)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold tabular-nums ${balanceClass(bank.balance)}`}
        >
          {fmt(bank.balance)}
        </p>
        {onEdit && (
          <button
            onClick={() => onEdit(bank)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

// ── 2. Dashboard banks overview card ─────────────────────

interface BanksDashboardCardProps {
  banks: Bank[];
  loading?: boolean;
  onViewAll?: () => void;
}

export function BanksDashboardCard({
  banks,
  loading = false,
  onViewAll,
}: BanksDashboardCardProps) {
  const total = banks.reduce((s, b) => s + b.balance, 0);
  const positiveCount = banks.filter((b) => b.balance > 0).length;
  const negativeCount = banks.filter((b) => b.balance < 0).length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="size-5 text-muted-foreground" />
          Bank Accounts
        </CardTitle>
        <CardDescription>
          {banks.length} account{banks.length !== 1 ? "s" : ""} tracked
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Total balance summary */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
          <span className="text-sm text-muted-foreground">Total Balance</span>
          <span
            className={`text-lg font-bold tabular-nums ${balanceClass(total)}`}
          >
            {fmt(total)}
          </span>
        </div>

        {/* Positive / negative split */}
        {banks.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
              <span className="text-xs text-muted-foreground">In credit</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
                {fmt(
                  banks
                    .filter((b) => b.balance > 0)
                    .reduce((s, b) => s + b.balance, 0),
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {positiveCount} account{positiveCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
              <span className="text-xs text-muted-foreground">In debit</span>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
                {fmt(
                  Math.abs(
                    banks
                      .filter((b) => b.balance < 0)
                      .reduce((s, b) => s + b.balance, 0),
                  ),
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {negativeCount} account{negativeCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Account list */}
        <div className="flex flex-col gap-1.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))
          ) : banks.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-6 text-muted-foreground">
              <Landmark className="size-7 opacity-40" />
              <span className="text-sm">No accounts yet</span>
            </div>
          ) : (
            banks.map((bank) => <BankCard key={bank.id} bank={bank} />)
          )}
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
            Manage accounts
            <ArrowUpRight className="ml-2 size-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ── 3. Compact total-balance KPI card  ────────────────────

interface BankBalanceKpiProps {
  banks: Bank[];
  loading?: boolean;
}

export function BankBalanceKpi({
  banks,
  loading = false,
}: BankBalanceKpiProps) {
  const total = banks.reduce((s, b) => s + b.balance, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Wallet className="size-4" />
          Total Bank Balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        ) : (
          <div
            className={`text-2xl font-bold tabular-nums ${balanceClass(total)}`}
          >
            {fmt(total)}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Across {banks.length} account{banks.length !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
