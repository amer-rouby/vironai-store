"use client";

import { LayoutDashboard, LogIn, LogOut, Menu, Package, Search, ShoppingBag, User, UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Sheet } from "@/components/ui/sheet";
import { cartCount, useCart } from "@/features/cart/cart-store";
import { ThemePanel, ThemeSwitcher } from "@/features/theme/ThemeSwitcher";
import type { SessionUser } from "@/lib/api/types";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { brandName, cn } from "@/lib/utils";

const iconButton = "relative grid size-10 place-items-center rounded-full text-fg transition hover:bg-surface-2";

export interface NavLink {
  href: string;
  label: string;
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className={cn("h-10 min-w-10 rounded-full px-3 text-sm font-semibold text-fg transition hover:bg-surface-2", className)}
    >
      {next === "ar" ? "عربي" : "EN"}
    </button>
  );
}

export function CartButton() {
  const t = useTranslations("nav");
  const lines = useCart((s) => s.lines);
  // Persisted cart is only known after hydration; avoid a server/client mismatch on the badge.
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(lines) : 0;
  return (
    <Link href="/cart" className={iconButton} aria-label={t("cart")}>
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -end-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-fg">
          {count}
        </span>
      )}
    </Link>
  );
}

function useLogout() {
  const router = useRouter();
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };
}

/** Desktop account icons (md and up). On phones the same actions live in the menu sheet. */
function AccountIcons({ user }: { user: SessionUser | null }) {
  const t = useTranslations("nav");
  const logout = useLogout();

  if (!user) {
    return (
      <Link href="/login" className={iconButton} aria-label={t("login")}>
        <User className="size-5" />
      </Link>
    );
  }
  return (
    <>
      <Link href="/account/orders" className={iconButton} aria-label={t("orders")} title={t("orders")}>
        <Package className="size-5" />
      </Link>
      {user.role === "ADMIN" && (
        <Link href="/admin" className={iconButton} aria-label={t("admin")} title={t("admin")}>
          <LayoutDashboard className="size-5" />
        </Link>
      )}
      <button type="button" onClick={logout} className={iconButton} aria-label={t("logout")} title={`${user.fullName} · ${t("logout")}`}>
        <LogOut className="size-5 rtl:-scale-x-100" />
      </button>
    </>
  );
}

export function SearchBox({ className, onSearched }: { className?: string; onSearched?: () => void }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
        onSearched?.();
      }}
      role="search"
    >
      <label className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm focus-within:border-accent">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          type="search"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="w-full bg-transparent outline-none placeholder:text-muted"
        />
      </label>
    </form>
  );
}

/** Phone navigation: one button opening a sheet with links, search, account and appearance. */
export function MobileMenu({ user, links }: { user: SessionUser | null; links: NavLink[] }) {
  const t = useTranslations("nav");
  const tt = useTranslations("theme");
  const locale = useLocale();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const row = "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base transition hover:bg-surface-2";

  return (
    <>
      <button type="button" className={iconButton} onClick={() => setOpen(true)} aria-label={t("menu")} aria-expanded={open}>
        <Menu className="size-6" />
      </button>
      <Sheet open={open} onClose={close} title={<span className="heading-display text-2xl text-primary">{brandName(locale)}</span>}>
        <div className="space-y-6 p-4">
          <SearchBox onSearched={close} />

          <nav className="flex flex-col">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className={cn(row, "font-medium")}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col border-t border-border pt-4">
            {user ? (
              <>
                <p className="px-3 pb-2 text-sm text-muted">{user.fullName}</p>
                <Link href="/account/orders" onClick={close} className={row}>
                  <Package className="size-5 text-muted" /> {t("orders")}
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={close} className={row}>
                    <LayoutDashboard className="size-5 text-muted" /> {t("admin")}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    close();
                    await logout();
                  }}
                  className={cn(row, "text-start text-danger")}
                >
                  <LogOut className="size-5 rtl:-scale-x-100" /> {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={close} className={row}>
                  <LogIn className="size-5 text-muted rtl:-scale-x-100" /> {t("login")}
                </Link>
                <Link href="/register" onClick={close} className={row}>
                  <UserPlus className="size-5 text-muted" /> {t("register")}
                </Link>
              </>
            )}
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center justify-between px-3">
              <span className="text-sm text-muted">{t("language")}</span>
              <LocaleSwitcher className="border border-border" />
            </div>
            <div className="px-3">
              <p className="sr-only">{tt("title")}</p>
              <ThemePanel />
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}

/** Desktop cluster (md and up): language, appearance, account, bag. */
export function HeaderActions({ user }: { user: SessionUser | null }) {
  return (
    <div className="flex items-center gap-0.5">
      <LocaleSwitcher />
      <ThemeSwitcher />
      <AccountIcons user={user} />
      <CartButton />
    </div>
  );
}
