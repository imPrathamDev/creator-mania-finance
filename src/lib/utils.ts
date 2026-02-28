import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import millify from "millify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isStringArray(value: any): value is string[] {
  // First, check if the value is an array
  if (!Array.isArray(value)) {
    return false;
  }

  // Then, iterate through the array to check if all elements are strings
  for (const item of value) {
    if (typeof item !== "string") {
      return false;
    }
  }

  // If both checks pass, it's an array of strings
  return true;
}

export function fmt(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtDate(d: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export function balanceClass(balance: number) {
  if (balance > 0) return "text-green-600 dark:text-green-400";
  if (balance < 0) return "text-red-600   dark:text-red-400";
  return "text-muted-foreground";
}

export const millifyNumbers = (value: number, precision?: number) => {
  return millify(value, {
    precision: precision ?? 3,
    locales: "en-IN",
  });
};
