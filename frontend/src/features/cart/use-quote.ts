"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Governorate, Quote } from "@/lib/api/types";
import type { CartLine } from "./cart-store";

export const quoteKey = ["checkout", "quote"] as const;

/**
 * Server-side pricing of the bag. The browser cart only remembers what was picked; prices, stock and
 * shipping always come from here, so the UI never shows a total the server would not charge.
 */
export function useQuote(lines: CartLine[], governorate?: Governorate | null, enabled = true) {
  const items = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
  return useQuery({
    queryKey: [...quoteKey, items, governorate ?? null],
    queryFn: () => apiClient.post<Quote>("/checkout/quote", { items, governorate: governorate ?? null }),
    enabled: enabled && items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
