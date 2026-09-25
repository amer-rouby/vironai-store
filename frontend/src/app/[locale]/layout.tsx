import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import { Providers } from "@/components/providers";
import { themeBootScript } from "@/features/theme/theme-config";
import { brandName, cn } from "@/lib/utils";
import "../globals.css";

/*
 * Self-hosted fonts (no build-time call to Google). Latin and Arabic subsets are separate families
 * stacked in globals.css; adjustFontFallback is off so a metric-matched Arial face does not swallow
 * Arabic glyphs before the Arabic family is reached.
 */
const bodyLatin = localFont({
  src: "../fonts/cairo-latin.woff2",
  weight: "300 800",
  variable: "--font-body-latin",
  display: "swap",
  adjustFontFallback: false,
});
const bodyArabic = localFont({
  src: "../fonts/cairo-arabic.woff2",
  weight: "300 800",
  variable: "--font-body-arabic",
  display: "swap",
  adjustFontFallback: false,
});
const displayLatin = localFont({
  src: "../fonts/cormorant-latin.woff2",
  weight: "500 700",
  variable: "--font-display-latin",
  display: "swap",
  adjustFontFallback: false,
});
const displayArabic = localFont({
  src: [
    { path: "../fonts/aref-ruqaa-400.woff2", weight: "400" },
    { path: "../fonts/aref-ruqaa-700.woff2", weight: "700" },
  ],
  variable: "--font-display-arabic",
  display: "swap",
  adjustFontFallback: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const name = brandName(locale);
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: { default: `${name} — ${siteConfig.tagline[locale === "ar" ? "ar" : "en"]}`, template: `%s | ${name}` },
    description: t("heroSubtitle"),
    openGraph: { siteName: name, images: [siteConfig.logo], locale },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme="bronze"
      suppressHydrationWarning
      className={cn(bodyLatin.variable, bodyArabic.variable, displayLatin.variable, displayArabic.variable)}
      style={
        {
          // Headings: calligraphic Ruqaa in Arabic (echoes the logo), Cormorant in English; Latin
          // characters inside Arabic headings still fall through to Cormorant and vice versa.
          "--font-display":
            locale === "ar"
              ? "var(--font-display-arabic), var(--font-display-latin)"
              : "var(--font-display-latin), var(--font-display-arabic)",
        } as React.CSSProperties
      }
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
