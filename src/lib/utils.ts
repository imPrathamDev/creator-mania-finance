import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
