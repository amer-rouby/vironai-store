"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { MODES, THEMES, type Mode } from "./theme-config";

const MODE_ICONS: Record<Mode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeSwitcher({ align = "end" }: { align?: "start" | "end" }) {
  const t = useTranslations("theme");
  const { resolvedMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const TriggerIcon = resolvedMode === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("title")}
        aria-expanded={open}
        className="grid size-10 place-items-center rounded-full text-fg transition hover:bg-surface-2"
      >
        <TriggerIcon className="size-5" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-12 z-50 w-64 rounded-2xl border border-border bg-surface p-4 shadow-card",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          <ThemePanel />
        </div>
      )}
    </div>
  );
}

/** Mode + palette pickers. Used inside the header popover and inline in the mobile menu. */
export function ThemePanel() {
  const t = useTranslations("theme");
  const { theme, mode, setTheme, setMode } = useTheme();
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("mode")}</p>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
        {MODES.map((m) => {
          const Icon = MODE_ICONS[m];
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-2 text-xs transition",
                mode === m ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
              )}
            >
              <Icon className="size-4" />
              {t(m)}
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
        <Palette className="size-3.5" /> {t("palette")}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {THEMES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setTheme(p.id)}
            aria-pressed={theme === p.id}
            title={t(`themes.${p.id}`)}
            className="group flex flex-col items-center gap-1"
          >
            <span
              className={cn(
                "relative grid size-10 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition",
                theme === p.id ? "ring-fg" : "ring-transparent group-hover:ring-border",
              )}
              style={{ background: `linear-gradient(135deg, ${p.swatch} 50%, ${p.accent} 50%)` }}
            >
              {theme === p.id && <Check className="size-4 text-white drop-shadow" />}
            </span>
            <span className="text-[11px] text-muted">{t(`themes.${p.id}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
