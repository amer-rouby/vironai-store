"use client";

import { LayoutDashboard, Settings, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { resourceOrder, resourceRegistry } from "./resources";

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const items = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard, exact: true },
    ...resourceOrder.map((key) => ({ href: `/admin/${key}`, label: t(`resources.${key}`), icon: resourceRegistry[key].icon, exact: false })),
    { href: "/admin/settings", label: t("settings.title"), icon: Settings, exact: true },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
      <Link href="/" className="mt-auto flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-fg lg:mt-6">
        <Store className="size-4" /> {t("backToStore")}
      </Link>
    </nav>
  );
}
