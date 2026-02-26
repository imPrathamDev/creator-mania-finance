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

export function SectionCards({
  comparison,
}: {
  comparison: DashboardAnalytics["comparison"] | null;
}) {
  const data = useMemo(() => {
    if (comparison !== null) {
      return [
        {
          title: "Total Net Profit",
          heading: comparison.changes.net_pct
            ? comparison.changes.net_pct > 0
              ? "You're in the green this period"
              : "You're running at a loss"
            : null,
          description: comparison.changes.net_pct
            ? comparison.changes.net_pct > 0
              ? `Net profit is up ${comparison.changes.net_pct}% compared to last period`
              : `Net profit is down ${Math.abs(comparison.changes.net_pct)}% compared to last period`
            : "No change in net profit from last period",
          value: comparison.current.net,
          change: comparison.changes.net_pct,
          up: comparison.changes.net_pct
            ? comparison.changes.net_pct > 0
            : null,
          prefix: "₹",
          previous_value: comparison.previous.net,
        },
        {
          title: "Total Income",
          heading: comparison.changes.income_pct
            ? comparison.changes.income_pct > 0
              ? "Income up"
              : "Income down"
            : null,
          description: comparison.changes.income_pct
            ? comparison.changes.income_pct > 0
              ? "Income increased from last period"
              : "Income decreased from last period"
            : null,
          value: comparison.current.total_income,
          change: comparison.changes.income_pct,
          up: comparison.changes.income_pct
            ? comparison.changes.income_pct > 0
            : null,
          prefix: "₹",
          previous_value: comparison.previous.total_income,
        },
        {
          title: "Total Expense",
          heading: comparison.changes.expense_pct
            ? comparison.changes.expense_pct > 0
              ? "Expenses up"
              : "Expenses down"
            : null,
          description: comparison.changes.expense_pct
            ? comparison.changes.expense_pct > 0
              ? "Expenses increased from last period"
              : "Expenses decreased from last period"
            : null,
          value: comparison.current.total_expense,
          change: comparison.changes.expense_pct,
          up: comparison.changes.expense_pct
            ? comparison.changes.expense_pct > 0
            : null,
          prefix: "₹",
          previous_value: comparison.previous.total_expense,
        },
        // {
        //   title: "Total Transactions",
        //   heading: comparison.changes.count_pct ? comparison.changes.count_pct > 0 ? "More transactions" : "Fewer transactions" : null,
        //   description: comparison.changes.count_pct ? comparison.changes.count_pct > 0 ? "Transaction volume increased" : "Transaction volume decreased" : null,
        //   value: comparison.current.txn_count,
        //   change: comparison.changes.count_pct,
        //   up: comparison.changes.count_pct ? comparison.changes.count_pct > 0 : null,
        //   prefix: null
        // },
        // {
        //   title: "Average Income",
        //   heading: null,
        //   description: "Average income per transaction",
        //   value: comparison.current.avg_income,
        //   change: null,
        //   up: null,
        //   prefix: "Rs."
        // },
        // {
        //   title: "Average Expense",
        //   heading: null,
        //   description: "Average expense per transaction",
        //   value: comparison.current.avg_expense,
        //   change: null,
        //   up: null,
        //   prefix: "Rs."
        // },
        // {
        //   title: "Largest Income",
        //   heading: null,
        //   description: "Highest single income transaction",
        //   value: comparison.current.largest_income,
        //   change: null,
        //   up: null,
        //   prefix: "Rs."
        // },
        // {
        //   title: "Largest Expense",
        //   heading: null,
        //   description: "Highest single expense transaction",
        //   value: comparison.current.largest_expense,
        //   change: null,
        //   up: null,
        //   prefix: "Rs."
        // },
        // {
        //   title: "Paid Transactions",
        //   heading: null,
        //   description: "Number of fully paid transactions",
        //   value: comparison.current.paid_count,
        //   change: null,
        //   up: null,
        //   prefix: null
        // },
        // {
        //   title: "Pending Transactions",
        //   heading: comparison.current.pending_count > 0 ? "Action needed" : null,
        //   description: comparison.current.pending_count > 0 ? "You have pending transactions" : "No pending transactions",
        //   value: comparison.current.pending_count,
        //   change: null,
        //   up: comparison.current.pending_count > 0 ? false : null,
        //   prefix: null
        // },
        // {
        //   title: "Overdue Transactions",
        //   heading: comparison.current.overdue_count > 0 ? "Attention required" : null,
        //   description: comparison.current.overdue_count > 0 ? "You have overdue transactions" : "No overdue transactions",
        //   value: comparison.current.overdue_count,
        //   change: null,
        //   up: comparison.current.overdue_count > 0 ? false : null,
        //   prefix: null
        // },
        // {
        //   title: "Partially Paid",
        //   heading: comparison.current.partially_count > 0 ? "Incomplete payments" : null,
        //   description: comparison.current.partially_count > 0 ? "Some transactions are partially paid" : "No partially paid transactions",
        //   value: comparison.current.partially_count,
        //   change: null,
        //   up: null,
        //   prefix: null
        // },
      ];
    }
    return [];
  }, [comparison]);
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {data.map((comparison, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription>{comparison.title}</CardDescription>
            <div>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {comparison.prefix}
                {comparison.value}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Last month {comparison.prefix}
                {comparison.previous_value}
              </p>
            </div>
            <CardAction>
              <Badge
                variant="outline"
                className={
                  comparison.up
                    ? "border-green-600 text-green-500"
                    : "border-red-600 text-red-500"
                }
              >
                {comparison.up ? <IconTrendingUp /> : <IconTrendingDown />}
                {comparison.up ? "+" : null}
                {comparison.change}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {comparison.heading}{" "}
              {comparison.up ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">
              {comparison.description}
            </div>
          </CardFooter>
        </Card>
      ))}
      {comparison === null &&
        [0, 1, 3].map((m) => (
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
