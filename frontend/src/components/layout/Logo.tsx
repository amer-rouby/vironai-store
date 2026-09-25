import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { brandName, cn } from "@/lib/utils";

/** compact: smaller mark and name for the phone header bar. */
export function Logo({ className, withName = true, compact = false }: { className?: string; withName?: boolean; compact?: boolean }) {
  const locale = useLocale();
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={brandName(locale)}>
      <Image src={siteConfig.logo} alt="" width={44} height={44} className={cn("rounded-full", compact ? "size-9" : "size-11")} priority />
      {withName && (
        <span className={cn("heading-display font-semibold leading-none text-primary", compact ? "text-xl" : "text-2xl")}>{brandName(locale)}</span>
      )}
    </Link>
  );
}
