import type { LocalizedText } from "@/lib/api/types";

export interface PeriodTotals {
  revenue: number;
  orders: number;
  itemsSold: number;
  averageOrderValue: number;
  newCustomers: number;
}

export interface DailyPoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface Dashboard {
  days: number;
  current: PeriodTotals;
  previous: PeriodTotals;
  daily: DailyPoint[];
  ordersByStatus: Record<string, number>;
  topProducts: { slug: string; name: LocalizedText; imageUrl: string | null; quantity: number; revenue: number }[];
  lowStock: {
    productId: number;
    slug: string;
    productName: LocalizedText;
    colorName: LocalizedText;
    colorHex: string;
    sizeCode: string;
    sku: string;
    stock: number;
  }[];
  lowStockThreshold: number;
}
