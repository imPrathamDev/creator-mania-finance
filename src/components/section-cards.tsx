import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardAnalytics } from "@/lib/analytics";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";
import { format } from "date-fns";

const periodOptions = [
  "today",
  "this_week",
  "this_month",
  "this_quarter",
  "this_year",
  "last_week",
  "last_month",
  "last_quarter",
  "last_year",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "last_12_months",
  "custom",
] as const;

type Period = (typeof periodOptions)[number];

interface DateRange {
  from: Date | string;
  to: Date | string;
}

function getPeriodLabel(period: Period, date?: DateRange): string {
  if (period === "custom" && date) {
    const from = new Date(date.from);
    const to = new Date(date.to);
    return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  }

  const labels: Record<Exclude<Period, "custom">, string> = {
    today: "today",
    this_week: "this week",
    this_month: "this month",
    this_quarter: "this quarter",
    this_year: "this year",
    last_week: "last week",
    last_month: "last month",
    last_quarter: "last quarter",
    last_year: "last year",
    last_7_days: "the last 7 days",
    last_30_days: "the last 30 days",
    last_90_days: "the last 90 days",
    last_12_months: "the last 12 months",
  };

  return labels[period as Exclude<Period, "custom">] ?? "this period";
}

function getPreviousPeriodLabel(period: Period, date?: DateRange): string {
  if (period === "custom" && date) {
    const from = new Date(date.from);
    const to = new Date(date.to);
    const diffMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - diffMs);
    return `${format(prevFrom, "MMM d")} – ${format(prevTo, "MMM d, yyyy")}`;
  }

  const labels: Record<Exclude<Period, "custom">, string> = {
    today: "yesterday",
    this_week: "last week",
    this_month: "last month",
    this_quarter: "last quarter",
    this_year: "last year",
    last_week: "the week before",
    last_month: "the month before",
    last_quarter: "the quarter before",
    last_year: "the year before",
    last_7_days: "the previous 7 days",
    last_30_days: "the previous 30 days",
    last_90_days: "the previous 90 days",
    last_12_months: "the previous 12 months",
  };

  return labels[period as Exclude<Period, "custom">] ?? "last period";
}

/**
 * Returns { up: boolean | null, badge: string | null }
 * up=null means no badge should be shown (change is 0 or null/undefined)
 */
function resolveChange(change: number | null | undefined): {
  up: boolean | null;
  badge: string | null;
} {
  if (change === null || change === undefined || change === 0) {
    return { up: null, badge: change === 0 ? "0%" : null };
  }
  return {
    up: change > 0,
    badge: `${change > 0 ? "+" : ""}${change}%`,
  };
}

