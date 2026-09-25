import { setRequestLocale } from "next-intl/server";
import { SettingsForm, type StoreSettings } from "@/features/admin/settings/SettingsForm";
import { backendFetch } from "@/lib/api/server";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await backendFetch<StoreSettings>("/api/v1/admin/settings", { auth: true });
  return <SettingsForm initial={settings} />;
}
