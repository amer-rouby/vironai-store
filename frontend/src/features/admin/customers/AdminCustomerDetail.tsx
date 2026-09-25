"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { OrderSummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils";

export interface CustomerRow {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  enabled: boolean;
  joinedAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

interface CustomerDetail {
  customer: CustomerRow;
  recentOrders: OrderSummary[];
}

/** Customer profile with purchase history and the enable/disable switch (admins are protected server-side). */
export function AdminCustomerDetail({ row, onClose }: { row: CustomerRow; onClose: () => void }) {
  const t = useTranslations("admin");
  const te = useTranslations("errors");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const key = ["admin", "customers", "detail", row.id];
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" });

  const detail = useQuery({ queryKey: key, queryFn: () => apiClient.get<CustomerDetail>(`/admin/customers/${row.id}`) });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => apiClient.post<CustomerDetail>(`/admin/customers/${row.id}/enabled`, { enabled }),
    onSuccess: (updated) => {
      queryClient.setQueryData(key, updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      toast.success(t("accountUpdated"));
    },
    onError: (e) => {
      const code = e instanceof ApiError ? e.code : "generic";
      toast.error(te.has(code) ? te(code) : te("generic"));
    },
  });

  const c = detail.data?.customer ?? row;

  return (
    <Dialog open onClose={onClose} size="lg" title={c.fullName}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <span className="flex items-center gap-1.5" dir="ltr"><Mail className="size-4" /> {c.email}</span>
          {c.phone && <span className="flex items-center gap-1.5" dir="ltr"><Phone className="size-4" /> {c.phone}</span>}
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [t("fields.orderCount"), String(c.orderCount)],
            [t("fields.totalSpent"), formatPrice(c.totalSpent, locale)],
            [t("fields.joinedAt"), date.format(new Date(c.joinedAt))],
            [t("fields.role"), t(`role${c.role}`)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface-2 p-3">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {c.role === "CUSTOMER" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
            <span className="text-sm">
              {t("fields.enabled")}:{" "}
              <span className={c.enabled ? "font-semibold text-success" : "font-semibold text-danger"}>{c.enabled ? t("active") : t("disabled")}</span>
            </span>
            <Button
              size="sm"
              variant={c.enabled ? "danger" : "primary"}
              loading={toggle.isPending}
              onClick={() => toggle.mutate(!c.enabled)}
            >
              {c.enabled ? t("disableAccount") : t("enableAccount")}
            </Button>
          </div>
        )}

        <section>
          <h3 className="mb-2 font-semibold">{t("recentOrders")}</h3>
          {!detail.data ? (
            <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          ) : detail.data.recentOrders.length === 0 ? (
            <p className="py-4 text-sm text-muted">{t("noOrders")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {detail.data.recentOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                  <span className="font-semibold" dir="ltr">{o.orderNumber}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="text-muted">{date.format(new Date(o.placedAt))}</span>
                  <span className="ms-auto font-medium tabular-nums">{formatPrice(o.total, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Dialog>
  );
}
