import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/features/cart/CartView";
import { getSession } from "@/lib/auth/session";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, user] = await Promise.all([getTranslations("cart"), getSession()]);
  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="heading-display mb-6 text-3xl text-primary sm:mb-8 sm:text-4xl">{t("title")}</h1>
      <CartView signedIn={!!user} />
    </div>
  );
}
