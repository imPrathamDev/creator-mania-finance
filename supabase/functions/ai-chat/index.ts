import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import OpenAI from "npm:openai"
import { createClient } from "npm:@supabase/supabase-js"

// ============================================================
//  INIT
// ============================================================

const openai   = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! })
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// ============================================================
//  SYSTEM PROMPT
// ============================================================

const SYSTEM_PROMPT = `
You are a smart financial assistant for a personal expense and income tracker app.
You help users understand their financial data and can also CREATE transactions on their behalf.

Guidelines:
- Always call the relevant function(s) before answering data questions — never make up numbers.
- When a user asks a vague question like "how am I doing?", call get_summary with period "this_month".
- Format currency in INR (Indian Rupees) unless user says otherwise.
- When presenting numbers, be concise — use summaries, not raw JSON dumps.
- For comparisons, always mention the % change vs previous period.
- Be conversational — explain what the numbers mean, not just what they are.
- If multiple functions are needed, call them before responding.

CREATING TRANSACTIONS:
- When user wants to add/record/create a transaction, use the create_transaction tool.
- Follow this exact order: 1) resolve contact 2) resolve/create tags 3) insert transaction 4) link tags 5) create reminder if needed.
- If user gives a contact name, first call search_contacts to check if they exist.
- If contact doesn't exist, create_transaction will create them automatically.
- Infer transaction type: paying someone = expense, receiving from someone = income.
- Default payment_status to "paid" unless user says otherwise.
- Default payment_method to "upi" unless user says otherwise.
- Default transaction_date to today (IST) unless user specifies.
- If user mentions "remind me" or a due date, set reminder_date and optionally reminder_message.
- After creating, confirm with a brief summary of what was created.

Periods: today, this_week, this_month, this_quarter, this_year,
  last_week, last_month, last_quarter, last_year,
  last_7_days, last_30_days, last_90_days, last_12_months, custom.
`.trim()

// ============================================================
//  IST DATE HELPERS
// ============================================================

const IST_OFFSET = 5 * 60 + 30

function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET * 60_000)
}

