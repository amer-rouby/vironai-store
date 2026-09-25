"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { ApiError, toApiError } from "@/lib/api/errors";
import type { SessionUser } from "@/lib/api/types";

const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });
const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  phone: z.union([z.literal(""), z.string().regex(/^\+?[0-9]{8,15}$/)]),
  password: z.string().min(8).max(72),
});

type Mode = "login" | "register";
type FormValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const te = useTranslations("errors");
  const router = useRouter();
  const redirectTo = useSearchParams().get("next");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver((mode === "login" ? loginSchema : registerSchema) as typeof registerSchema),
    defaultValues: { email: "", password: "", fullName: "", phone: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = mode === "login"
      ? { email: values.email, password: values.password }
      : { ...values, phone: values.phone || null, locale };
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error: ApiError = await toApiError(res);
      error.fieldPaths().forEach(([path, message]) => setError(path as keyof FormValues, { message }));
      toast.error(te.has(error.code) ? te(error.code) : te("generic"));
      return;
    }
    const user = (await res.json()) as SessionUser;
    // Only same-site relative paths are honoured, never an absolute URL from the query string.
    const safeNext = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : null;
    router.replace(safeNext ?? (user.role === "ADMIN" ? "/admin" : "/"));
    router.refresh();
  };

  const err = (name: keyof FormValues) => (errors[name] ? errors[name]?.message || te("required") : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {mode === "register" && (
        <Field label={t("fullName")} htmlFor="fullName" error={err("fullName")}>
          <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
        </Field>
      )}
      <Field label={t("email")} htmlFor="email" error={err("email")}>
        <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      {mode === "register" && (
        <Field label={t("phone")} htmlFor="phone" error={err("phone")}>
          <Input id="phone" type="tel" dir="ltr" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
      )}
      <Field label={t("password")} htmlFor="password" error={err("password")} hint={mode === "register" ? t("passwordHint") : undefined}>
        <Input
          id="password"
          type="password"
          dir="ltr"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        {mode === "login" ? t("submitLogin") : t("submitRegister")}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="inline-block py-2 font-semibold text-primary hover:underline">
          {mode === "login" ? t("createOne") : t("signIn")}
        </Link>
      </p>
    </form>
  );
}
