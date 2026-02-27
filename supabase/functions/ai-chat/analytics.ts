// ============================================================
//  SHARED TYPES
// ============================================================

import { createClient } from "./client.ts";

export type Period =
  | "today"
  | "this_week"
  | "this_month"
  | "this_quarter"
  | "this_year"
  | "last_week"
  | "last_month"
  | "last_quarter"
  | "last_year"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "last_12_months"
  | "custom";

export interface DateRange {
  from: string; // ISO date YYYY-MM-DD
  to: string;
}

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD or YYYY-MM or YYYY-Www
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface CategoryBreakdown {
  tag_id: string | null;
  tag_name: string;
  tag_color: string | null;
  income: number;
  expense: number;
  net: number;
  count: number;
  pct_income: number; // % of total income
  pct_expense: number; // % of total expense
}

export interface ContactStat {
  contact_id: string;
  contact_name: string;
  contact_type: string;
  company: string | null;
  total_income: number;
  total_expense: number;
  net: number;
  txn_count: number;
  last_txn_date: string | null;
}

export interface PendingOverview {
  pending_count: number;
  pending_amount: number;
  overdue_count: number;
  overdue_amount: number;
  partially_count: number;
  partially_amount: number;
  upcoming_7d: { count: number; amount: number };
  upcoming_30d: { count: number; amount: number };
  oldest_overdue: string | null; // due date
}

export interface SummaryStats {
  total_income: number;
  total_expense: number;
  net: number;
  txn_count: number;
  avg_income: number;
  avg_expense: number;
  largest_income: number;
  largest_expense: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  cancelled_count: number;
  partially_count: number;
}

export interface ComparisonResult {
  current: SummaryStats;
  previous: SummaryStats;
  changes: {
    income_pct: number | null; // null if previous = 0
    expense_pct: number | null;
    net_pct: number | null;
    count_pct: number | null;
  };
}

export interface CashFlowPoint {
  date: string;
  cumulative_net: number;
  income: number;
  expense: number;
}

export interface PaymentMethodStat {
  method: string;
  income: number;
  expense: number;
  net: number;
  income_count: number;
  expense_count: number;
  total_count: number;
  pct_income: number; // % of total income amount
  pct_expense: number; // % of total expense amount
}

export interface DayOfWeekStat {
  day: number; // 0 = Sun … 6 = Sat
  label: string;
  income: number;
  expense: number;
  net: number;
  income_count: number;
  expense_count: number;
  total_count: number;
}

export interface HeatmapPoint {
  date: string;
  amount: number;
  count: number;
}

// ============================================================
//  DATE RANGE HELPERS
// ============================================================

const IST_OFFSET = 5 * 60 + 30; // minutes

function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET * 60_000);
}

function toISTDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dy}`;
}

function startOfWeek(d: Date): Date {
  // Monday-based
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d);
  r.setUTCDate(d.getUTCDate() + diff);
  return r;
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getUTCMonth() / 3);
  return new Date(Date.UTC(d.getUTCFullYear(), q * 3, 1));
}

export function resolveDateRange(
  period: Period,
  custom?: DateRange,
): DateRange {
  const now = nowIST();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const dy = now.getUTCDate();

  const fmt = (d: Date) => toISTDateStr(d);
  const ymd = (year: number, month: number, day: number) =>
    new Date(Date.UTC(year, month, day));

  switch (period) {
    case "today":
      return { from: fmt(now), to: fmt(now) };

    case "this_week": {
      const sow = startOfWeek(now);
      return { from: fmt(sow), to: fmt(now) };
    }

    case "this_month":
      return { from: fmt(ymd(y, m, 1)), to: fmt(now) };

    case "this_quarter": {
      const soq = startOfQuarter(now);
      return { from: fmt(soq), to: fmt(now) };
    }

    case "this_year":
      return { from: fmt(ymd(y, 0, 1)), to: fmt(now) };

    case "last_week": {
      const sow = startOfWeek(now);
      const eow = new Date(sow);
      eow.setUTCDate(sow.getUTCDate() - 1);
      const sowp = new Date(sow);
      sowp.setUTCDate(sow.getUTCDate() - 7);
      return { from: fmt(sowp), to: fmt(eow) };
    }

    case "last_month": {
      const firstOfMonth = ymd(y, m, 1);
      const lastMonth = new Date(firstOfMonth);
      lastMonth.setUTCDate(0);
      const firstLast = ymd(
        lastMonth.getUTCFullYear(),
        lastMonth.getUTCMonth(),
        1,
      );
      return { from: fmt(firstLast), to: fmt(lastMonth) };
    }

    case "last_quarter": {
      const soq = startOfQuarter(now);
      const eoq = new Date(soq);
      eoq.setUTCDate(soq.getUTCDate() - 1);
      const soqp = startOfQuarter(eoq);
      return { from: fmt(soqp), to: fmt(eoq) };
    }

    case "last_year":
      return {
        from: fmt(ymd(y - 1, 0, 1)),
        to: fmt(ymd(y - 1, 11, 31)),
      };

    case "last_7_days": {
      const s = new Date(now);
      s.setUTCDate(dy - 6);
      return { from: fmt(s), to: fmt(now) };
    }

    case "last_30_days": {
      const s = new Date(now);
      s.setUTCDate(dy - 29);
      return { from: fmt(s), to: fmt(now) };
    }

    case "last_90_days": {
      const s = new Date(now);
      s.setUTCDate(dy - 89);
      return { from: fmt(s), to: fmt(now) };
    }

    case "last_12_months": {
      const s = ymd(y, m - 11, 1);
      return { from: fmt(s), to: fmt(now) };
    }

    case "custom":
      if (!custom) throw new Error("custom period requires a DateRange");
      return custom;

    default:
      return { from: fmt(ymd(y, m, 1)), to: fmt(now) };
  }
}

/** Returns the equivalent previous period for comparison. */
export function previousPeriod(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const pTo = new Date(from);
  pTo.setUTCDate(pTo.getUTCDate() - 1);
  const pFrom = new Date(pTo);
  pFrom.setUTCDate(pFrom.getUTCDate() - days + 1);
  return {
    from: toISTDateStr(pFrom),
    to: toISTDateStr(pTo),
  };
}

// ============================================================
//  INTERNAL FETCH HELPER
// ============================================================

async function fetchRange(range: DateRange) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, type, amount, currency, payment_status, payment_method, transaction_date, due_date, contact_id",
    )
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled");

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

// ============================================================
//  1.  SUMMARY STATS
// ============================================================

export async function getSummaryStats(
  period: Period,
  custom?: DateRange,
): Promise<SummaryStats> {
  const range = resolveDateRange(period, custom);
  const rows = await fetchRange(range);

  const base: SummaryStats = {
    total_income: 0,
    total_expense: 0,
    net: 0,
    txn_count: 0,
    avg_income: 0,
    avg_expense: 0,
    largest_income: 0,
    largest_expense: 0,
    paid_count: 0,
    pending_count: 0,
    overdue_count: 0,
    cancelled_count: 0,
    partially_count: 0,
  };

  for (const r of rows) {
    const amt = Number(r.amount);
    base.txn_count++;
    if (r.type === "income") {
      base.total_income += amt;
      if (amt > base.largest_income) base.largest_income = amt;
    }
    if (r.type === "expense") {
      base.total_expense += amt;
      if (amt > base.largest_expense) base.largest_expense = amt;
    }
    if (r.payment_status === "paid") base.paid_count++;
    if (r.payment_status === "pending") base.pending_count++;
    if (r.payment_status === "overdue") base.overdue_count++;
    if (r.payment_status === "cancelled") base.cancelled_count++;
    if (r.payment_status === "partially_paid") base.partially_count++;
  }

  const incomeRows = rows.filter((r: any) => r.type === "income");
  const expenseRows = rows.filter((r: any) => r.type === "expense");
  base.avg_income = incomeRows.length
    ? base.total_income / incomeRows.length
    : 0;
  base.avg_expense = expenseRows.length
    ? base.total_expense / expenseRows.length
    : 0;
  base.net = base.total_income - base.total_expense;

  return base;
}

// ============================================================
//  2.  PERIOD COMPARISON
// ============================================================

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 10000) / 100; // 2 decimal places
}

export async function getComparison(
  period: Period,
  custom?: DateRange,
): Promise<ComparisonResult> {
  const range = resolveDateRange(period, custom);
  const prev = previousPeriod(range);

  const [current, previous] = await Promise.all([
    getSummaryStats("custom", range),
    getSummaryStats("custom", prev),
  ]);

  return {
    current,
    previous,
    changes: {
      income_pct: pctChange(current.total_income, previous.total_income),
      expense_pct: pctChange(current.total_expense, previous.total_expense),
      net_pct: pctChange(current.net, previous.net),
      count_pct: pctChange(current.txn_count, previous.txn_count),
    },
  };
}

// ============================================================
//  3.  TIME SERIES  (for line / bar charts)
//      granularity auto-selected based on range length
// ============================================================

export type Granularity = "day" | "week" | "month";

function granularityFor(range: DateRange): Granularity {
  const days = Math.round(
    (new Date(range.to).getTime() - new Date(range.from).getTime()) /
      86_400_000,
  );
  if (days <= 31) return "day";
  if (days <= 182) return "week";
  return "month";
}

function dateKey(dateStr: string, gran: Granularity): string {
  const d = new Date(dateStr);
  if (gran === "month") {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0",
    )}`;
  }
  if (gran === "week") {
    const sow = startOfWeek(d);
    return toISTDateStr(sow);
  }
  return dateStr;
}

