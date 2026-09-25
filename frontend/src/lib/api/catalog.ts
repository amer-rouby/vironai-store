import "server-only";

import { backendFetch } from "./server";
import type { FiltersView, Page, ProductCard, ProductDetail, ProductSort } from "./types";

const REVALIDATE_SECONDS = 30;

export interface ProductSearchParams {
  category?: string;
  q?: string;
  colors?: string[];
  sizes?: string[];
  minPrice?: string;
  maxPrice?: string;
  featured?: boolean;
  sort?: ProductSort;
  page?: number;
  size?: number;
}

export function getFilters() {
  return backendFetch<FiltersView>("/api/v1/catalog/filters", { revalidate: REVALIDATE_SECONDS });
}

export function searchProducts(params: ProductSearchParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === null) return;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else qs.set(key, String(value));
  });
  return backendFetch<Page<ProductCard>>(`/api/v1/catalog/products?${qs}`, { revalidate: REVALIDATE_SECONDS });
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await backendFetch<ProductDetail>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`, {
      revalidate: REVALIDATE_SECONDS,
    });
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}
