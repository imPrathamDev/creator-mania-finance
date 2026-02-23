import { ForwardRefExoticComponent, RefAttributes, useMemo } from "react";
import {
  Banknote,
  Building2,
  CreditCard,
  Wallet,
  Smartphone,
  FileText,
  Bitcoin,
  CircleEllipsis,
  Clock,
  CircleCheck,
  CircleAlert,
  CircleX,
  CircleDashed,
  LucideProps,
} from "lucide-react";

// ============================================================
//  TYPES  (mirror your DB enums)
// ============================================================

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "credit_card"
  | "debit_card"
  | "upi"
  | "cheque"
  | "crypto"
  | "other";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled"
  | "partially_paid";

// ============================================================
//  CONFIG TYPES
// ============================================================

export interface PaymentMethodConfig {
  key: PaymentMethod;
  name: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  description: string;
}

export interface PaymentStatusConfig {
  key: PaymentStatus;
  name: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  color: string; // tailwind text color
  bg: string; // tailwind bg color
  border: string; // tailwind border color
  description: string;
}

// ============================================================
//  PAYMENT METHODS
// ============================================================

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    key: "cash",
    name: "Cash",
    icon: Banknote,
    description: "Physical currency payment",
  },
  {
    key: "bank_transfer",
    name: "Bank Transfer",
    icon: Building2,
    description: "NEFT / RTGS / IMPS transfer",
  },
  {
    key: "credit_card",
    name: "Credit Card",
    icon: CreditCard,
    description: "Payment via credit card",
  },
  {
    key: "debit_card",
    name: "Debit Card",
    icon: Wallet,
    description: "Payment via debit card",
  },
  {
    key: "upi",
    name: "UPI",
    icon: Smartphone,
    description: "GPay, PhonePe, Paytm, etc.",
  },
  {
    key: "cheque",
    name: "Cheque",
    icon: FileText,
    description: "Payment by cheque",
  },
  {
    key: "crypto",
    name: "Crypto",
    icon: Bitcoin,
    description: "Cryptocurrency payment",
  },
  {
    key: "other",
    name: "Other",
    icon: CircleEllipsis,
    description: "Any other payment method",
  },
];

// ============================================================
//  PAYMENT STATUSES
// ============================================================

export const PAYMENT_STATUSES: PaymentStatusConfig[] = [
  {
    key: "pending",
    name: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    description: "Payment is due but not yet made",
  },
  {
    key: "paid",
    name: "Paid",
    icon: CircleCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    description: "Payment has been completed",
  },
  {
    key: "overdue",
    name: "Overdue",
    icon: CircleAlert,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    description: "Payment is past its due date",
  },
  {
    key: "cancelled",
    name: "Cancelled",
    icon: CircleX,
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    description: "Transaction has been cancelled",
  },
  {
    key: "partially_paid",
    name: "Partially Paid",
    icon: CircleDashed,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "A portion of the payment has been made",
  },
];

// ============================================================
//  LOOKUP HELPERS
// ============================================================

export const PAYMENT_METHOD_MAP = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.key, m]),
) as Record<PaymentMethod, PaymentMethodConfig>;

export const PAYMENT_STATUS_MAP = Object.fromEntries(
  PAYMENT_STATUSES.map((s) => [s.key, s]),
) as Record<PaymentStatus, PaymentStatusConfig>;

// ============================================================
//  HOOKS
// ============================================================

export function usePaymentMethods() {
  const paymentMethods = useMemo(() => PAYMENT_METHODS, []);
  const getMethod = useMemo(
    () => (key: PaymentMethod) => PAYMENT_METHOD_MAP[key],
    [],
  );
  return { paymentMethods, getMethod };
}

export function usePaymentStatuses() {
  const paymentStatuses = useMemo(() => PAYMENT_STATUSES, []);
  const getStatus = useMemo(
    () => (key: PaymentStatus) => PAYMENT_STATUS_MAP[key],
    [],
  );
  return { paymentStatuses, getStatus };
}
