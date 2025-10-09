// ==========================================
// FILE 1: lib/utils.js
// ==========================================
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for optimal class merging
 * Handles conflicts intelligently (e.g., 'px-4' overrides 'px-2')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
