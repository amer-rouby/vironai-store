"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form-controls";
import type { FiltersView } from "@/lib/api/types";
import { cn, localized } from "@/lib/utils";

/** URL is the single source of truth for filters: shareable links, back button and SSR all just work. */
function useQueryState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const toggleMulti = (key: string, value: string) =>
    update((p) => {
      const values = p.getAll(key);
      p.delete(key);
      (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]).forEach((v) => p.append(key, v));
    });

  return { params, update, toggleMulti, pending };
}

export function SortSelect() {
  const t = useTranslations("shop");
  const { params, update } = useQueryState();
  return (
    <Select
      aria-label={t("sort")}
      className="h-10 w-auto rounded-full"
      value={params.get("sort") ?? "NEWEST"}
      onChange={(e) => update((p) => p.set("sort", e.target.value))}
    >
      <option value="NEWEST">{t("sortNewest")}</option>
      <option value="PRICE_ASC">{t("sortPriceAsc")}</option>
      <option value="PRICE_DESC">{t("sortPriceDesc")}</option>
    </Select>
  );
}

export function ShopFilters({ filters }: { filters: FiltersView }) {
  const t = useTranslations("shop");
  const locale = useLocale();
  const { params, update, toggleMulti, pending } = useQueryState();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");
  const category = params.get("category");
  const selectedColors = params.getAll("colors");
  const selectedSizes = params.getAll("sizes");

  const section = "space-y-3 border-b border-border pb-6";
  const heading = "text-xs font-semibold uppercase tracking-wider text-muted";

  const activeCount =
    (category ? 1 : 0) + selectedColors.length + selectedSizes.length + (params.get("minPrice") || params.get("maxPrice") ? 1 : 0);

  // One panel, two placements: a sidebar on desktop, a bottom sheet on phones.
  const panel = (
      <div className={cn("space-y-6 transition-opacity", pending && "opacity-60")}>
        <div className={section}>
          <p className={heading}>{t("category")}</p>
          <div className="flex flex-col items-start text-sm">
            <button type="button" onClick={() => update((p) => p.delete("category"))} className={cn("py-2 hover:text-fg", !category ? "font-semibold text-fg" : "text-muted")}>
              {t("allCategories")}
            </button>
            {filters.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => update((p) => p.set("category", c.slug))}
                className={cn("py-2 hover:text-fg", c.parentId && "ps-3", category === c.slug ? "font-semibold text-fg" : "text-muted")}
              >
                {localized(c.name, locale)}
              </button>
            ))}
          </div>
        </div>

        <div className={section}>
          <p className={heading}>{t("colors")}</p>
          <div className="flex flex-wrap gap-2.5">
            {filters.colors.map((c) => {
              const active = selectedColors.includes(String(c.id));
              return (
                <button
                  key={c.id}
                  type="button"
                  title={localized(c.name, locale)}
                  aria-pressed={active}
                  onClick={() => toggleMulti("colors", String(c.id))}
                  className={cn("grid size-10 place-items-center rounded-full border border-border ring-2 ring-offset-2 ring-offset-bg transition", active ? "ring-fg" : "ring-transparent hover:ring-border")}
                  style={{ backgroundColor: c.hexCode }}
                >
                  {active && <Check className="size-4 text-white mix-blend-difference" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={section}>
          <p className={heading}>{t("sizes")}</p>
          <div className="flex flex-wrap gap-2">
            {filters.sizes.map((s) => {
              const active = selectedSizes.includes(String(s.id));
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleMulti("sizes", String(s.id))}
                  className={cn("h-10 min-w-12 rounded-full border px-3 text-sm transition", active ? "border-primary bg-primary text-primary-fg" : "border-border hover:border-fg")}
                >
                  {s.code}
                </button>
              );
            })}
          </div>
        </div>

        <form
          className={section}
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => {
              if (min) p.set("minPrice", min); else p.delete("minPrice");
              if (max) p.set("maxPrice", max); else p.delete("maxPrice");
            });
          }}
        >
          <p className={heading}>{t("price")}</p>
          <div className="flex gap-2">
            <Input type="number" min={0} inputMode="numeric" placeholder={t("min")} value={min} onChange={(e) => setMin(e.target.value)} />
            <Input type="number" min={0} inputMode="numeric" placeholder={t("max")} value={max} onChange={(e) => setMax(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="w-full">{t("apply")}</Button>
        </form>

        <button
          type="button"
          className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
          onClick={() => {
            setMin("");
            setMax("");
            update((p) => ["category", "colors", "sizes", "minPrice", "maxPrice", "q"].forEach((k) => p.delete(k)));
          }}
        >
          {t("clear")}
        </button>
      </div>
  );

  return (
    <>
      <Button variant="outline" size="sm" className="w-full lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" /> {t("filters")}
        {activeCount > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-fg">{activeCount}</span>
        )}
      </Button>

      <aside className="hidden lg:block">{panel}</aside>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("filters")}
        footer={<Button className="w-full" onClick={() => setOpen(false)}>{t("showResults")}</Button>}
      >
        {panel}
      </Dialog>
    </>
  );
}