function toIST(d: Date): string {
  const y  = d.getUTCFullYear()
  const m  = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dy = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${dy}`
}

function todayISO(): string {
  return toIST(nowIST())
}

function startOfWeek(d: Date): Date {
  const day  = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const r    = new Date(d)
  r.setUTCDate(d.getUTCDate() + diff)
  return r
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getUTCMonth() / 3)
  return new Date(Date.UTC(d.getUTCFullYear(), q * 3, 1))
}

function resolvePeriod(period: string, date_from?: string, date_to?: string): { from: string; to: string } {
  if (period === "custom" && date_from && date_to) return { from: date_from, to: date_to }
  const now = nowIST()
  const y   = now.getUTCFullYear()
  const m   = now.getUTCMonth()
  const dy  = now.getUTCDate()
  const fmt = (d: Date) => toIST(d)
  const ymd = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day))

  switch (period) {
    case "today":          return { from: fmt(now), to: fmt(now) }
    case "this_week":      return { from: fmt(startOfWeek(now)), to: fmt(now) }
    case "this_month":     return { from: fmt(ymd(y, m, 1)), to: fmt(now) }
    case "this_quarter":   return { from: fmt(startOfQuarter(now)), to: fmt(now) }
    case "this_year":      return { from: fmt(ymd(y, 0, 1)), to: fmt(now) }
    case "last_week": {
      const sow  = startOfWeek(now)
      const eow  = new Date(sow); eow.setUTCDate(sow.getUTCDate() - 1)
      const sowp = new Date(sow); sowp.setUTCDate(sow.getUTCDate() - 7)
      return { from: fmt(sowp), to: fmt(eow) }
    }
    case "last_month": {
      const first    = ymd(y, m, 1)
      const lastDay  = new Date(first); lastDay.setUTCDate(0)
      const firstLast = ymd(lastDay.getUTCFullYear(), lastDay.getUTCMonth(), 1)
      return { from: fmt(firstLast), to: fmt(lastDay) }
    }
    case "last_quarter": {
      const soq  = startOfQuarter(now)
      const eoq  = new Date(soq); eoq.setUTCDate(soq.getUTCDate() - 1)
      const soqp = startOfQuarter(eoq)
      return { from: fmt(soqp), to: fmt(eoq) }
    }
    case "last_year":      return { from: fmt(ymd(y - 1, 0, 1)), to: fmt(ymd(y - 1, 11, 31)) }
    case "last_7_days":  { const s = new Date(now); s.setUTCDate(dy - 6);  return { from: fmt(s), to: fmt(now) } }
    case "last_30_days": { const s = new Date(now); s.setUTCDate(dy - 29); return { from: fmt(s), to: fmt(now) } }
    case "last_90_days": { const s = new Date(now); s.setUTCDate(dy - 89); return { from: fmt(s), to: fmt(now) } }
    case "last_12_months":{ const s = ymd(y, m - 11, 1); return { from: fmt(s), to: fmt(now) } }
    default:               return { from: fmt(ymd(y, m, 1)), to: fmt(now) }
  }
}

function previousPeriod(range: { from: string; to: string }) {
  const from  = new Date(range.from)
  const to    = new Date(range.to)
  const days  = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
  const pTo   = new Date(from); pTo.setUTCDate(pTo.getUTCDate() - 1)
  const pFrom = new Date(pTo);  pFrom.setUTCDate(pFrom.getUTCDate() - days + 1)
  return { from: toIST(pFrom), to: toIST(pTo) }
}

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((curr - prev) / prev) * 10000) / 100
}

// random tag color pool
const TAG_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e",
  "#14b8a6","#3b82f6","#8b5cf6","#ec4899",
]

// ============================================================
//  READ TOOLS
// ============================================================

async function getSummary(period: string, date_from?: string, date_to?: string) {
  const range = resolvePeriod(period, date_from, date_to)
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, payment_status")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")

  const s = { period_from: range.from, period_to: range.to, total_income: 0, total_expense: 0, net: 0, txn_count: 0, avg_income: 0, avg_expense: 0, paid_count: 0, pending_count: 0, overdue_count: 0 }
  let ic = 0, ec = 0
  for (const r of data ?? []) {
    const amt = Number(r.amount)
    s.txn_count++
    if (r.type === "income")  { s.total_income  += amt; ic++ }
    if (r.type === "expense") { s.total_expense += amt; ec++ }
    if (r.payment_status === "paid")    s.paid_count++
    if (r.payment_status === "pending") s.pending_count++
    if (r.payment_status === "overdue") s.overdue_count++
  }
  s.avg_income  = ic ? s.total_income  / ic : 0
  s.avg_expense = ec ? s.total_expense / ec : 0
  s.net         = s.total_income - s.total_expense
  return s
}

async function getComparison(period: string, date_from?: string, date_to?: string) {
  const range = resolvePeriod(period, date_from, date_to)
  const prev  = previousPeriod(range)
  const [current, previous] = await Promise.all([
    getSummary("custom", range.from, range.to),
    getSummary("custom", prev.from,  prev.to),
  ])
  return {
    current, previous,
    changes: {
      income_pct:  pct(current.total_income,  previous.total_income),
      expense_pct: pct(current.total_expense, previous.total_expense),
      net_pct:     pct(current.net,           previous.net),
      count_pct:   pct(current.txn_count,     previous.txn_count),
    },
  }
}

async function getPending() {
  const in7  = toIST(new Date(Date.now() + (IST_OFFSET + 7  * 24 * 60) * 60_000))
  const in30 = toIST(new Date(Date.now() + (IST_OFFSET + 30 * 24 * 60) * 60_000))
  const { data } = await supabase
    .from("transactions")
    .select("amount, payment_status, due_date")
    .in("payment_status", ["pending", "overdue", "partially_paid"])

  const out = { pending_count: 0, pending_amount: 0, overdue_count: 0, overdue_amount: 0, partially_count: 0, partially_amount: 0, upcoming_7d: { count: 0, amount: 0 }, upcoming_30d: { count: 0, amount: 0 }, oldest_overdue: null as string | null }
  for (const r of data ?? []) {
    const amt = Number(r.amount)
    if (r.payment_status === "pending")        { out.pending_count++;   out.pending_amount   += amt }
    if (r.payment_status === "overdue")        { out.overdue_count++;   out.overdue_amount   += amt }
    if (r.payment_status === "partially_paid") { out.partially_count++; out.partially_amount += amt }
    if (r.due_date) {
      if (r.due_date <= in7)  { out.upcoming_7d.count++;  out.upcoming_7d.amount  += amt }
      if (r.due_date <= in30) { out.upcoming_30d.count++; out.upcoming_30d.amount += amt }
      if (r.payment_status === "overdue" && (!out.oldest_overdue || r.due_date < out.oldest_overdue)) out.oldest_overdue = r.due_date
    }
  }
  return out
}

async function getTagBreakdown(period: string, date_from?: string, date_to?: string) {
  const range = resolvePeriod(period, date_from, date_to)
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, transaction_tags(tag:tags(id, name, color))")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")

  const map = new Map<string, any>()
  let ti = 0, te = 0
  for (const r of data ?? []) {
    const amt  = Number(r.amount)
    if (r.type === "income")  ti += amt
    if (r.type === "expense") te += amt
    const tags = (r.transaction_tags ?? []).map((tt: any) => tt.tag).filter(Boolean)
    const list = tags.length ? tags : [{ id: "__untagged__", name: "Untagged", color: null }]
    for (const tag of list) {
      if (!map.has(tag.id)) map.set(tag.id, { tag_id: tag.id, tag_name: tag.name, tag_color: tag.color, income: 0, expense: 0, net: 0, count: 0 })
      const b = map.get(tag.id)!
      b.count++
      if (r.type === "income")  b.income  += amt
      if (r.type === "expense") b.expense += amt
      b.net = b.income - b.expense
    }
  }
  return Array.from(map.values()).map((b: any) => ({
    ...b,
    pct_income:  ti > 0 ? Math.round((b.income  / ti) * 10000) / 100 : 0,
    pct_expense: te > 0 ? Math.round((b.expense / te) * 10000) / 100 : 0,
  })).sort((a: any, b: any) => b.expense - a.expense)
}

async function getTopContacts(period: string, limit = 5, date_from?: string, date_to?: string) {
  const range = resolvePeriod(period, date_from, date_to)
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date, contact:contacts(id, name, type, company)")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")
    .not("contact_id", "is", null)

  const map = new Map<string, any>()
  for (const r of data ?? []) {
    const c = (r as any).contact
    if (!c) continue
    const amt = Number(r.amount)
    if (!map.has(c.id)) map.set(c.id, { contact_id: c.id, contact_name: c.name, contact_type: c.type, company: c.company, total_income: 0, total_expense: 0, net: 0, txn_count: 0, last_txn_date: null })
    const s = map.get(c.id)!
    s.txn_count++
    if (r.type === "income")  s.total_income  += amt
    if (r.type === "expense") s.total_expense += amt
    s.net = s.total_income - s.total_expense
    if (!s.last_txn_date || r.transaction_date > s.last_txn_date) s.last_txn_date = r.transaction_date
  }
  return Array.from(map.values()).sort((a: any, b: any) => (b.total_income + b.total_expense) - (a.total_income + a.total_expense)).slice(0, limit)
}

async function getTopTransactions(period: string, type: "income" | "expense", limit = 5, date_from?: string, date_to?: string) {
  const range = resolvePeriod(period, date_from, date_to)
  const { data } = await supabase
    .from("transactions")
    .select("id, title, amount, type, transaction_date, contact:contacts(name)")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")
    .eq("type", type)
    .order("amount", { ascending: false })
    .limit(limit)

  return (data ?? []).map((r: any) => ({
    id: r.id, title: r.title, amount: Number(r.amount),
    type: r.type, date: r.transaction_date, contact_name: r.contact?.name ?? null,
  }))
}

async function getPaymentMethods(period: string, date_from?: string, date_to?: string) {
  const range = resolvePeriod(period, date_from, date_to)
  const { data } = await supabase
    .from("transactions")
    .select("type, payment_method, amount")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .neq("payment_status", "cancelled")

  const map = new Map<string, any>()
  let ti = 0, te = 0
  for (const r of data ?? []) {
    const key = r.payment_method ?? "unspecified"
    const amt = Number(r.amount)
    if (!map.has(key)) map.set(key, { method: key, income: 0, expense: 0, net: 0, income_count: 0, expense_count: 0 })
    const s = map.get(key)!
    if (r.type === "income")  { s.income  += amt; s.income_count++;  ti += amt }
    if (r.type === "expense") { s.expense += amt; s.expense_count++; te += amt }
    s.net = s.income - s.expense
  }
  return Array.from(map.values()).map((s: any) => ({
    ...s, total_count: s.income_count + s.expense_count,
    pct_income:  ti > 0 ? Math.round((s.income  / ti) * 10000) / 100 : 0,
    pct_expense: te > 0 ? Math.round((s.expense / te) * 10000) / 100 : 0,
  })).sort((a: any, b: any) => (b.income + b.expense) - (a.income + a.expense))
}

async function searchTransactions(query: string, type?: string, payment_status?: string, limit = 10) {
  let q = supabase
    .from("transactions")
    .select("id, title, type, amount, currency, payment_status, transaction_date, contact:contacts(name)")
    .or(`title.ilike.%${query}%,notes.ilike.%${query}%,description.ilike.%${query}%,reference_number.ilike.%${query}%`)
    .limit(limit)
  if (type)           q = q.eq("type", type)
  if (payment_status) q = q.eq("payment_status", payment_status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data
}

async function searchContacts(query: string, type?: string, limit = 10) {
  let q = supabase
    .from("contacts")
    .select("id, name, type, email, phone, company, is_active")
    .or(`name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit)
  if (type) q = q.eq("type", type)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data
}

