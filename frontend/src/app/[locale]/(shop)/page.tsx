import Image from "next/image";
import { ArrowLeft, ArrowRight, RefreshCcw, Truck, Wallet } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";
import { ProductGrid } from "@/features/catalog/ProductCard";
import { getFilters, searchProducts } from "@/lib/api/catalog";
import { siteConfig } from "@/config/site";
import { localized } from "@/lib/utils";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, filters, featured] = await Promise.all([
    getTranslations("home"),
    getFilters(),
    searchProducts({ featured: true, size: 8 }),
  ]);
  const Arrow = (await getLocale()) === "ar" ? ArrowLeft : ArrowRight;
  const topCategories = filters.categories.filter((c) => c.parentId === null);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent-soft via-bg to-bg" />
        <div className="container-page grid items-center gap-8 py-10 md:grid-cols-2 md:gap-10 md:py-20">
          <div className="space-y-6">
            <h1 className="heading-display text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">{t("heroTitle")}</h1>
            <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">{t("heroSubtitle")}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/shop" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                {t("shopNow")} <Arrow className="size-4" />
              </Link>
              <Link href="#categories" className={buttonClass("outline", "lg", "w-full sm:w-auto")}>
                {t("exploreCategories")}
              </Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[14rem] sm:max-w-xs md:max-w-md">
            <div className="absolute inset-6 rounded-full bg-accent/30 blur-3xl" />
            <Image src={siteConfig.logo} alt="" fill priority sizes="(min-width: 768px) 28rem, 14rem" className="relative rounded-full object-contain drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="container-page">
        <div className="grid gap-4 rounded-3xl border border-border bg-surface p-5 sm:grid-cols-3 sm:p-6">
          {[
            { icon: Truck, title: t("perks.shipping"), desc: t("perks.shippingDesc") },
            { icon: RefreshCcw, title: t("perks.returns"), desc: t("perks.returnsDesc") },
            { icon: Wallet, title: t("perks.cod"), desc: t("perks.codDesc") },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="container-page scroll-mt-24 pt-14 md:pt-20">
        <h2 className="heading-display mb-6 text-3xl text-primary md:mb-8 md:text-4xl">{t("exploreCategories")}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {topCategories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-2 md:aspect-[4/3]">
              {c.imageUrl && (
                <Image src={c.imageUrl} alt="" fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="heading-display absolute bottom-3 start-4 text-xl text-white sm:text-2xl md:bottom-4 md:start-5 md:text-3xl">{localized(c.name, locale)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page pt-14 md:pt-20">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <h2 className="heading-display text-3xl text-primary md:text-4xl">{t("featured")}</h2>
          <Link href="/shop" className="-me-2 flex shrink-0 items-center gap-1 rounded-full px-2 py-2.5 text-sm font-medium text-muted hover:text-fg">
            {t("viewAll")} <Arrow className="size-4" />
          </Link>
        </div>
        <ProductGrid products={featured.content} />
      </section>
    </>
  );
}
