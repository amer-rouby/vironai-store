import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductPurchase } from "@/features/catalog/ProductPurchase";
import { getProduct } from "@/lib/api/catalog";
import { localized } from "@/lib/utils";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: localized(product.name, locale),
    description: localized(product.description, locale).slice(0, 160),
    openGraph: { images: product.images.slice(0, 1).map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="container-page py-6 sm:py-10">
      <ProductPurchase product={product} />
    </div>
  );
}
