"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardAnalytics } from "@/lib/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const description = "A stacked bar chart with a legend";

const chartConfig = {
  expense: {
    label: "Expense",
    color: "#fb2c36",
  },
  income: {
    label: "Income",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartBarStacked({
  dayOfWeek,
}: {
  dayOfWeek: DashboardAnalytics["dayOfWeek"] | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Day of week</CardTitle>
        <CardDescription>Weekly expense and income comparison.</CardDescription>
      </CardHeader>
      <CardContent>
        {dayOfWeek && (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={dayOfWeek}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                // tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="expense"
                stackId="a"
                fill="var(--color-expense)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="income"
                stackId="a"
                fill="var(--color-income)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
        {dayOfWeek === null && (
          <Skeleton className="h-62.5 rounded-xl w-full" />
        )}
      </CardContent>
      {/* <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter> */}
    </Card>
  );
}

const methodsChartConfig = {
  transactions: { label: "Transactions" },
  cash: { label: "Cash", color: "var(--chart-1)" },
  bank_transfer: { label: "Bank Transfer", color: "var(--chart-2)" },
  credit_card: { label: "Credit Card", color: "var(--chart-3)" },
  debit_card: { label: "Debit Card", color: "var(--chart-4)" },
  upi: { label: "UPI", color: "var(--chart-5)" },
  cheque: { label: "Cheque", color: "var(--chart-1)" },
  crypto: { label: "Crypto", color: "var(--chart-2)" },
  other: { label: "Other", color: "var(--chart-3)" },
} satisfies ChartConfig;

type DataKey = "pct_income" | "pct_expense" | "income" | "expense";

const dataKeyOptions: { value: DataKey; label: string }[] = [
  { value: "pct_income", label: "Income %" },
  { value: "pct_expense", label: "Expense %" },
  { value: "income", label: "Income (amount)" },
  { value: "expense", label: "Expense (amount)" },
];

export function MethodsChartPie({
  methods,
}: {
  methods: DashboardAnalytics["methodStats"] | null;
}) {
  const [dataKey, setDataKey] = useState<DataKey>("pct_income");

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Methods Stats</CardTitle>
        <CardDescription>Methods for Income &amp; Expense.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {/* Select */}
        <div className="mb-4 flex justify-center">
          <Select
            value={dataKey}
            onValueChange={(v) => setDataKey(v as DataKey)}
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue placeholder="Select data" />
            </SelectTrigger>
            <SelectContent>
              {dataKeyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {methods && (
          <ChartContainer
            config={methodsChartConfig}
            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-62.5"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="method" hideLabel />}
              />
              <Pie
                data={methods}
                dataKey={dataKey}
                nameKey="method"
                label={({ method }) =>
                  methodsChartConfig[method as keyof typeof methodsChartConfig]
                    ?.label ?? method
                }
                labelLine={false}
              >
                {methods.map((entry) => (
                  <Cell
                    key={entry.method}
                    fill={
                      (methodsChartConfig as any)[
                        entry.method as keyof typeof methodsChartConfig
                      ]?.color ?? "var(--chart-1)"
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        {methods === null && <Skeleton className="h-62.5 rounded-xl" />}
      </CardContent>
    </Card>
  );
}

// Cycle through chart colors for tags (since colors are dynamic)
const TAG_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type TagDataKey = "pct_income" | "pct_expense" | "income" | "expense";

const tagDataKeyOptions: { value: TagDataKey; label: string }[] = [
  { value: "pct_income", label: "Income %" },
  { value: "pct_expense", label: "Expense %" },
  { value: "income", label: "Income (amount)" },
  { value: "expense", label: "Expense (amount)" },
];

export function TagsChartPie({
  tags,
}: {
  tags: DashboardAnalytics["tagBreakdown"] | null;
}) {
  const [dataKey, setDataKey] = useState<TagDataKey>("pct_income");

  // Build a dynamic ChartConfig from the tags data
  const tagsChartConfig = tags
    ? tags.reduce<ChartConfig>((acc, tag, index) => {
        acc[tag.tag_name] = {
          label: tag.tag_name,
          color:
            tag.tag_color && tag.tag_color !== ""
              ? tag.tag_color
              : TAG_COLORS[index % TAG_COLORS.length],
        };
        return acc;
      }, {})
    : {};

  // Filter out entries where the selected dataKey is 0 to avoid empty slices
  const filteredTags = tags?.filter((t) => (t[dataKey] as number) > 0) ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Tag Breakdown</CardTitle>
        <CardDescription>Income &amp; Expense by tag.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {/* Select */}
        <div className="mb-4 flex justify-center">
          <Select
            value={dataKey}
            onValueChange={(v) => setDataKey(v as TagDataKey)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select data" />
            </SelectTrigger>
            <SelectContent>
              {tagDataKeyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tags && filteredTags.length > 0 && (
          <ChartContainer
            config={tagsChartConfig}
            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-62.5"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="tag_name" hideLabel />}
              />
              <Pie
                data={filteredTags}
                dataKey={dataKey}
                nameKey="tag_name"
                label={({ tag_name }) => tag_name}
                labelLine={false}
              >
                {filteredTags.map((entry, index) => (
                  <Cell
                    key={entry.tag_id ?? entry.tag_name}
                    fill={
                      entry.tag_color && entry.tag_color !== ""
                        ? entry.tag_color
                        : TAG_COLORS[index % TAG_COLORS.length]
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        {tags && filteredTags.length === 0 && (
          <div className="text-muted-foreground flex h-62.5 items-center justify-center text-sm">
            No data for selected metric.
          </div>
        )}

        {tags === null && <Skeleton className="h-62.5 rounded-xl" />}
      </CardContent>
    </Card>
  );
}
