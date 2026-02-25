import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GetTodayRemindersResult, TodayReminder } from "./types.ts";

const IST_OFFSET_MINUTES = 5 * 60 + 30; // 330 minutes

/**
 * Returns the current Date object shifted to IST.
 * The underlying UTC value is wrong but the local fields
 * (getFullYear, getMonth, getDate, getHours …) will reflect IST.
 */
function nowInIST(): Date {
  const utcMs = Date.now();
  const istMs = utcMs + IST_OFFSET_MINUTES * 60 * 1000;
  return new Date(istMs);
}

/**
 * Returns the UTC ISO strings for the start and end of
 * "today" in IST — i.e. 00:00:00 IST and 23:59:59.999 IST
 * expressed as UTC timestamps.
 *
 * Example (IST date 2025-02-24):
 *   start → 2025-02-23T18:30:00.000Z   (midnight IST = 18:30 UTC prev day)
 *   end   → 2025-02-24T18:29:59.999Z   (23:59:59 IST = 18:29:59 UTC)
 */
function getTodayISTRangeUTC(): {
  dateIST: string;
  startUTC: string;
  endUTC: string;
} {
  const ist = nowInIST();

  // Extract IST calendar date fields
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth(); // 0-based
  const day = ist.getUTCDate();

  // IST midnight = that calendar date at 00:00 IST
  // In UTC that is: subtract 5h30m  →  previous day 18:30 UTC
  const startIST = Date.UTC(year, month, day, 0, 0, 0, 0);
  const startUTC = new Date(startIST - IST_OFFSET_MINUTES * 60 * 1000);

  // IST end of day = 23:59:59.999 IST
  const endIST = Date.UTC(year, month, day, 23, 59, 59, 999);
  const endUTC = new Date(endIST - IST_OFFSET_MINUTES * 60 * 1000);

  // IST date string for display: YYYY-MM-DD
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateIST = `${year}-${pad(month + 1)}-${pad(day)}`;

  return {
    dateIST,
    startUTC: startUTC.toISOString(),
    endUTC: endUTC.toISOString(),
  };
}

// ============================================================
//  MAIN FUNCTION
// ============================================================

/**
 * Fetches all reminders whose remind_at falls within today's
 * date in IST, regardless of where the server is hosted.
 *
 * Optionally filter by status (default: only 'pending' and 'snoozed').
 */
export async function getTodayReminders(
  supabase: ReturnType<typeof createClient>,
  options?: {
    statuses?: ("pending" | "sent" | "dismissed" | "snoozed")[];
    withTransaction?: boolean; // join transaction data (default: true)
  },
): Promise<GetTodayRemindersResult> {
  const { statuses = ["pending", "snoozed"], withTransaction = true } =
    options ?? {};

  const { dateIST, startUTC, endUTC } = getTodayISTRangeUTC();

  try {
    const select = withTransaction
      ? `
          *,
          transaction:transactions(
            id,
            title,
            type,
            amount,
            currency,
            payment_status,
            due_date,
            contact_id,
            contact:contacts(*)
          )
        `
      : "*";

    const query = supabase
      .from("reminders")
      .select(select)
      .gte("remind_at", startUTC) // remind_at >= start of IST day in UTC
      .lte("remind_at", endUTC) // remind_at <= end   of IST day in UTC
      .in("status", statuses)
      .order("remind_at", { ascending: true });

    // For snoozed reminders: only include if snoozed_until is in the past
    // i.e. the snooze has expired and reminder is active again
    // We do this filter client-side since Supabase OR with null is tricky
    const { data, error } = await query;

    if (error) throw error;

    // Filter out snoozed reminders where snooze hasn't expired yet
    const now = new Date().toISOString();
    const reminders = ((data ?? []) as TodayReminder[]).filter((r) => {
      if (r.status === "snoozed" && r.snoozed_until) {
        return r.snoozed_until <= now; // snooze expired → show it
      }
      return true;
    });

    return {
      reminders,
      date_ist: dateIST,
      range_utc: { from: startUTC, to: endUTC },
      error: null,
    };
  } catch (err: unknown) {
    return {
      reminders: [],
      date_ist: dateIST,
      range_utc: { from: startUTC, to: endUTC },
      error: err instanceof Error ? err.message : "Failed to fetch reminders",
    };
  }
}

// ============================================================
//  CONVENIENCE VARIANTS
// ============================================================

/** Only pending reminders for today (IST). */
export async function getTodayPendingReminders(
  supabase: ReturnType<typeof createClient>,
) {
  return getTodayReminders(supabase, {
    statuses: ["pending"],
    withTransaction: true,
  });
}

/** Pending + snoozed-but-expired reminders for today (IST). */
export async function getTodayActiveReminders(
  supabase: ReturnType<typeof createClient>,
) {
  return getTodayReminders(supabase, { statuses: ["pending", "snoozed"] });
}

/** All reminders for today regardless of status (IST). */
export async function getTodayAllReminders(
  supabase: ReturnType<typeof createClient>,
) {
  return getTodayReminders(supabase, {
    statuses: ["pending", "sent", "dismissed", "snoozed"],
  });
}
