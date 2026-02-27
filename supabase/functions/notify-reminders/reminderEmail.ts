import { TodayReminder } from "./types.ts";

// ─── Formatters ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getDueSeverity(dueDateStr: string | null): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (!dueDateStr)
    return { label: "No Due Date", color: "#6B7280", bgColor: "#F3F4F6" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0)
    return {
      label: `Overdue by ${Math.abs(diffDays)}d`,
      color: "#DC2626",
      bgColor: "#FEF2F2",
    };
  if (diffDays === 0)
    return { label: "Due Today", color: "#D97706", bgColor: "#FFFBEB" };
  if (diffDays <= 3)
    return {
      label: `Due in ${diffDays}d`,
      color: "#D97706",
      bgColor: "#FFFBEB",
    };
  return {
    label: `Due ${formatDate(dueDateStr)}`,
    color: "#059669",
    bgColor: "#ECFDF5",
  };
}

// ─── Smart Message Generator ───────────────────────────────────────────────────

function buildTransactionContext(reminder: TodayReminder): string {
  const t = reminder.transaction;
  if (!t) return reminder.message ?? "Pending payment requires your attention.";

  const isIncome = t.type === "income";
  const contact = t.contact?.name ?? "Unknown Party";
  const amount = formatCurrency(t.amount, t.currency);
  const dueLabel = getDueSeverity(t.due_date).label;

  const statusNote =
    t.payment_status === "overdue"
      ? `This payment is overdue`
      : t.payment_status === "partially_paid"
        ? `This payment is partially settled`
        : `This payment is outstanding`;

  if (isIncome) {
    return (
      reminder.message ??
      `${statusNote}. ${contact} owes you ${amount}. ${dueLabel}. Please follow up to confirm receipt or collection.`
    );
  } else {
    return (
      reminder.message ??
      `${statusNote}. You owe ${amount} to ${contact}. ${dueLabel}. Please ensure timely payment to avoid penalties.`
    );
  }
}

// ─── HTML Email Template ───────────────────────────────────────────────────────