async function listTags() {
  const { data, error } = await supabase.from("tags").select("id, name, color").order("name")
  if (error) throw new Error(error.message)
  return data
}

// ============================================================
//  CREATE TRANSACTION TOOL
//  Mirrors the frontend flow exactly:
//  1. resolve/create contact
//  2. insert transaction
//  3. create new tags + link existing tags
//  4. create reminder if pending/partially_paid + reminder_date
// ============================================================

interface CreateTransactionArgs {
  title:             string
  type:              "income" | "expense"
  amount:            number
  contact_name:      string
  transaction_date?: string          // ISO date, defaults to today IST
  payment_method?:   string          // default: upi
  payment_status?:   string          // default: paid
  description?:      string
  notes?:            string
  invoice_number?:   string
  reference_number?: string
  receipt_url?:      string
  existing_tag_ids?: string[]        // IDs of existing tags to link
  new_tag_names?:    string[]        // new tag names to create then link
  reminder_date?:    string          // ISO datetime — only used when pending/partially_paid
  reminder_message?: string
}

async function createTransaction(args: CreateTransactionArgs) {
  const {
    title, type, amount, contact_name,
    transaction_date = todayISO(),
    payment_method   = "upi",
    payment_status   = "paid",
    description, notes, invoice_number, reference_number, receipt_url,
    existing_tag_ids = [],
    new_tag_names    = [],
    reminder_date, reminder_message,
  } = args

  // ── 1. Resolve contact ──────────────────────────────────
  let contact_id: string

  // search by exact name first
  const { data: existing } = await supabase
    .from("contacts")
    .select("id, name")
    .ilike("name", contact_name.trim())
    .limit(1)

  if (existing && existing.length > 0) {
    contact_id = existing[0].id
  } else {
    // create new contact — infer type from transaction type
    const { data: newContact, error: contactErr } = await supabase
      .from("contacts")
      .insert({
        name: contact_name.trim(),
        type: type === "expense" ? "vendor" : "client",
      })
      .select("id")
      .single()

    if (contactErr || !newContact) {
      throw new Error(`Failed to create contact: ${contactErr?.message}`)
    }
    contact_id = newContact.id
  }

  // ── 2. Insert transaction ───────────────────────────────
  const { data: txn, error: txnErr } = await supabase
    .from("transactions")
    .insert({
      title:            title.trim(),
      type,
      amount,
      contact_id,
      transaction_date,
      payment_method,
      payment_status,
      ...(description      && { description      }),
      ...(notes            && { notes             }),
      ...(invoice_number   && { invoice_number    }),
      ...(reference_number && { reference_number  }),
      ...(receipt_url      && { receipt_url       }),
      ...(reminder_date    && { due_date: reminder_date }),
    })
    .select("id, title, amount, type, payment_status")
    .single()

  if (txnErr || !txn) {
    throw new Error(`Failed to create transaction: ${txnErr?.message}`)
  }

  // ── 3. Create new tags + link all tags ──────────────────
  const createdTagIds: string[] = []

  if (new_tag_names.length > 0) {
    const tagInserts = await Promise.all(
      new_tag_names.map((name) =>
        supabase
          .from("tags")
          .insert({
            name: name.trim(),
            color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
          })
          .select("id")
          .single()
      )
    )
    for (const r of tagInserts) {
      if (!r.error && r.data) createdTagIds.push(r.data.id)
    }
  }

  const allTagIds = [...existing_tag_ids, ...createdTagIds]
  if (allTagIds.length > 0) {
    await Promise.all(
      allTagIds.map((tag_id) =>
        supabase.from("transaction_tags").insert({ tag_id, transaction_id: txn.id })
      )
    )
  }

  // ── 4. Create reminder (only when pending/partially_paid) ─
  if (
    reminder_date &&
    (payment_status === "pending" || payment_status === "partially_paid")
  ) {
    await supabase.from("reminders").insert({
      transaction_id: txn.id,
      remind_at:      reminder_date,
      ...(reminder_message?.trim() && { message: reminder_message.trim() }),
    })
  }

  return {
    success:        true,
    transaction_id: txn.id,
    title:          txn.title,
    amount:         txn.amount,
    type:           txn.type,
    payment_status: txn.payment_status,
    contact_name,
    contact_id,
    tags_linked:    allTagIds.length,
    reminder_set:   !!(reminder_date && (payment_status === "pending" || payment_status === "partially_paid")),
  }
}

