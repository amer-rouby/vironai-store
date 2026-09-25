import Image from "next/image";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { backendFetch } from "@/lib/api/server";
import type { OrderSummary, Page } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("title"), robots: { index: false } };
}

export default async function MyOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = Math.max(0, Number((await searchParams).page ?? 0) || 0);
  const [t, ts, result] = await Promise.all([
    getTranslations("orders"),
    getTranslations("shop"),
    backendFetch<Page<OrderSummary>>(`/api/v1/orders?page=${page}&size=10`, { auth: true }),
  ]);
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" });

  return (
    <>
      <h1 className="heading-display mb-6 text-3xl text-primary sm:mb-8 sm:text-4xl">{t("title")}</h1>
      {result.content.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-14 text-center">
          <Package className="mx-auto mb-4 size-10 text-muted" />
          <p className="mb-6 text-muted">{t("empty")}</p>
          <Link href="/shop" className={buttonClass("primary")}>{t("startShopping")}</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {result.content.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.orderNumber}`} className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-4 transition hover:shadow-card">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {o.previewImageUrl && <Image src={o.previewImageUrl} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold" dir="ltr">{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="text-sm text-muted">{dateFormat.format(new Date(o.placedAt))} · {t("items", { count: o.itemCount })}</p>
                </div>
                <span className="font-semibold tabular-nums">{formatPrice(o.total, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {result.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 0 && <Link href={`/account/orders?page=${page - 1}`} className={buttonClass("outline", "sm")}>{ts("prev")}</Link>}
          <span className="text-muted">{ts("page", { page: page + 1, total: result.totalPages })}</span>
          {page + 1 < result.totalPages && <Link href={`/account/orders?page=${page + 1}`} className={buttonClass("outline", "sm")}>{ts("next")}</Link>}
        </nav>
      )}
    </>
  );
}
