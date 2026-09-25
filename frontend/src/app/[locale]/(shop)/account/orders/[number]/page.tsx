import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AwaitingPayment } from "@/features/orders/AwaitingPayment";
import { CancelOrderButton } from "@/features/orders/CancelOrderButton";
import { OrderDetails } from "@/features/orders/OrderDetails";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { ApiError } from "@/lib/api/errors";
import { backendFetch } from "@/lib/api/server";
import type { OrderView } from "@/lib/api/types";

type Params = Promise<{ locale: string; number: string }>;

async function loadOrder(number: string) {
  try {
    return await backendFetch<OrderView>(`/api/v1/orders/${encodeURIComponent(number)}`, { auth: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { number } = await params;
  return { title: number, robots: { index: false } };
}

export default async function OrderPage({ params, searchParams }: { params: Params; searchParams: Promise<{ placed?: string; payment?: string }> }) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  const [order, t, sp] = await Promise.all([loadOrder(number), getTranslations("orders"), searchParams]);
  if (!order) notFound();
  const dateTime = new Intl.DateTimeFormat((await getLocale()) === "ar" ? "ar-EG" : "en-GB", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {order.status === "PENDING_PAYMENT" && (
        <AwaitingPayment orderNumber={order.orderNumber} expiresAt={order.paymentExpiresAt} returning={!!sp.payment} />
      )}

      {sp.placed && (
        <div className="flex items-start gap-4 rounded-3xl border border-success/30 bg-success/10 p-6">
          <CheckCircle2 className="size-8 shrink-0 text-success" />
          <div>
            <h2 className="heading-display text-2xl text-fg">{t("placedTitle")}</h2>
            <p className="text-muted">{t("placedDesc")}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm text-muted hover:text-fg">← {t("title")}</Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-semibold">
            <span dir="ltr">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </h1>
          <p className="text-sm text-muted">{t("placedAt")}: {dateTime.format(new Date(order.placedAt))}</p>
        </div>
        {order.cancellable && <CancelOrderButton orderNumber={order.orderNumber} />}
      </div>

      <OrderDetails order={order} />
    </div>
  );
}
