import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { KpiTile } from "@/features/admin/dashboard/KpiTile";
import { RevenueChart } from "@/features/admin/dashboard/RevenueChart";
import type { Dashboard } from "@/features/admin/dashboard/types";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { backendFetch } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";
import { ORDER_STATUSES } from "@/lib/api/types";
import { cn, formatPrice, localized } from "@/lib/utils";

const PERIODS = [7, 30, 90] as const;

export default async function AdminHome({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const requested = Number((await searchParams).days);
  const days = PERIODS.find((p) => p === requested) ?? 30;

  const [t, td, user, data] = await Promise.all([
    getTranslations("admin"),
    getTranslations("dashboard"),
    getSession(),
    backendFetch<Dashboard>(`/api/v1/admin/dashboard?days=${days}`, { auth: true }),
  ]);
  const number = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");
  const { current, previous } = data;
  const card = "rounded-3xl border border-border bg-surface p-4 sm:p-6";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading-display text-3xl text-primary sm:text-4xl">{t("welcome", { name: user?.fullName ?? "" })}</h1>
          <p className="mt-1 text-sm text-muted">{td("subtitle", { days })}</p>
        </div>
        <nav className="flex rounded-full border border-border bg-surface p-1" aria-label={td("period")}>
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?days=${p}`}
              aria-current={p === days ? "page" : undefined}
              className={cn(
                "grid h-9 min-w-14 place-items-center rounded-full px-3 text-sm font-medium transition",
                p === days ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
              )}
            >
              {td("daysShort", { days: p })}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiTile hero label={td("revenue")} value={formatPrice(current.revenue, locale)} current={Number(current.revenue)} previous={Number(previous.revenue)} />
        <KpiTile label={td("orders")} value={number.format(current.orders)} current={current.orders} previous={previous.orders} />
        <KpiTile label={td("aov")} value={formatPrice(current.averageOrderValue, locale)} current={Number(current.averageOrderValue)} previous={Number(previous.averageOrderValue)} />
        <KpiTile label={td("newCustomers")} value={number.format(current.newCustomers)} current={current.newCustomers} previous={previous.newCustomers} />
      </div>

      <section className={card}>
        <h2 className="mb-2 font-semibold">{td("dailyRevenue")}</h2>
        <RevenueChart data={data.daily} />
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <section className={card}>
          <h2 className="mb-3 font-semibold">{td("ordersByStatus")}</h2>
          <ul className="divide-y divide-border">
            {ORDER_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between py-2.5">
                <OrderStatusBadge status={s} />
                <span className={cn("font-semibold tabular-nums", s === "PENDING" && data.ordersByStatus[s] > 0 && "text-primary")}>
                  {number.format(data.ordersByStatus[s] ?? 0)}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/admin/orders" className="mt-3 inline-block py-2 text-sm font-medium text-primary hover:underline">{td("manageOrders")}</Link>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">{td("topProducts")}</h2>
          {data.topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{td("noSales")}</p>
          ) : (
            <ol className="space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3">
                  <span className="w-4 text-sm text-muted tabular-nums">{i + 1}</span>
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{localized(p.name, locale)}</p>
                    <p className="text-xs text-muted">{td("unitsSold", { count: p.quantity })}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{formatPrice(p.revenue, locale)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-danger" /> {td("lowStock", { count: data.lowStockThreshold })}
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{td("stockHealthy")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.lowStock.map((v) => (
                <li key={v.sku} className="flex items-center gap-3 py-2.5">
                  <span className="size-3 shrink-0 rounded-full border border-border" style={{ backgroundColor: v.colorHex }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{localized(v.productName, locale)}</p>
                    <p className="text-xs text-muted">{localized(v.colorName, locale)} · {v.sizeCode}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", v.stock === 0 ? "bg-danger/10 text-danger" : "bg-accent-soft text-primary")}>
                    {v.stock === 0 ? td("soldOut") : v.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/products" className="mt-3 inline-block py-2 text-sm font-medium text-primary hover:underline">{td("manageProducts")}</Link>
        </section>
      </div>
    </div>
  );
}