export async function getTimeSeries(
  period: Period,
  custom?: DateRange,
  granularity?: Granularity,
): Promise<{
  series: TimeSeriesPoint[];
  granularity: Granularity;
  range: DateRange;
}> {
  const range = resolveDateRange(period, custom);
  const gran = granularity ?? granularityFor(range);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")
    .order("transaction_date", { ascending: true });

  if (error) throw new Error(error.message);

  const map = new Map<string, TimeSeriesPoint>();

  for (const r of data ?? []) {
    const key = dateKey(r.transaction_date, gran);
    const amt = Number(r.amount);

    if (!map.has(key)) {
      map.set(key, {
        date: key,
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      });
    }
    const pt = map.get(key)!;
    pt.count++;
    if (r.type === "income") pt.income += amt;
    if (r.type === "expense") pt.expense += amt;
    pt.net = pt.income - pt.expense;
  }

  return {
    series: Array.from(map.values()),
    granularity: gran,
    range,
  };
}

// ============================================================
//  4.  CUMULATIVE CASH FLOW  (area chart)
// ============================================================

export async function getCashFlow(
  period: Period,
  custom?: DateRange,
): Promise<CashFlowPoint[]> {
  const range = resolveDateRange(period, custom);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")
    .order("transaction_date", { ascending: true });

  if (error) throw new Error(error.message);

  const dayMap = new Map<string, { income: number; expense: number }>();
  for (const r of data ?? []) {
    const key = r.transaction_date;
    const amt = Number(r.amount);
    if (!dayMap.has(key)) dayMap.set(key, { income: 0, expense: 0 });
    const d = dayMap.get(key)!;
    if (r.type === "income") d.income += amt;
    if (r.type === "expense") d.expense += amt;
  }

  let cumulative = 0;
  return Array.from(dayMap.entries()).map(([date, d]) => {
    cumulative += d.income - d.expense;
    return {
      date,
      income: d.income,
      expense: d.expense,
      cumulative_net: cumulative,
    };
  });
}

// ============================================================
//  5.  TAG BREAKDOWN  (donut / pie + bar charts)
// ============================================================