export function SectionCards({
  comparison,
  period,
  date,
}: {
  comparison: DashboardAnalytics["comparison"] | null;
  period: Period;
  date?: DateRange;
}) {
  const periodLabel = getPeriodLabel(period, date);
  const prevPeriodLabel = getPreviousPeriodLabel(period, date);

  const data = useMemo(() => {
    if (comparison !== null) {
      const net = resolveChange(comparison.changes.net_pct);
      const income = resolveChange(comparison.changes.income_pct);
      const expense = resolveChange(comparison.changes.expense_pct);
      const count = resolveChange(comparison.changes.count_pct);

      return [
        {
          title: "Total Net Profit",
          heading:
            net.up === null
              ? "No change in net profit"
              : net.up
                ? "You're in the green"
                : "You're running at a loss",
          description:
            net.up === null
              ? `Net profit held steady compared to ${prevPeriodLabel}`
              : net.up
                ? `Net profit is up ${comparison.changes.net_pct}% compared to ${prevPeriodLabel}`
                : `Net profit is down ${Math.abs(
                    comparison.changes.net_pct!,
                  )}% compared to ${prevPeriodLabel}`,
          value: comparison.current.net,
          change: comparison.changes.net_pct,
          up: net.up,
          badge: net.badge,
          prefix: "₹",
          previous_value: comparison.previous.net,
        },
        {
          title: "Total Income",
          heading:
            income.up === null
              ? "Income unchanged"
              : income.up
                ? "Income up"
                : "Income down",
          description:
            income.up === null
              ? `Income was the same as ${prevPeriodLabel}`
              : income.up
                ? `Income increased compared to ${prevPeriodLabel}`
                : `Income decreased compared to ${prevPeriodLabel}`,
          value: comparison.current.total_income,
          change: comparison.changes.income_pct,
          up: income.up,
          badge: income.badge,
          prefix: "₹",
          previous_value: comparison.previous.total_income,
        },
        {
          title: "Total Expense",
          heading:
            expense.up === null
              ? "Expenses unchanged"
              : expense.up
                ? "Expenses up"
                : "Expenses down",
          description:
            expense.up === null
              ? `Expenses were the same as ${prevPeriodLabel}`
              : expense.up
                ? `Expenses increased compared to ${prevPeriodLabel}`
                : `Expenses decreased compared to ${prevPeriodLabel}`,
          value: comparison.current.total_expense,
          change: comparison.changes.expense_pct,
          up: expense.up,
          badge: expense.badge,
          prefix: "₹",
          previous_value: comparison.previous.total_expense,
        },
        {
          title: "Total Transactions",
          heading:
            count.up === null
              ? "Transaction volume unchanged"
              : count.up
                ? "More transactions"
                : "Fewer transactions",
          description:
            count.up === null
              ? `Same number of transactions as ${prevPeriodLabel}`
              : count.up
                ? `Transaction volume increased compared to ${prevPeriodLabel}`
                : `Transaction volume decreased compared to ${prevPeriodLabel}`,
          value: comparison.current.txn_count,
          change: comparison.changes.count_pct,
          up: count.up,
          badge: count.badge,
          prefix: null,
          previous_value: undefined,
        },
        // {
        //   title: "Average Income",
        //   heading: null,
        //   description: `Average income per transaction in ${periodLabel}`,
        //   value: comparison.current.avg_income,
        //   change: null,
        //   up: null,
        //   badge: null,
        //   prefix: "₹",
        //   previous_value: undefined,
        // },
        // {
        //   title: "Average Expense",
        //   heading: null,
        //   description: `Average expense per transaction in ${periodLabel}`,
        //   value: comparison.current.avg_expense,
        //   change: null,
        //   up: null,
        //   badge: null,
        //   prefix: "₹",
        //   previous_value: undefined,
        // },
        // {
        //   title: "Largest Income",
        //   heading: null,
        //   description: `Highest single income transaction in ${periodLabel}`,
        //   value: comparison.current.largest_income,
        //   change: null,
        //   up: null,
        //   badge: null,
        //   prefix: "₹",
        //   previous_value: undefined,
        // },
        // {
        //   title: "Largest Expense",
        //   heading: null,
        //   description: `Highest single expense transaction in ${periodLabel}`,
        //   value: comparison.current.largest_expense,
        //   change: null,
        //   up: null,
        //   badge: null,
        //   prefix: "₹",
        //   previous_value: undefined,
        // },
        // {
        //   title: "Paid Transactions",
        //   heading: null,
        //   description: `Fully paid transactions in ${periodLabel}`,
        //   value: comparison.current.paid_count,
        //   change: null,
        //   up: null,
        //   badge: null,
        //   prefix: null,
        //   previous_value: undefined,
        // },
        // {
        //   title: "Pending Transactions",
        //   heading:
        //     comparison.current.pending_count > 0
        //       ? "Action needed"
        //       : "All clear",
        //   description:
        //     comparison.current.pending_count > 0
        //       ? `You have ${comparison.current.pending_count} pending transaction${
        //           comparison.current.pending_count !== 1 ? "s" : ""
        //         } in ${periodLabel}`
        //       : `No pending transactions in ${periodLabel}`,
        //   value: comparison.current.pending_count,
        //   change: null,
        //   up: comparison.current.pending_count > 0 ? false : null,
        //   badge: null,
        //   prefix: null,
        //   previous_value: undefined,
        // },
        // {
        //   title: "Overdue Transactions",
        //   heading:
        //     comparison.current.overdue_count > 0
        //       ? "Attention required"
        //       : "All clear",
        //   description:
        //     comparison.current.overdue_count > 0
        //       ? `You have ${comparison.current.overdue_count} overdue transaction${
        //           comparison.current.overdue_count !== 1 ? "s" : ""
        //         } in ${periodLabel}`
        //       : `No overdue transactions in ${periodLabel}`,
        //   value: comparison.current.overdue_count,
        //   change: null,
        //   up: comparison.current.overdue_count > 0 ? false : null,
        //   badge: null,
        //   prefix: null,
        //   previous_value: undefined,
        // },
        // {
        //   title: "Partially Paid",
        //   heading:
        //     comparison.current.partially_count > 0
        //       ? "Incomplete payments"
        //       : "All clear",
        //   description:
        //     comparison.current.partially_count > 0
        //       ? `${comparison.current.partially_count} transaction${
        //           comparison.current.partially_count !== 1 ? "s are" : " is"
        //         } partially paid in ${periodLabel}`
        //       : `No partially paid transactions in ${periodLabel}`,
        //   value: comparison.current.partially_count,
        //   change: null,
        //   up: null,
        //   badge: null,
        //   prefix: null,
        //   previous_value: undefined,
        // },
      ];
    }
    return [];
  }, [comparison, periodLabel, prevPeriodLabel]);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {data.map((item, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription>{item.title}</CardDescription>
            <div>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {item.prefix}
                {item.value}
              </CardTitle>
              {item.previous_value !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {prevPeriodLabel.charAt(0).toUpperCase() +
                    prevPeriodLabel.slice(1)}{" "}
                  {item.prefix}
                  {item.previous_value}
                </p>
              )}
            </div>
            {item.badge !== null && (
              <CardAction>
                <Badge
                  variant="outline"
                  className={
                    item.up === null
                      ? "border-muted-foreground text-muted-foreground"
                      : item.up
                        ? "border-green-600 text-green-500"
                        : "border-red-600 text-red-500"
                  }
                >
                  {item.up === true ? (
                    <IconTrendingUp />
                  ) : item.up === false ? (
                    <IconTrendingDown />
                  ) : null}
                  {item.badge}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            {item.heading && (
              <div className="line-clamp-1 flex gap-2 font-medium">
                {item.heading}
                {item.up === true ? (
                  <IconTrendingUp className="size-4" />
                ) : item.up === false ? (
                  <IconTrendingDown className="size-4" />
                ) : null}
              </div>
            )}
            <div className="text-muted-foreground">{item.description}</div>
          </CardFooter>
        </Card>
      ))}
      {comparison === null &&
        [0, 1, 2, 3].map((m) => (
          <Card key={m} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-[40%] rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-10 w-[60%] rounded-lg" />
                <Skeleton className="h-4 w-[40%] rounded-lg" />
              </div>
              <CardAction>
                <Skeleton className="h-4 w-12 rounded-3xl" />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium w-full">
                <Skeleton className="h-5 w-[80%] rounded-lg" />
              </div>
              <div className="text-muted-foreground w-full">
                <Skeleton className="h-4 w-[50%] rounded-lg" />
              </div>
            </CardFooter>
          </Card>
        ))}
    </div>
  );
}
