"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Banknote, CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { useCart } from "@/features/cart/cart-store";
import { FreeShippingMeter, QuoteError } from "@/features/cart/CartView";
import { quoteKey, useQuote } from "@/features/cart/use-quote";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { GOVERNORATES, type Governorate, type OrderView, type PaymentMethod, type SessionUser } from "@/lib/api/types";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { newIdempotencyKey } from "@/lib/idempotency";
import { cn, formatPrice, localized } from "@/lib/utils";

// Mirrors the backend ShippingAddress validation so most mistakes are caught before the round trip.
const schema = z.object({
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^01[0125][0-9]{8}$/),
  governorate: z.enum(GOVERNORATES),
  city: z.string().trim().min(2).max(80),
  street: z.string().trim().min(3).max(200),
  building: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function CheckoutForm({ user, paymentMethods }: { user: SessionUser; paymentMethods: PaymentMethod[] }) {
  const t = useTranslations("checkout");
  const te = useTranslations("errors");
  const tg = useTranslations("governorates");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const { lines, clear } = useCart();
  // One key per checkout visit: double clicks and retries resolve to the same order on the server.
  const [idempotencyKey] = useState(newIdempotencyKey);
  // Set once the order exists, so emptying the bag does not bounce the shopper back to /cart.
  const [placed, setPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(paymentMethods[0] ?? "CASH_ON_DELIVERY");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { recipientName: user.fullName, phone: user.phone ?? "", city: "", street: "", building: "", notes: "" },
  });
  const governorate = useWatch({ control: form.control, name: "governorate" }) as Governorate | undefined;
  const quote = useQuote(lines, governorate ?? null, hydrated);

  useEffect(() => {
    if (hydrated && lines.length === 0 && !placed) router.replace("/cart");
  }, [hydrated, lines.length, placed, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const order = await apiClient.post<OrderView>("/orders", {
        idempotencyKey,
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        address: {
          recipientName: values.recipientName,
          phone: values.phone,
          governorate: values.governorate,
          city: values.city,
          street: values.street,
          building: values.building || null,
        },
        paymentMethod,
        notes: values.notes || null,
      });
      setPlaced(true);
      clear();
      if (order.paymentUrl) {
        // Hosted checkout of the payment gateway; it returns the shopper to the order page afterwards.
        window.location.assign(order.paymentUrl);
        return;
      }
      router.replace(`/account/orders/${order.orderNumber}?placed=1`);
    } catch (e) {
      if (e instanceof ApiError) {
        e.fieldPaths().forEach(([path, message]) =>
          form.setError(path.replace(/^address\./, "") as keyof FormValues, { message }),
        );
        if (e.code === "CART_CHANGED") await queryClient.invalidateQueries({ queryKey: quoteKey });
        toast.error(te.has(e.code) ? te(e.code) : te("generic"));
      } else {
        toast.error(te("generic"));
      }
    }
  });

  if (!hydrated || lines.length === 0) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;

  const err = (name: keyof FormValues) => (form.formState.errors[name] ? form.formState.errors[name]?.message || te("required") : undefined);
  const data = quote.data;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 pb-24 lg:grid-cols-[1fr_24rem] lg:gap-10 lg:pb-0">
      <div className="space-y-8">
        <section className="space-y-5 rounded-3xl border border-border bg-surface p-4 sm:p-6">
          <h2 className="text-lg font-semibold">{t("shipping")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("recipientName")} htmlFor="recipientName" error={err("recipientName")}>
              <Input id="recipientName" autoComplete="name" aria-invalid={!!form.formState.errors.recipientName} {...form.register("recipientName")} />
            </Field>
            <Field label={t("phone")} htmlFor="phone" error={err("phone")} hint={t("phoneHint")}>
              <Input id="phone" type="tel" dir="ltr" inputMode="numeric" autoComplete="tel" aria-invalid={!!form.formState.errors.phone} {...form.register("phone")} />
            </Field>
            <Field label={t("governorate")} htmlFor="governorate" error={err("governorate")}>
              <Select id="governorate" defaultValue="" aria-invalid={!!form.formState.errors.governorate} {...form.register("governorate")}>
                <option value="" disabled>{t("chooseGovernorate")}</option>
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>{tg(g)}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("city")} htmlFor="city" error={err("city")}>
              <Input id="city" autoComplete="address-level2" aria-invalid={!!form.formState.errors.city} {...form.register("city")} />
            </Field>
            <Field label={t("street")} htmlFor="street" error={err("street")} className="sm:col-span-2">
              <Input id="street" autoComplete="street-address" aria-invalid={!!form.formState.errors.street} {...form.register("street")} />
            </Field>
            <Field label={t("building")} htmlFor="building" error={err("building")} className="sm:col-span-2">
              <Input id="building" {...form.register("building")} />
            </Field>
            <Field label={t("notes")} htmlFor="notes" error={err("notes")} className="sm:col-span-2">
              <Textarea id="notes" rows={3} {...form.register("notes")} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-surface p-4 sm:p-6">
          <h2 className="text-lg font-semibold">{t("payment")}</h2>
          {paymentMethods.map((method) => {
            const Icon = method === "CARD" ? CreditCard : Banknote;
            const active = paymentMethod === method;
            return (
              <label
                key={method}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition",
                  active ? "border-primary bg-accent-soft/40" : "border-border hover:border-accent",
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={active}
                  onChange={() => setPaymentMethod(method)}
                  className="size-4 accent-[var(--primary)]"
                />
                <Icon className="size-6 text-primary" />
                <span>
                  <span className="block font-medium">{method === "CARD" ? t("card") : t("cod")}</span>
                  <span className="text-sm text-muted">{method === "CARD" ? t("cardDesc") : t("codDesc")}</span>
                </span>
              </label>
            );
          })}
        </section>
      </div>

      <aside className="h-fit space-y-5 rounded-3xl border border-border bg-surface p-4 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">{t("summary")}</h2>
        <ul className={cn("space-y-3", quote.isFetching && "opacity-60 transition-opacity")}>
          {(data?.lines ?? []).map((l) => (
            <li key={l.variantId} className="flex gap-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {l.imageUrl && <Image src={l.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{localized(l.productName, locale)}</p>
                <p className="text-muted">{localized(l.colorName, locale)} · {l.sizeCode}</p>
                {l.issue && <p className="text-danger">{te("CART_CHANGED")}</p>}
              </div>
              <span className="text-sm font-medium tabular-nums">{formatPrice(l.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("subtotal")}</dt>
            <dd className="tabular-nums">{data ? formatPrice(data.subtotal, locale) : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("shippingFee")}</dt>
            <dd className="tabular-nums">
              {data?.shippingFee == null ? <span className="text-xs text-muted">{t("chooseGovToCalc")}</span>
                : Number(data.shippingFee) === 0 ? <span className="font-semibold text-success">{t("free")}</span>
                : formatPrice(data.shippingFee, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>{t("total")}</dt>
            <dd className="tabular-nums">{data ? formatPrice(data.total, locale) : "—"}</dd>
          </div>
        </dl>

        {data?.freeShippingThreshold != null && <FreeShippingMeter subtotal={data.subtotal} threshold={data.freeShippingThreshold} />}

        {quote.isError && <QuoteError onRetry={() => quote.refetch()} retrying={quote.isFetching} />}
        {data && !data.orderable && (
          <p className="flex items-start gap-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {t("cartChanged")}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting} disabled={!data?.orderable}>
          {t("placeOrder")}
        </Button>
        <Link href="/cart" className={buttonClass("ghost", "md", "w-full")}>{t("backToCart")}</Link>
      </aside>

      {/* Phones: total and the place-order button stay within thumb reach while filling the form. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">{t("total")}</p>
            <p className="truncate font-semibold tabular-nums">{data ? formatPrice(data.total, locale) : "—"}</p>
          </div>
          <Button type="submit" className="shrink-0" loading={form.formState.isSubmitting} disabled={!data?.orderable}>
            {t("placeOrder")}
          </Button>
        </div>
      </div>
    </form>
  );
}
