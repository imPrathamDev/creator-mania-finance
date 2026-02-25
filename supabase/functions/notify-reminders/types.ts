export interface TodayReminder {
  id: string;
  transaction_id: string;
  remind_at: string;
  status: "pending" | "sent" | "dismissed" | "snoozed";
  message: string | null;
  notify_via: string[];
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;

  // joined from transactions
  transaction: {
    id: string;
    title: string;
    type: "income" | "expense";
    amount: number;
    currency: string;
    payment_status: string;
    due_date: string | null;
    contact_id: string | null;
    contact: {
      address: string | null;
      category: string | null;
      company: string | null;
      created_at: string;
      email: string | null;
      id: string;
      is_active: boolean;
      name: string;
      notes: string | null;
      phone: string | null;
      type: string;
      updated_at: string;
      website: string | null;
    } | null;
  } | null;
}

export interface GetTodayRemindersResult {
  reminders: TodayReminder[];
  date_ist: string; // the IST date used for the query e.g. "2025-02-24"
  range_utc: {
    from: string; // UTC start of IST day
    to: string; // UTC end of IST day
  };
  error: string | null;
}
