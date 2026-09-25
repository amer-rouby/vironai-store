import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";
import { ProductGrid } from "@/features/catalog/ProductCard";
import { ShopFilters, SortSelect } from "@/features/catalog/ShopFilters";
import { getFilters, searchProducts } from "@/lib/api/catalog";
import type { ProductSort } from "@/lib/api/types";
import { localized } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]);
const SORTS: ProductSort[] = ["NEWEST", "PRICE_ASC", "PRICE_DESC"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return { title: t("title") };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const page = Math.max(0, Number(one(sp.page) ?? 0) || 0);
  const sort = SORTS.find((s) => s === one(sp.sort));

  const [t, filters, result] = await Promise.all([
    getTranslations("shop"),
    getFilters(),
    searchProducts({
      category: one(sp.category),
      q: one(sp.q),
      colors: many(sp.colors),
      sizes: many(sp.sizes),
      minPrice: one(sp.minPrice),
      maxPrice: one(sp.maxPrice),
      sort,
      page,
      size: 12,
    }),
  ]);

  const activeCategory = filters.categories.find((c) => c.slug === one(sp.category));
  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => many(v)?.forEach((val) => next.append(k, val)));
    next.set("page", String(target));
    return `/shop?${next.toString()}`;
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
        <div>
          <h1 className="heading-display text-3xl text-primary sm:text-4xl">
            {activeCategory ? localized(activeCategory.name, locale) : one(sp.q) ? `“${one(sp.q)}”` : t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("results", { count: result.totalElements })}</p>
        </div>
        <SortSelect />
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-10">
        <ShopFilters filters={filters} />
        <div>
          {result.content.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-12 text-center text-muted">{t("empty")}</p>
          ) : (
            <ProductGrid products={result.content} />
          )}

          {result.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-3 text-sm">
              {page > 0 && <Link href={pageHref(page - 1)} className={buttonClass("outline", "sm")}>{t("prev")}</Link>}
              <span className="text-muted">{t("page", { page: page + 1, total: result.totalPages })}</span>
              {page + 1 < result.totalPages && <Link href={pageHref(page + 1)} className={buttonClass("outline", "sm")}>{t("next")}</Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