// ============================================================
//  OPENAI TOOLS SCHEMA
// ============================================================

const PERIOD_ENUM  = ["today","this_week","this_month","this_quarter","this_year","last_week","last_month","last_quarter","last_year","last_7_days","last_30_days","last_90_days","last_12_months","custom"]
const PERIOD_PARAM = { type: "string", enum: PERIOD_ENUM, description: "Time period. Use 'custom' with date_from/date_to for a custom range." }
const DATE_FROM    = { type: "string", description: "Start date YYYY-MM-DD (only for custom period)" }
const DATE_TO      = { type: "string", description: "End date YYYY-MM-DD (only for custom period)" }

const TOOLS: OpenAI.ChatCompletionTool[] = [
  // ── read tools (unchanged) ─────────────────────────────
  { type: "function", function: { name: "get_summary",          description: "Get total income, expense, net, counts, and averages for a period.",                           parameters: { type: "object", properties: { period: PERIOD_PARAM, date_from: DATE_FROM, date_to: DATE_TO }, required: ["period"] } } },
  { type: "function", function: { name: "get_comparison",       description: "Compare current period vs previous period — income, expense, net % changes.",                 parameters: { type: "object", properties: { period: PERIOD_PARAM, date_from: DATE_FROM, date_to: DATE_TO }, required: ["period"] } } },
  { type: "function", function: { name: "get_pending",          description: "Get all pending, overdue, and partially paid transaction counts, amounts, and upcoming dues.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_tag_breakdown",    description: "Get spending and income broken down by tag/category for a period.",                           parameters: { type: "object", properties: { period: PERIOD_PARAM, date_from: DATE_FROM, date_to: DATE_TO }, required: ["period"] } } },
  { type: "function", function: { name: "get_top_contacts",     description: "Get top clients/vendors by total transaction amount.",                                         parameters: { type: "object", properties: { period: PERIOD_PARAM, limit: { type: "number" }, date_from: DATE_FROM, date_to: DATE_TO }, required: ["period"] } } },
  { type: "function", function: { name: "get_top_transactions", description: "Get the largest income or expense transactions for a period.",                                 parameters: { type: "object", properties: { period: PERIOD_PARAM, type: { type: "string", enum: ["income","expense"] }, limit: { type: "number" }, date_from: DATE_FROM, date_to: DATE_TO }, required: ["period","type"] } } },
  { type: "function", function: { name: "get_payment_methods",  description: "Get breakdown by payment method (UPI, cash, card, etc.) with income and expense split.",     parameters: { type: "object", properties: { period: PERIOD_PARAM, date_from: DATE_FROM, date_to: DATE_TO }, required: ["period"] } } },
  { type: "function", function: { name: "search_transactions",  description: "Search transactions by title, notes, or reference number.",                                   parameters: { type: "object", properties: { query: { type: "string" }, type: { type: "string", enum: ["income","expense"] }, payment_status: { type: "string", enum: ["pending","paid","overdue","cancelled","partially_paid"] }, limit: { type: "number" } }, required: ["query"] } } },
  { type: "function", function: { name: "search_contacts",      description: "Search contacts by name, company, or email.",                                                 parameters: { type: "object", properties: { query: { type: "string" }, type: { type: "string", enum: ["client","vendor","both"] }, limit: { type: "number" } }, required: ["query"] } } },
  { type: "function", function: { name: "list_tags",            description: "List all available tags.",                                                                     parameters: { type: "object", properties: {} } } },

  // ── create transaction ─────────────────────────────────
  {
    type: "function",
    function: {
      name: "create_transaction",
      description: "Create a new transaction. Automatically resolves or creates the contact, creates new tags, links existing tags, and sets up a reminder if needed. Use this when the user says they want to add, record, or create a transaction.",
      parameters: {
        type: "object",
        properties: {
          title:             { type: "string",  description: "Short descriptive title for the transaction" },
          type:              { type: "string",  enum: ["income","expense"], description: "income = money received, expense = money paid out" },
          amount:            { type: "number",  description: "Amount in INR (or user-specified currency)" },
          contact_name:      { type: "string",  description: "Name of the person or business. Will be searched first; created if not found." },
          transaction_date:  { type: "string",  description: "Date in YYYY-MM-DD format. Defaults to today (IST) if not provided." },
          payment_method:    { type: "string",  enum: ["cash","bank_transfer","credit_card","debit_card","upi","cheque","crypto","other"], description: "Default: upi" },
          payment_status:    { type: "string",  enum: ["paid","pending","partially_paid","overdue","cancelled"], description: "Default: paid" },
          description:       { type: "string",  description: "Optional longer description" },
          notes:             { type: "string",  description: "Optional private notes" },
          invoice_number:    { type: "string",  description: "Optional invoice number" },
          reference_number:  { type: "string",  description: "Optional bank/payment reference" },
          receipt_url:       { type: "string",  description: "Optional receipt link" },
          existing_tag_ids:  { type: "array",   items: { type: "string" }, description: "IDs of existing tags to link. Call list_tags first if you need to find IDs." },
          new_tag_names:     { type: "array",   items: { type: "string" }, description: "Names of new tags to create and link." },
          reminder_date:     { type: "string",  description: "ISO datetime for the reminder. Only creates a reminder when payment_status is pending or partially_paid." },
          reminder_message:  { type: "string",  description: "Optional message for the reminder notification." },
        },
        required: ["title", "type", "amount", "contact_name"],
      },
    },
  },
]

