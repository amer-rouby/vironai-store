"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import type { DailyPoint } from "./types";

const HEIGHT = 220;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;
const AXIS_WIDTH = 56;

/** Round a max up to a clean tick step (1/2/5 × 10^n) so the y-axis reads 0 / 1,000 / 2,000 ... */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { top: 1000, step: 250 };
  const raw = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!;
  return { top: step * ticks, step };
}

/**
 * Daily revenue as columns: one series in the theme's chart colour, 4px rounded tops on a shared
 * baseline, recessive hairline grid, hover/tap tooltip per day, and a table view for exact values.
 */
export function RevenueChart({ data }: { data: DailyPoint[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { top, step } = niceScale(Math.max(...data.map((d) => Number(d.revenue)), 0));
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + plotHeight - (v / top) * plotHeight;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const dayFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" });
  const compact = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { notation: "compact", maximumFractionDigits: 1 });
  // Label roughly six days along the axis whatever the period length.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const current = active === null ? null : data[active];

  return (
    <div className="space-y-3">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {current ? (
            <>
              <span className="font-medium text-fg">{dayFormat.format(new Date(current.day))}</span> ·{" "}
              {formatPrice(current.revenue, locale)} · {t("ordersCount", { count: current.orders })}
            </>
          ) : (
            t("hoverHint")
          )}
        </p>
        <button type="button" onClick={() => setShowTable((v) => !v)} className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg">
          {showTable ? t("showChart") : t("showTable")}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-72 overflow-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{t("day")}</th>
                <th className="px-3 py-2 text-end font-medium">{t("revenue")}</th>
                <th className="px-3 py-2 text-end font-medium">{t("orders")}</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.day} className="border-t border-border">
                  <td className="px-3 py-2">{dayFormat.format(new Date(d.day))}</td>
                  <td className="px-3 py-2 text-end tabular-nums">{formatPrice(d.revenue, locale)}</td>
                  <td className="px-3 py-2 text-end tabular-nums">{d.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex" dir="ltr">
          {/* Y axis */}
          <svg width={AXIS_WIDTH} height={HEIGHT} className="shrink-0 overflow-visible" aria-hidden>
            {ticks.map((v) => (
              <text key={v} x={AXIS_WIDTH - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[11px]">
                {compact.format(v)}
              </text>
            ))}
          </svg>

          {/* Plot: an HTML flex row of columns so each day is a real, focusable hit target at any width. */}
          <div className="relative min-w-0 flex-1" style={{ height: HEIGHT }} onMouseLeave={() => setActive(null)}>
            {ticks.map((v) => (
              <div key={v} className="pointer-events-none absolute inset-x-0 border-t border-border" style={{ top: y(v) }} />
            ))}
            <div className="absolute inset-x-0 flex items-end" style={{ top: PAD_TOP, height: plotHeight }}>
              {data.map((d, i) => {
                const value = Number(d.revenue);
                const barHeight = value > 0 ? Math.max(2, (value / top) * plotHeight) : 0;
                return (
                  <button
                    key={d.day}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-label={`${dayFormat.format(new Date(d.day))}: ${formatPrice(d.revenue, locale)}`}
                    className="group flex h-full min-w-0 flex-1 items-end justify-center px-px outline-none"
                  >
                    <span
                      className={cn(
                        "block w-full max-w-6 rounded-t-[4px] bg-chart transition-opacity",
                        active !== null && active !== i && "opacity-40",
                        "group-focus-visible:ring-2 group-focus-visible:ring-accent",
                      )}
                      style={{ height: barHeight }}
                    />
                  </button>
                );
              })}
            </div>
            {/* X labels */}
            <div className="absolute inset-x-0 bottom-0 flex" style={{ height: PAD_BOTTOM }}>
              {data.map((d, i) => (
                <span key={d.day} className="flex min-w-0 flex-1 items-end justify-center overflow-visible whitespace-nowrap text-[11px] text-muted">
                  {i % labelEvery === 0 || i === data.length - 1 ? dayFormat.format(new Date(d.day)) : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
