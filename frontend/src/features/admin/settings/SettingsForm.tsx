"use client";

import { CheckCircle2, CircleAlert, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/form-controls";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export interface StoreSettings {
  cashOnDeliveryEnabled: boolean;
  cardPaymentsEnabled: boolean;
  orderNotificationEmail: string | null;
  cardGatewayConfigured: boolean;
}

/** Owner switches. Card payments can only be turned on once the server has a configured gateway. */
export function SettingsForm({ initial }: { initial: StoreSettings }) {
  const t = useTranslations("admin.settings");
  const ta = useTranslations("admin");
  const te = useTranslations("errors");
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const card = "space-y-4 rounded-3xl border border-border bg-surface p-4 sm:p-6";

  const save = async () => {
    setSaving(true);
    try {
      const saved = await apiClient.put<StoreSettings>("/admin/settings", {
        cashOnDeliveryEnabled: state.cashOnDeliveryEnabled,
        cardPaymentsEnabled: state.cardPaymentsEnabled,
        orderNotificationEmail: state.orderNotificationEmail || null,
      });
      setState(saved);
      toast.success(t("saved"));
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "generic";
      toast.error(te.has(code) ? te(code) : te("generic"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-primary">
          <Settings className="size-5" />
        </span>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      <section className={card}>
        <h2 className="font-semibold">{t("payments")}</h2>
        <Switch
          id="cod"
          checked={state.cashOnDeliveryEnabled}
          onChange={(v) => setState((s) => ({ ...s, cashOnDeliveryEnabled: v }))}
          label={t("cod")}
        />
        <div className="space-y-2">
          <Switch
            id="card"
            checked={state.cardPaymentsEnabled}
            onChange={(v) => setState((s) => ({ ...s, cardPaymentsEnabled: v }))}
            label={t("card")}
          />
          <p className={`flex items-start gap-2 text-sm ${state.cardGatewayConfigured ? "text-success" : "text-muted"}`}>
            {state.cardGatewayConfigured ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" />}
            {state.cardGatewayConfigured ? t("gatewayReady") : t("gatewayMissing")}
          </p>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">{t("notifications")}</h2>
        <Field label={t("notificationEmail")} hint={t("notificationHint")} htmlFor="notify">
          <Input
            id="notify"
            type="email"
            dir="ltr"
            value={state.orderNotificationEmail ?? ""}
            onChange={(e) => setState((s) => ({ ...s, orderNotificationEmail: e.target.value }))}
          />
        </Field>
      </section>

      <Button onClick={save} loading={saving} className="w-full sm:w-auto">{ta("save")}</Button>
    </div>
  );
}
