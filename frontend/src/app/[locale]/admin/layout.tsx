import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/HeaderActions";
import { Logo } from "@/components/layout/Logo";
import { AdminSidebar } from "@/features/admin/AdminSidebar";
import { ThemeSwitcher } from "@/features/theme/ThemeSwitcher";
import { getSession } from "@/lib/auth/session";

/** Server-side guard: the admin UI is never rendered for a non-admin (the API enforces it again). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, locale] = await Promise.all([getSession(), getLocale()]);
  if (!user || user.role !== "ADMIN") {
    redirect({ href: `/login?next=${encodeURIComponent(`/${locale}/admin`)}`, locale });
  }
  const t = await getTranslations("admin");

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-4 lg:px-6">
          <Logo compact />
          <span className="hidden rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-primary sm:inline">{t("title")}</span>
          <div className="ms-auto flex items-center gap-1">
            <span className="hidden text-sm text-muted sm:inline">{user?.fullName}</span>
            <LocaleSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <div className="grid gap-4 p-3 sm:gap-6 sm:p-4 lg:grid-cols-[15rem_1fr] lg:p-6">
        <aside className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0 lg:sticky lg:top-22 lg:h-[calc(100dvh-7rem)] lg:overflow-visible">
          <AdminSidebar />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
