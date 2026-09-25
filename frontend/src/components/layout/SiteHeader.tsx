import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { CartButton, HeaderActions, MobileMenu, SearchBox } from "./HeaderActions";
import { Logo } from "./Logo";

export async function SiteHeader() {
  const [t, user] = await Promise.all([getTranslations("nav"), getSession()]);
  const links = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("shop") },
    { href: "/shop?sort=NEWEST", label: t("newArrivals") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-md">
      {/* Phone: menu · logo · bag. Everything else lives in the menu sheet. */}
      <div className="container-page flex h-16 items-center justify-between gap-2 md:hidden">
        <MobileMenu user={user} links={links} />
        <Logo compact />
        <CartButton />
      </div>

      {/* Tablet and desktop */}
      <div className="container-page hidden h-18 items-center gap-6 md:flex">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-2.5 text-muted transition hover:bg-surface-2 hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
        <SearchBox className="ms-auto hidden w-64 lg:block" />
        <div className="ms-auto lg:ms-0">
          <HeaderActions user={user} />
        </div>
      </div>
    </header>
  );
}