// ============================================================
//  TOOL DISPATCH
// ============================================================

async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "get_summary":          return getSummary(args.period, args.date_from, args.date_to)
    case "get_comparison":       return getComparison(args.period, args.date_from, args.date_to)
    case "get_pending":          return getPending()
    case "get_tag_breakdown":    return getTagBreakdown(args.period, args.date_from, args.date_to)
    case "get_top_contacts":     return getTopContacts(args.period, args.limit ?? 5, args.date_from, args.date_to)
    case "get_top_transactions": return getTopTransactions(args.period, args.type, args.limit ?? 5, args.date_from, args.date_to)
    case "get_payment_methods":  return getPaymentMethods(args.period, args.date_from, args.date_to)
    case "search_transactions":  return searchTransactions(args.query, args.type, args.payment_status, args.limit ?? 10)
    case "search_contacts":      return searchContacts(args.query, args.type, args.limit ?? 10)
    case "list_tags":            return listTags()
    case "create_transaction":   return createTransaction(args)
    default:                     throw new Error(`Unknown tool: ${name}`)
  }
}

// ============================================================
//  AGENTIC LOOP
// ============================================================

async function runAgenticLoop(
  messages:   OpenAI.ChatCompletionMessageParam[],
  controller: ReadableStreamDefaultController,
  encoder:    TextEncoder,
  maxSteps =  8,   // increased for create flow (search → create contact → insert → tags → reminder)
) {
  let stepMessages = [...messages]

  for (let step = 0; step < maxSteps; step++) {
    const response = await openai.chat.completions.create({
      model:       "gpt-4o",
      messages:    stepMessages,
      tools:       TOOLS,
      tool_choice: "auto",
      stream:      true,
    })

    let fullContent  = ""
    let toolCalls:    any[] = []
    let finishReason = ""

    for await (const chunk of response) {
      const delta  = chunk.choices[0]?.delta
      finishReason = chunk.choices[0]?.finish_reason ?? finishReason

      if (delta?.content) {
        fullContent += delta.content
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta.content })}\n\n`))
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCalls[tc.index]) {
            toolCalls[tc.index] = { id: tc.id, type: "function", function: { name: "", arguments: "" } }
          }
          if (tc.function?.name)      toolCalls[tc.index].function.name      += tc.function.name
          if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments
        }
      }
    }

    if (finishReason === "stop" || toolCalls.length === 0) break

    for (const tc of toolCalls) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", name: tc.function.name })}\n\n`))
    }

    stepMessages.push({ role: "assistant", content: fullContent || null, tool_calls: toolCalls } as any)

    const results = await Promise.all(
      toolCalls.map(async (tc) => {
        try {
          const args   = JSON.parse(tc.function.arguments)
          const result = await executeTool(tc.function.name, args)
          return { id: tc.id, name: tc.function.name, result }
        } catch (err: any) {
          return { id: tc.id, name: tc.function.name, result: { error: err.message } }
        }
      })
    )

    for (const r of results) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: r.name })}\n\n`))
      stepMessages.push({ role: "tool", tool_call_id: r.id, content: JSON.stringify(r.result) })
    }
  }
}

// ============================================================
//  HANDLER  — accepts chat_id for history persistence
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS })

  try {
    const body = await req.json()
    const { messages, chat_id } = body as { messages: any[]; chat_id?: string }

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } })
    }

    const fullMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ]

    const encoder    = new TextEncoder()
    let   assistantText = ""          // accumulate to save to DB after stream

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // wrap runAgenticLoop to also capture final assistant text
          let stepMessages = fullMessages.slice()
          const maxSteps   = 8

          for (let step = 0; step < maxSteps; step++) {
            const response = await openai.chat.completions.create({
              model: "gpt-4o", messages: stepMessages, tools: TOOLS, tool_choice: "auto", stream: true,
            })

            let fullContent  = ""
            let toolCalls:    any[] = []
            let finishReason = ""

            for await (const chunk of response) {
              const delta  = chunk.choices[0]?.delta
              finishReason = chunk.choices[0]?.finish_reason ?? finishReason

              if (delta?.content) {
                fullContent += delta.content
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta.content })}\n\n`))
              }
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: tc.id, type: "function", function: { name: "", arguments: "" } }
                  if (tc.function?.name)      toolCalls[tc.index].function.name      += tc.function.name
                  if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments
                }
              }
            }

            if (fullContent) assistantText += fullContent

            if (finishReason === "stop" || toolCalls.length === 0) break

            for (const tc of toolCalls) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", name: tc.function.name })}\n\n`))
            }

            stepMessages.push({ role: "assistant", content: fullContent || null, tool_calls: toolCalls } as any)

            const results = await Promise.all(
              toolCalls.map(async (tc) => {
                try {
                  const args   = JSON.parse(tc.function.arguments)
                  const result = await executeTool(tc.function.name, args)
                  return { id: tc.id, name: tc.function.name, result }
                } catch (err: any) {
                  return { id: tc.id, name: tc.function.name, result: { error: err.message } }
                }
              })
            )

            for (const r of results) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: r.name })}\n\n`))
              stepMessages.push({ role: "tool", tool_call_id: r.id, content: JSON.stringify(r.result) })
            }
          }

          // ── persist chat to DB ─────────────────────────
          if (chat_id && assistantText) {
            // get the last user message to save
            const lastUser = [...messages].reverse().find((m) => m.role === "user")

            if (lastUser) {
              // save user message
              await supabase.from("ai_chat_messages").insert({
                chat_id,
                role:    "user",
                content: lastUser.content,
              })
            }

            // save assistant response
            await supabase.from("ai_chat_messages").insert({
              chat_id,
              role:    "assistant",
              content: assistantText,
            })
          }

          // send final chat_id so client can store it
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", chat_id })}\n\n`))

        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`))
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { ...CORS_HEADERS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }
})