export async function getTagBreakdown(
  period: Period,
  custom?: DateRange,
): Promise<CategoryBreakdown[]> {
  const range = resolveDateRange(period, custom);
  const supabase = createClient();

  // fetch transactions with their tags
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, transaction_tags(tag:tags(id, name, color))")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled");

  if (error) throw new Error(error.message);

  const map = new Map<string, CategoryBreakdown>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (const r of data ?? []) {
    const amt = Number(r.amount);
    if (r.type === "income") totalIncome += amt;
    if (r.type === "expense") totalExpense += amt;

    const tags: any[] = (r.transaction_tags ?? [])
      .map((tt: any) => tt.tag)
      .filter(Boolean);

    if (tags.length === 0) {
      // untagged bucket
      const key = "__untagged__";
      if (!map.has(key)) {
        map.set(key, {
          tag_id: null,
          tag_name: "Untagged",
          tag_color: null,
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
          pct_income: 0,
          pct_expense: 0,
        });
      }
      const b = map.get(key)!;
      b.count++;
      if (r.type === "income") b.income += amt;
      if (r.type === "expense") b.expense += amt;
      b.net = b.income - b.expense;
    }

    for (const tag of tags) {
      if (!map.has(tag.id)) {
        map.set(tag.id, {
          tag_id: tag.id,
          tag_name: tag.name,
          tag_color: tag.color,
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
          pct_income: 0,
          pct_expense: 0,
        });
      }
      const b = map.get(tag.id)!;
      b.count++;
      if (r.type === "income") b.income += amt;
      if (r.type === "expense") b.expense += amt;
      b.net = b.income - b.expense;
    }
  }

  // calculate percentages
  return Array.from(map.values())
    .map((b) => ({
      ...b,
      pct_income:
        totalIncome > 0
          ? Math.round((b.income / totalIncome) * 10000) / 100
          : 0,
      pct_expense:
        totalExpense > 0
          ? Math.round((b.expense / totalExpense) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.expense - a.expense);
}

// ============================================================
//  6.  CONTACT ANALYTICS  (top spenders / earners)
// ============================================================

export async function getContactStats(
  period: Period,
  custom?: DateRange,
  limit = 10,
): Promise<ContactStat[]> {
  const range = resolveDateRange(period, custom);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "type, amount, transaction_date, contact:contacts(id, name, type, company)",
    )
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")
    .not("contact_id", "is", null);

  if (error) throw new Error(error.message);

  const map = new Map<string, ContactStat>();

  for (const r of data ?? []) {
    const c = (r as any).contact;
    if (!c) continue;
    const amt = Number(r.amount);

    if (!map.has(c.id)) {
      map.set(c.id, {
        contact_id: c.id,
        contact_name: c.name,
        contact_type: c.type,
        company: c.company,
        total_income: 0,
        total_expense: 0,
        net: 0,
        txn_count: 0,
        last_txn_date: null,
      });
    }
    const s = map.get(c.id)!;
    s.txn_count++;
    if (r.type === "income") s.total_income += amt;
    if (r.type === "expense") s.total_expense += amt;
    s.net = s.total_income - s.total_expense;
    if (!s.last_txn_date || r.transaction_date > s.last_txn_date) {
      s.last_txn_date = r.transaction_date;
    }
  }

  return Array.from(map.values())
    .sort(
      (a, b) =>
        b.total_income + b.total_expense - (a.total_income + a.total_expense),
    )
    .slice(0, limit);
}

// ============================================================
//  7.  PENDING / OVERDUE OVERVIEW
// ============================================================

export async function getPendingOverview(): Promise<PendingOverview> {
  const today = toISTDateStr(nowIST());
  const in7 = toISTDateStr(
    new Date(Date.now() + (IST_OFFSET + 7 * 24 * 60) * 60_000),
  );
  const in30 = toISTDateStr(
    new Date(Date.now() + (IST_OFFSET + 30 * 24 * 60) * 60_000),
  );
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, payment_status, due_date")
    .in("payment_status", ["pending", "overdue", "partially_paid"]);

  if (error) throw new Error(error.message);

  const out: PendingOverview = {
    pending_count: 0,
    pending_amount: 0,
    overdue_count: 0,
    overdue_amount: 0,
    partially_count: 0,
    partially_amount: 0,
    upcoming_7d: { count: 0, amount: 0 },
    upcoming_30d: { count: 0, amount: 0 },
    oldest_overdue: null,
  };

  for (const r of data ?? []) {
    const amt = Number(r.amount);
    if (r.payment_status === "pending") {
      out.pending_count++;
      out.pending_amount += amt;
    }
    if (r.payment_status === "overdue") {
      out.overdue_count++;
      out.overdue_amount += amt;
    }
    if (r.payment_status === "partially_paid") {
      out.partially_count++;
      out.partially_amount += amt;
    }

    if (r.due_date) {
      if (r.due_date <= in7) {
        out.upcoming_7d.count++;
        out.upcoming_7d.amount += amt;
      }
      if (r.due_date <= in30) {
        out.upcoming_30d.count++;
        out.upcoming_30d.amount += amt;
      }
      if (r.payment_status === "overdue") {
        if (!out.oldest_overdue || r.due_date < out.oldest_overdue) {
          out.oldest_overdue = r.due_date;
        }
      }
    }
  }

  return out;
}

// ============================================================
//  8.  PAYMENT METHOD BREAKDOWN  (pie chart)
// ============================================================

export async function getPaymentMethodStats(
  period: Period,
  custom?: DateRange,
): Promise<PaymentMethodStat[]> {
  const range = resolveDateRange(period, custom);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("type, payment_method, amount")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled");

  if (error) throw new Error(error.message);

  const map = new Map<
    string,
    {
      income: number;
      expense: number;
      income_count: number;
      expense_count: number;
    }
  >();

  let totalIncome = 0;
  let totalExpense = 0;

  for (const r of data ?? []) {
    const key = r.payment_method ?? "unspecified";
    const amt = Number(r.amount);

    if (!map.has(key)) {
      map.set(key, {
        income: 0,
        expense: 0,
        income_count: 0,
        expense_count: 0,
      });
    }
    const s = map.get(key)!;

    if (r.type === "income") {
      s.income += amt;
      s.income_count++;
      totalIncome += amt;
    }
    if (r.type === "expense") {
      s.expense += amt;
      s.expense_count++;
      totalExpense += amt;
    }
  }

  return Array.from(map.entries())
    .map(([method, s]) => ({
      method,
      income: s.income,
      expense: s.expense,
      net: s.income - s.expense,
      income_count: s.income_count,
      expense_count: s.expense_count,
      total_count: s.income_count + s.expense_count,
      pct_income:
        totalIncome > 0
          ? Math.round((s.income / totalIncome) * 10000) / 100
          : 0,
      pct_expense:
        totalExpense > 0
          ? Math.round((s.expense / totalExpense) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));
}

// ============================================================
//  9.  DAY-OF-WEEK SPENDING PATTERN  (bar chart)
// ============================================================

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getDayOfWeekStats(
  period: Period,
  custom?: DateRange,
): Promise<DayOfWeekStat[]> {
  const range = resolveDateRange(period, custom);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled");

  if (error) throw new Error(error.message);

  const buckets: DayOfWeekStat[] = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    label: DAY_LABELS[i],
    income: 0,
    expense: 0,
    net: 0,
    income_count: 0,
    expense_count: 0,
    total_count: 0,
  }));

  for (const r of data ?? []) {
    const dow = new Date(r.transaction_date).getUTCDay();
    const amt = Number(r.amount);
    const b = buckets[dow];

    b.total_count++;
    if (r.type === "income") {
      b.income += amt;
      b.income_count++;
    }
    if (r.type === "expense") {
      b.expense += amt;
      b.expense_count++;
    }
    b.net = b.income - b.expense;
  }

  return buckets;
}

