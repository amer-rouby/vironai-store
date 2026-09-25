import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminResourcePage } from "@/features/admin/AdminResourcePage";

const RESOURCES = ["orders", "categories", "colors", "sizes", "products", "customers"] as const;

/** One route for every admin resource; the registry decides what gets rendered. */
export default async function ResourcePage({ params }: { params: Promise<{ locale: string; resource: string }> }) {
  const { locale, resource } = await params;
  setRequestLocale(locale);
  const key = RESOURCES.find((r) => r === resource);
  if (!key) notFound();
  return <AdminResourcePage resource={key} />;
}
