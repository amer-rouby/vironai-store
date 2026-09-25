import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const tone: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-surface-2 text-muted",
  PENDING: "bg-accent-soft text-primary",
  CONFIRMED: "bg-info/15 text-info",
  SHIPPED: "bg-transit/15 text-transit",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/10 text-danger",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const t = useTranslations("orderStatus");
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", tone[status], className)}>
      {t(status)}
    </span>
  );
}