// ============================================================
//  10. ACTIVITY HEATMAP  (GitHub-style calendar)
// ============================================================

export async function getActivityHeatmap(
  period: Period,
  custom?: DateRange,
): Promise<HeatmapPoint[]> {
  const range = resolveDateRange(period, custom);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, transaction_date")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled");

  if (error) throw new Error(error.message);

  const map = new Map<string, HeatmapPoint>();

  for (const r of data ?? []) {
    const key = r.transaction_date;
    if (!map.has(key)) map.set(key, { date: key, amount: 0, count: 0 });
    const p = map.get(key)!;
    p.amount += Number(r.amount);
    p.count++;
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================
//  11. MULTI-PERIOD COMPARISON  (for bar / grouped charts)
//      Compare multiple periods at once
// ============================================================

export interface MultiPeriodPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export async function getMultiPeriodComparison(
  periods: { label: string; period: Period; custom?: DateRange }[],
): Promise<MultiPeriodPoint[]> {
  const results = await Promise.all(
    periods.map(async ({ label, period, custom }) => {
      const stats = await getSummaryStats(period, custom);
      return {
        label,
        income: stats.total_income,
        expense: stats.total_expense,
        net: stats.net,
        count: stats.txn_count,
      };
    }),
  );
  return results;
}

// ============================================================
//  12. INCOME vs EXPENSE RATIO over time  (line chart)
// ============================================================

export interface RatioPoint {
  date: string;
  ratio: number; // income / expense — 1.0 means break-even, >1 means profit
  income: number;
  expense: number;
}

export async function getIncomeExpenseRatio(
  period: Period,
  custom?: DateRange,
): Promise<RatioPoint[]> {
  const { series } = await getTimeSeries(period, custom);
  return series.map((p) => ({
    date: p.date,
    income: p.income,
    expense: p.expense,
    ratio: p.expense > 0 ? Math.round((p.income / p.expense) * 100) / 100 : 0,
  }));
}

// ============================================================
//  13. TOP N TRANSACTIONS  (biggest income / expense)
// ============================================================

export interface TopTransaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  contact_name: string | null;
}

