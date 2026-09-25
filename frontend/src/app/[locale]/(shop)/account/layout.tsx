import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";

/** Everything under /account requires a signed-in customer. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [user, locale] = await Promise.all([getSession(), getLocale()]);
  if (!user) redirect({ href: `/login?next=${encodeURIComponent(`/${locale}/account/orders`)}`, locale });
  return <div className="container-page py-6 sm:py-10">{children}</div>;
}
