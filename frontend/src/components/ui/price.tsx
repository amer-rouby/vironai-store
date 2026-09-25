import { useLocale } from "next-intl";
import { cn, formatPrice } from "@/lib/utils";

export function Price({
  value,
  compareAt,
  className,
}: {
  value: number;
  compareAt?: number | null;
  className?: string;
}) {
  const locale = useLocale();
  const onSale = compareAt != null && compareAt > value;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold", onSale && "text-danger")}>{formatPrice(value, locale)}</span>
      {onSale && <span className="text-sm text-muted line-through">{formatPrice(compareAt, locale)}</span>}
    </span>
  );
}
