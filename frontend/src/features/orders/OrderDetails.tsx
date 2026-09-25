import Image from "next/image";
import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { OrderStatus, OrderView } from "@/lib/api/types";
import { cn, formatPrice, localized } from "@/lib/utils";
import { OrderStatusBadge } from "./OrderStatusBadge";

const HAPPY_PATH: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

/** Shared by the customer order page and the admin order dialog. */
export function OrderDetails({ order, productLinks = true }: { order: OrderView; productLinks?: boolean }) {
  const t = useTranslations("orders");
  const tc = useTranslations("checkout");
  const tg = useTranslations("governorates");
  const locale = useLocale();
  const dateTime = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <OrderTimeline order={order} />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-2 rounded-3xl border border-border bg-surface p-5 text-sm">
          <h3 className="font-semibold">{t("deliverTo")}</h3>
          <p>{order.address.recipientName}</p>
          <p dir="ltr" className="text-start text-muted">{order.address.phone}</p>
          <p className="text-muted">
            {[order.address.street, order.address.building, order.address.city, tg(order.address.governorate)].filter(Boolean).join(locale === "ar" ? "، " : ", ")}
          </p>
          {order.notes && <p className="rounded-xl bg-surface-2 p-2.5 text-muted">{t("notes")}: {order.notes}</p>}
        </section>
        <section className="space-y-2 rounded-3xl border border-border bg-surface p-5 text-sm">
          <h3 className="font-semibold">{t("payment")}</h3>
          <p>{tc("cod")}</p>
          <dl className="space-y-1.5 pt-2">
            <Row label={tc("subtotal")} value={formatPrice(order.subtotal, locale)} />
            <Row label={tc("shippingFee")} value={Number(order.shippingFee) === 0 ? tc("free") : formatPrice(order.shippingFee, locale)} />
            <Row label={tc("total")} value={formatPrice(order.total, locale)} strong />
          </dl>
        </section>
      </div>

      <ul className="divide-y divide-border rounded-3xl border border-border bg-surface">
        {order.items.map((item) => {
          const name = localized(item.productName, locale);
          return (
            <li key={item.sku} className="flex gap-4 p-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                {productLinks ? <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline">{name}</Link> : <p className="font-medium">{name}</p>}
                <p className="flex items-center gap-2 text-muted">
                  <span className="size-3 rounded-full border border-border" style={{ backgroundColor: item.colorHex }} />
                  {localized(item.colorName, locale)} · {item.sizeCode}
                </p>
                <p className="text-muted">{t("qty")}: {item.quantity} × {formatPrice(item.unitPrice, locale)}</p>
                {!productLinks && <p className="text-xs text-muted" dir="ltr">{item.sku}</p>}
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatPrice(item.lineTotal, locale)}</span>
            </li>
          );
        })}
      </ul>

      <section className="rounded-3xl border border-border bg-surface p-5 text-sm">
        <h3 className="mb-3 font-semibold">{t("timeline")}</h3>
        <ol className="space-y-3">
          {order.history.map((h, i) => (
            <li key={i} className="flex gap-3">
              <OrderStatusBadge status={h.status} className="shrink-0" />
              <span className="text-muted">{dateTime.format(new Date(h.changedAt))}</span>
              {h.note && <span className="text-fg">— {h.note}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "border-t border-border pt-2 text-base font-semibold")}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** Progress stepper along the normal lifecycle; a cancelled order shows where it stopped. */
function OrderTimeline({ order }: { order: OrderView }) {
  const ts = useTranslations("orderStatus");
  const cancelled = order.status === "CANCELLED";
  const reached = new Set(order.history.map((h) => h.status));
  const currentIndex = cancelled
    ? Math.max(...HAPPY_PATH.map((s, i) => (reached.has(s) ? i : -1)))
    : HAPPY_PATH.indexOf(order.status);

  return (
    <ol className="grid grid-cols-4 gap-2 rounded-3xl border border-border bg-surface p-5">
      {HAPPY_PATH.map((step, i) => {
        const done = i <= currentIndex;
        const stoppedHere = cancelled && i === currentIndex;
        return (
          <li key={step} className="flex flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "invisible" : done ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full border-2 transition",
                  stoppedHere ? "border-danger bg-danger text-white" : done ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-muted",
                )}
              >
                {stoppedHere ? <X className="size-4" /> : done ? <Check className="size-4" /> : <span className="text-xs">{i + 1}</span>}
              </span>
              <span className={cn("h-0.5 flex-1", i === HAPPY_PATH.length - 1 ? "invisible" : i < currentIndex ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-xs sm:text-sm", done ? "font-medium text-fg" : "text-muted")}>
              {stoppedHere ? ts("CANCELLED") : ts(step)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