export async function getTopTransactions(
  period: Period,
  n = 5,
  type?: "income" | "expense",
  custom?: DateRange,
): Promise<TopTransaction[]> {
  const range = resolveDateRange(period, custom);
  const supabase = createClient();

  let query = supabase
    .from("transactions")
    .select("id, title, amount, type, transaction_date, contact:contacts(name)")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")
    .order("amount", { ascending: false })
    .limit(n);

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    amount: Number(r.amount),
    type: r.type,
    date: r.transaction_date,
    contact_name: r.contact?.name ?? null,
  }));
}

// ============================================================
//  14. SAVINGS RATE  (month by month %)
// ============================================================

export interface SavingsPoint {
  date: string;
  income: number;
  expense: number;
  savings: number;
  savings_rate: number; // (income - expense) / income * 100
}

export async function getSavingsRate(
  period: Period,
  custom?: DateRange,
): Promise<SavingsPoint[]> {
  const { series } = await getTimeSeries(period, custom, "month");
  return series.map((p) => ({
    date: p.date,
    income: p.income,
    expense: p.expense,
    savings: p.net,
    savings_rate:
      p.income > 0 ? Math.round((p.net / p.income) * 10000) / 100 : 0,
  }));
}

// ============================================================
//  FULL DASHBOARD  — single call, runs everything in parallel
// ============================================================

export interface DashboardAnalytics {
  summary: SummaryStats;
  comparison: ComparisonResult;
  timeSeries: { series: TimeSeriesPoint[]; granularity: Granularity };
  cashFlow: CashFlowPoint[];
  tagBreakdown: CategoryBreakdown[];
  topContacts: ContactStat[];
  pending: PendingOverview;
  methodStats: PaymentMethodStat[];
  dayOfWeek: DayOfWeekStat[];
  topIncome: TopTransaction[];
  topExpense: TopTransaction[];
  savingsRate: SavingsPoint[];
}

export async function getDashboardAnalytics(
  period: Period = "this_month",
  custom?: DateRange,
): Promise<DashboardAnalytics> {
  const [
    summary,
    comparison,
    tsResult,
    cashFlow,
    tagBreakdown,
    topContacts,
    pending,
    methodStats,
    dayOfWeek,
    topIncome,
    topExpense,
    savingsRate,
  ] = await Promise.all([
    getSummaryStats(period, custom),
    getComparison(period, custom),
    getTimeSeries(period, custom),
    getCashFlow(period, custom),
    getTagBreakdown(period, custom),
    getContactStats(period, custom, 5),
    getPendingOverview(),
    getPaymentMethodStats(period, custom),
    getDayOfWeekStats(period, custom),
    getTopTransactions(period, 5, "income", custom),
    getTopTransactions(period, 5, "expense", custom),
    getSavingsRate(period, custom),
  ]);

  return {
    summary,
    comparison,
    timeSeries: {
      series: tsResult.series,
      granularity: tsResult.granularity,
    },
    cashFlow,
    tagBreakdown,
    topContacts,
    pending,
    methodStats,
    dayOfWeek,
    topIncome,
    topExpense,
    savingsRate,
  };
}
