import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig, type Locale } from "@/config/site";
import type { LocalizedText } from "@/lib/api/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Picks the text for the active locale, falling back to the other language when one side is empty. */
export function localized(text: LocalizedText | null | undefined, locale: string): string {
  if (!text) return "";
  return (locale === "ar" ? text.ar || text.en : text.en || text.ar) ?? "";
}

export function formatPrice(value: number | string | null | undefined, locale: string): string {
  if (value === null || value === undefined || value === "") return "";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: siteConfig.currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function brandName(locale: string) {
  return siteConfig.name[locale as Locale] ?? siteConfig.name.en;
}