function buildReminderRow(reminder: TodayReminder, index: number): string {
  const t = reminder.transaction;
  const isIncome = t?.type === "income";
  const severity = getDueSeverity(t?.due_date ?? null);
  const context = buildTransactionContext(reminder);

  const typeColor = isIncome ? "#059669" : "#DC2626";
  const typeBg = isIncome ? "#ECFDF5" : "#FEF2F2";
  const typeLabel = isIncome ? "RECEIVABLE" : "PAYABLE";
  const arrow = isIncome ? "↓" : "↑";

  return `
    <tr>
      <td style="padding: 0 0 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-left: 4px solid ${typeColor};
          border-radius: 8px;
          overflow: hidden;
        ">
          <!-- Header Row -->
          <tr style="background: #F9FAFB;">
            <td style="padding: 14px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="
                      font-family: 'Georgia', serif;
                      font-size: 15px;
                      font-weight: 700;
                      color: #111827;
                    ">${index + 1}. ${t?.title ?? "Untitled Transaction"}</span>
                  </td>
                  <td align="right">
                    <span style="
                      display: inline-block;
                      padding: 3px 10px;
                      background: ${typeBg};
                      color: ${typeColor};
                      font-size: 11px;
                      font-weight: 700;
                      letter-spacing: 0.08em;
                      border-radius: 20px;
                      font-family: monospace;
                    ">${arrow} ${typeLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Details Row -->
          <tr>
            <td style="padding: 14px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Amount -->
                  <td width="33%" style="vertical-align: top; padding-right: 12px;">
                    <p style="margin: 0 0 2px 0; font-size: 11px; color: #6B7280; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.06em;">Amount</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${typeColor}; font-family: 'Georgia', serif;">
                      ${formatCurrency(t?.amount ?? 0, t?.currency ?? "INR")}
                    </p>
                  </td>
                  <!-- Contact -->
                  <td width="33%" style="vertical-align: top; padding-right: 12px;">
                    <p style="margin: 0 0 2px 0; font-size: 11px; color: #6B7280; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.06em;">${isIncome ? "From" : "To"}</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; font-family: Arial, sans-serif;">
                      ${t?.contact?.name ?? "—"}
                    </p>
                    ${t?.contact?.email ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #6B7280; font-family: Arial, sans-serif;">${t.contact.email}</p>` : ""}
                    ${t?.contact?.phone ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #6B7280; font-family: Arial, sans-serif;">${t.contact.phone}</p>` : ""}
                  </td>
                  <!-- Due Date -->
                  <td width="33%" style="vertical-align: top;">
                    <p style="margin: 0 0 2px 0; font-size: 11px; color: #6B7280; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.06em;">Due Date</p>
                    <span style="
                      display: inline-block;
                      padding: 3px 10px;
                      background: ${severity.bgColor};
                      color: ${severity.color};
                      font-size: 12px;
                      font-weight: 600;
                      border-radius: 4px;
                      font-family: Arial, sans-serif;
                    ">${severity.label}</span>
                  </td>
                </tr>
              </table>

              <!-- Reminder Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                <tr>
                  <td style="
                    background: #F9FAFB;
                    border: 1px solid #E5E7EB;
                    border-radius: 6px;
                    padding: 10px 14px;
                  ">
                    <p style="margin: 0; font-size: 13px; color: #374151; font-family: Arial, sans-serif; line-height: 1.5;">
                      <span style="font-weight: 700; color: #6B7280;">📌 Note: </span>${context}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export function buildReminderEmailHtml(
  reminders: TodayReminder[],
  dateIst: string,
): string {
  const income = reminders.filter((r) => r.transaction?.type === "income");
  const expense = reminders.filter((r) => r.transaction?.type === "expense");

  const totalReceivable = income.reduce(
    (s, r) => s + (r.transaction?.amount ?? 0),
    0,
  );
  const totalPayable = expense.reduce(
    (s, r) => s + (r.transaction?.amount ?? 0),
    0,
  );

  const rows = reminders.map((r, i) => buildReminderRow(r, i)).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Reminders – ${dateIst}</title>
</head>
<body style="margin: 0; padding: 0; background: #F3F4F6; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F3F4F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%);
              border-radius: 12px 12px 0 0;
              padding: 32px 36px;
            ">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #93C5FD; letter-spacing: 0.12em; text-transform: uppercase; font-family: Arial, sans-serif;">CreatorMania Finance</p>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #FFFFFF; font-family: 'Georgia', serif;">Payment Reminders</h1>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #BFDBFE; font-family: Arial, sans-serif;">${formatDate(dateIst)}</p>
                  </td>
                  <td align="right">
                    <div style="
                      background: rgba(255,255,255,0.15);
                      border-radius: 50%;
                      width: 56px;
                      height: 56px;
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 28px;
                      line-height: 56px;
                      text-align: center;
                    ">💰</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Bar -->
          <tr>
            <td style="background: #1E3A5F; padding: 0 36px 24px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Total count -->
                  <td width="33%" style="text-align: center; padding: 16px 8px; background: rgba(255,255,255,0.08); border-radius: 8px; margin-right: 8px;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; font-family: 'Georgia', serif;">${reminders.length}</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #93C5FD; text-transform: uppercase; letter-spacing: 0.08em;">Total Reminders</p>
                  </td>
                  <td width="4px"></td>
                  <!-- Receivable -->
                  <td width="33%" style="text-align: center; padding: 16px 8px; background: rgba(5, 150, 105, 0.2); border-radius: 8px;">
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #6EE7B7; font-family: 'Georgia', serif;">${formatCurrency(totalReceivable)}</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #6EE7B7; text-transform: uppercase; letter-spacing: 0.08em;">↓ To Receive (${income.length})</p>
                  </td>
                  <td width="4px"></td>
                  <!-- Payable -->
                  <td width="33%" style="text-align: center; padding: 16px 8px; background: rgba(220, 38, 38, 0.2); border-radius: 8px;">
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #FCA5A5; font-family: 'Georgia', serif;">${formatCurrency(totalPayable)}</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #FCA5A5; text-transform: uppercase; letter-spacing: 0.08em;">↑ To Pay (${expense.length})</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #F9FAFB; padding: 28px 36px; border-radius: 0 0 12px 12px;">

              <!-- Intro -->
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #374151; line-height: 1.6; font-family: Arial, sans-serif;">
                Please review the following pending transactions requiring your attention today. Prompt action ensures smooth cash flow and maintains strong business relationships.
              </p>

              <!-- Reminder Cards -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px 0;">
                <tr><td style="border-top: 1px solid #E5E7EB;"></td></tr>
              </table>

              <!-- Footer Note -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background: #EFF6FF;
                    border: 1px solid #BFDBFE;
                    border-radius: 8px;
                    padding: 14px 18px;
                  ">
                    <p style="margin: 0; font-size: 12px; color: #1E40AF; line-height: 1.6; font-family: Arial, sans-serif;">
                      <strong>ℹ️ Note:</strong> This is an automated reminder generated by CreatorMania Finance. Please do not reply to this email. Log in to your dashboard to manage, dismiss, or snooze these reminders.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; font-family: Arial, sans-serif;">
                © ${new Date().getFullYear()} CreatorMania Finance · Automated Payment Reminders
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Updated send logic ────────────────────────────────────────────────────────

export function buildReminderEmailSubject(
  reminders: TodayReminder[],
  dateIst: string,
): string {
  const overdueCount = reminders.filter((r) => {
    if (!r.transaction?.due_date) return false;
    return new Date(r.transaction.due_date) < new Date();
  }).length;

  const prefix = overdueCount > 0 ? `⚠️ ${overdueCount} Overdue · ` : "";
  return `${prefix}${reminders.length} Payment Reminder${reminders.length > 1 ? "s" : ""} for ${formatDate(dateIst)}`;
}
