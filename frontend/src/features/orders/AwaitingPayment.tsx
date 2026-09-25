"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

/**
 * Card order not paid yet. Right after returning from the gateway the verdict arrives by server
 * callback, so the page re-checks for a short while instead of trusting the redirect.
 */
export function AwaitingPayment({ orderNumber, expiresAt, returning }: { orderNumber: string; expiresAt: string | null; returning: boolean }) {
  const t = useTranslations("orders");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [polls, setPolls] = useState(0);
  const polling = returning && polls < 10;

  useEffect(() => {
    if (!polling) return;
    const id = setTimeout(() => {
      setPolls((n) => n + 1);
      router.refresh();
    }, 3000);
    return () => clearTimeout(id);
  }, [polling, polls, router]);

  const pay = async () => {
    setBusy(true);
    try {
      const { paymentUrl } = await apiClient.post<{ paymentUrl: string }>(`/orders/${encodeURIComponent(orderNumber)}/pay`);
      window.location.assign(paymentUrl);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "generic";
      toast.error(te.has(code) ? te(code) : te("generic"));
      setBusy(false);
    }
  };

  const time = expiresAt
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { timeStyle: "short" }).format(new Date(expiresAt))
    : "";

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-accent bg-accent-soft/50 p-5 sm:flex-row sm:items-center">
      <CreditCard className="size-8 shrink-0 text-primary" />
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{t("awaitingPayment")}</p>
        {polling ? (
          <p className="flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> {t("confirmingPayment")}</p>
        ) : (
          time && <p className="text-sm text-muted">{t("payBefore", { time })}</p>
        )}
      </div>
      <Button onClick={pay} loading={busy} className="w-full sm:w-auto">{t("payNow")}</Button>
    </div>
  );
}
