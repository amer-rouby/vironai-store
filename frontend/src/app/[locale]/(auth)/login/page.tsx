import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/features/auth/AuthForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="heading-display mb-6 text-center text-3xl text-primary">{t("loginTitle")}</h1>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </>
  );
}
