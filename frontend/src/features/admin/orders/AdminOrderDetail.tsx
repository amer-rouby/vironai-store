"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Mail, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form-controls";
import { OrderDetails } from "@/features/orders/OrderDetails";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { OrderStatus, OrderView } from "@/lib/api/types";

/** Back-office view of one order: full details plus the status transitions the backend allows next. */
export function AdminOrderDetail({ row, onClose }: { row: { id: number; orderNumber: string }; onClose: () => void }) {
  const t = useTranslations("admin");
  const ts = useTranslations("orderStatus");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const order = useQuery({
    queryKey: ["admin", "orders", "detail", row.id],
    queryFn: () => apiClient.get<OrderView>(`/admin/orders/${row.id}`),
  });

  const change = useMutation({
    mutationFn: (status: OrderStatus) => apiClient.post<OrderView>(`/admin/orders/${row.id}/status`, { status, note: note || null }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "orders", "detail", row.id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setNote("");
      toast.success(t("statusChanged"));
    },
    onError: (e) => {
      const code = e instanceof ApiError ? e.code : "generic";
      toast.error(te.has(code) ? te(code) : te("generic"));
    },
  });

  const data = order.data;

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-3">
          <span dir="ltr">{row.orderNumber}</span>
          {data && <OrderStatusBadge status={data.status} />}
        </span>
      }
    >
      {!data ? (
        <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />
      ) : (
        <div className="space-y-6">
          {data.customer && (
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5"><User className="size-4" /> {data.customer.fullName}</span>
              <span className="flex items-center gap-1.5" dir="ltr"><Mail className="size-4" /> {data.customer.email}</span>
            </div>
          )}

          <section className="space-y-3 rounded-3xl border border-border bg-surface-2/50 p-5">
            <h3 className="flex items-center gap-2 font-semibold"><ArrowLeftRight className="size-4" /> {t("moveTo")}</h3>
            {data.nextStatuses.length === 0 ? (
              <p className="text-sm text-muted">{t("finalStatus")}</p>
            ) : (
              <>
                <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t("statusNote")} />
                <div className="flex flex-wrap gap-2">
                  {data.nextStatuses.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === "CANCELLED" ? "danger" : "primary"}
                      loading={change.isPending && change.variables === s}
                      disabled={change.isPending}
                      onClick={() => change.mutate(s)}
                    >
                      {ts(s)}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </section>

          <OrderDetails order={data} productLinks={false} />
        </div>
      )}
    </Dialog>
  );
}
