import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Stat tile: label, value and a signed change vs the previous period of the same length.
 * Direction is shown by icon + sign + colour together, never colour alone.
 */
export function KpiTile({
  label,
  value,
  current,
  previous,
  hero = false,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  hero?: boolean;
}) {
  const t = useTranslations("dashboard");
  const change = previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;
  const up = change !== null && change > 0.5;
  const down = change !== null && change < -0.5;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;

  return (
    <div className={cn("rounded-3xl border border-border bg-surface p-4 sm:p-5", hero && "border-primary/30")}>
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-1 font-semibold tabular-nums", hero ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl")}>{value}</p>
      <p className={cn("mt-2 flex flex-wrap items-center gap-1 text-xs", up ? "text-success" : down ? "text-danger" : "text-muted")}>
        <Icon className="size-3.5 shrink-0" />
        <span className="tabular-nums" dir="ltr">
          {change === null ? t("new") : `${change > 0 ? "+" : ""}${change.toFixed(0)}%`}
        </span>
        <span className="text-muted">{t("vsPrevious")}</span>
      </p>
    </div>
  );
}
