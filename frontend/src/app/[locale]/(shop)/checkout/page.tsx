import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";
import { getSession } from "@/lib/auth/session";
import { backendFetch } from "@/lib/api/server";
import type { CheckoutOptions } from "@/lib/api/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSession();
  if (!user) {
    redirect({ href: `/login?next=${encodeURIComponent(`/${await getLocale()}/checkout`)}`, locale });
  }
  const [t, options] = await Promise.all([
    getTranslations("checkout"),
    backendFetch<CheckoutOptions>("/api/v1/checkout/options"),
  ]);
  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="heading-display mb-6 text-3xl text-primary sm:mb-8 sm:text-4xl">{t("title")}</h1>
      <CheckoutForm user={user!} paymentMethods={options.paymentMethods} />
    </div>
  );
}
