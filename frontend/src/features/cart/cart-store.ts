"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LocalizedText } from "@/lib/api/types";

export interface CartLine {
  variantId: number;
  productSlug: string;
  name: LocalizedText;
  imageUrl: string | null;
  colorName: LocalizedText;
  colorHex: string;
  sizeCode: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
}

/**
 * Guest cart kept in the browser. Prices here are display-only: the server re-prices every line at
 * checkout, so tampering with storage cannot change what is charged.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (!existing) return { lines: [...state.lines, { ...line, quantity: Math.min(line.quantity, line.maxStock) }] };
          return {
            lines: state.lines.map((l) =>
              l.variantId === line.variantId
                ? { ...l, ...line, quantity: Math.min(l.quantity + line.quantity, line.maxStock) }
                : l,
            ),
          };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxStock)) } : l,
          ),
        })),
      remove: (variantId) => set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "vr-cart", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
