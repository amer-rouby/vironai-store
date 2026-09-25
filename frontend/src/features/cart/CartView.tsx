"use client";

import Image from "next/image";
import { AlertCircle, Minus, Plus, RotateCw, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";
import type { QuoteLine } from "@/lib/api/types";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn, formatPrice, localized } from "@/lib/utils";
import { useCart, type CartLine } from "./cart-store";
import { useQuote } from "./use-quote";

export function CartView({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("cart");
  const tc = useTranslations("checkout");
  const locale = useLocale();
  const { lines, setQuantity, remove } = useCart();
  const hydrated = useHydrated();
  const quote = useQuote(lines, null, hydrated);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-surface-2" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-14 text-center">
        <p className="mb-6 text-muted">{t("empty")}</p>
        <Link href="/shop" className={buttonClass("primary")}>{t("continue")}</Link>
      </div>
    );
  }

  const byVariant = new Map(quote.data?.lines.map((l) => [l.variantId, l]));
  const subtotal = quote.data?.subtotal;
  const threshold = quote.data?.freeShippingThreshold;
  const checkoutHref = signedIn ? "/checkout" : `/login?next=${encodeURIComponent(`/${locale}/checkout`)}`;

  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-[1fr_22rem] lg:gap-10 lg:pb-0">
      <ul className="divide-y divide-border rounded-3xl border border-border bg-surface">
        {lines.map((line) => (
          <CartRow
            key={line.variantId}
            line={line}
            priced={byVariant.get(line.variantId)}
            onQuantity={(q) => setQuantity(line.variantId, q)}
            onRemove={() => remove(line.variantId)}
          />
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-3xl border border-border bg-surface p-4 sm:p-6 lg:sticky lg:top-24">
        <div className="flex items-center justify-between text-lg">
          <span>{t("subtotal")}</span>
          <span className={cn("font-semibold tabular-nums", quote.isFetching && "opacity-50")}>
            {subtotal !== undefined ? formatPrice(subtotal, locale) : "—"}
          </span>
        </div>
        {threshold != null && subtotal !== undefined && (
          <FreeShippingMeter subtotal={subtotal} threshold={threshold} />
        )}
        <p className="text-sm text-muted">{t("shippingNote")}</p>
        {quote.isError && <QuoteError onRetry={() => quote.refetch()} retrying={quote.isFetching} />}
        {quote.data && !quote.data.orderable && (
          <p className="flex items-start gap-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {tc("cartChanged")}
          </p>
        )}
        <Link
          href={checkoutHref}
          aria-disabled={!quote.data?.orderable}
          className={buttonClass("primary", "lg", cn("w-full", !quote.data?.orderable && "pointer-events-none opacity-50"))}
        >
          {signedIn ? t("checkout") : tc("loginToCheckout")}
        </Link>
        <Link href="/shop" className={buttonClass("ghost", "md", "w-full")}>{t("continue")}</Link>
      </aside>

      {/* Phones: subtotal and checkout stay within thumb reach while scrolling the bag. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">{t("subtotal")}</p>
            <p className="truncate font-semibold tabular-nums">{subtotal !== undefined ? formatPrice(subtotal, locale) : "—"}</p>
          </div>
          <Link
            href={checkoutHref}
            aria-disabled={!quote.data?.orderable}
            className={buttonClass("primary", "md", cn("shrink-0", !quote.data?.orderable && "pointer-events-none opacity-50"))}
          >
            {signedIn ? t("checkout") : tc("loginToCheckout")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function CartRow({
  line,
  priced,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  priced: QuoteLine | undefined;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("cart");
  const ti = useTranslations("cartIssues");
  const locale = useLocale();
  // Live values from the server win over what the browser remembered.
  const unitPrice = priced && priced.issue !== "UNAVAILABLE" ? priced.unitPrice : line.unitPrice;
  const maxQty = priced ? Math.min(priced.availableStock, 10) : line.maxStock;
  const issue = priced?.issue;

  return (
    <li className={cn("flex gap-3 p-3 sm:gap-4 sm:p-5", issue && "bg-danger/5")}>
      <Link href={`/products/${line.productSlug}`} className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-24">
        {line.imageUrl && <Image src={line.imageUrl} alt="" fill sizes="96px" className="object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        <Link href={`/products/${line.productSlug}`} className="font-medium hover:underline">{localized(line.name, locale)}</Link>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span className="size-3 rounded-full border border-border" style={{ backgroundColor: line.colorHex }} />
          {localized(line.colorName, locale)} · {line.sizeCode}
        </p>
        <p className="text-sm font-semibold tabular-nums">{formatPrice(unitPrice, locale)}</p>

        {issue && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-danger">
            <AlertCircle className="size-4" />
            {issue === "INSUFFICIENT_STOCK" ? ti("INSUFFICIENT_STOCK", { count: priced!.availableStock }) : ti(issue)}
            {issue === "INSUFFICIENT_STOCK" && (
              <button type="button" className="font-semibold underline underline-offset-2" onClick={() => onQuantity(priced!.availableStock)}>
                {ti("adjust", { count: priced!.availableStock })}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className={cn("flex h-10 items-center rounded-full border border-border", issue === "UNAVAILABLE" || issue === "OUT_OF_STOCK" ? "invisible" : "")}>
            <button type="button" className="grid size-10 place-items-center disabled:opacity-40" disabled={line.quantity <= 1} onClick={() => onQuantity(line.quantity - 1)} aria-label="-">
              <Minus className="size-3.5" />
            </button>
            <span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span>
            <button type="button" className="grid size-10 place-items-center disabled:opacity-40" disabled={line.quantity >= maxQty} onClick={() => onQuantity(line.quantity + 1)} aria-label="+">
              <Plus className="size-3.5" />
            </button>
          </div>
          <button type="button" onClick={onRemove} className="-me-2 flex items-center gap-1 rounded-full px-2 py-2.5 text-sm text-muted hover:text-danger">
            <Trash2 className="size-4" /> {t("remove")}
          </button>
        </div>
      </div>
    </li>
  );
}

/** Shown when the pricing call fails (backend down, network), so the disabled button is never a mystery. */
export function QuoteError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const t = useTranslations("checkout");
  return (
    <div className="space-y-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger">
      <p className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" /> {t("quoteFailed")}
      </p>
      <button type="button" onClick={onRetry} disabled={retrying} className="flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline disabled:opacity-50">
        <RotateCw className={cn("size-3.5", retrying && "animate-spin")} /> {t("retry")}
      </button>
    </div>
  );
}

export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="space-y-2">
      <p className="text-sm">
        {remaining === 0 ? t("freeShippingReached") : t("freeShippingHint", { amount: formatPrice(remaining, locale) })}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
