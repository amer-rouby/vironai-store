"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations("orders");
  const te = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    try {
      await apiClient.post(`/orders/${encodeURIComponent(orderNumber)}/cancel`);
      toast.success(t("cancelled"));
      setOpen(false);
      router.refresh();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "generic";
      toast.error(te.has(code) ? te(code) : te("generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="text-danger" onClick={() => setOpen(true)}>{t("cancel")}</Button>
      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={t("cancel")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{t("keep")}</Button>
            <Button variant="danger" onClick={cancel} loading={busy}>{t("cancel")}</Button>
          </>
        }
      >
        <p className="text-muted">{t("confirmCancel")}</p>
      </Dialog>
    </>
  );
}
