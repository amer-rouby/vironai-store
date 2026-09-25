import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { brandName } from "@/lib/utils";
import { Logo } from "./Logo";

export function SiteFooter() {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-3 md:gap-10 md:py-14">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">{t("footer.about")}</p>
        </div>
        <nav className="flex flex-col items-start text-sm">
          <Link href="/shop" className="py-2.5 text-muted hover:text-fg">{t("nav.shop")}</Link>
          <Link href="/cart" className="py-2.5 text-muted hover:text-fg">{t("nav.cart")}</Link>
          <Link href="/login" className="py-2.5 text-muted hover:text-fg">{t("nav.account")}</Link>
        </nav>
        <div className="flex flex-col items-start text-sm">
          <a href={siteConfig.contact.instagram} target="_blank" rel="noreferrer" className="py-2.5 text-muted hover:text-fg">Instagram</a>
          <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="py-2.5 text-muted hover:text-fg">WhatsApp</a>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {brandName(locale)} · {t("footer.rights")}
      </div>
    </footer>
  );
}
