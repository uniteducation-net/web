import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { Locale } from "@/i18n-config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format an ISO date/datetime string for display in the given locale. */
export function formatDate(
  date: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  return new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : "en-GB",
    options,
  ).format(new Date(date))
}
