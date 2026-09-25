import { LocaleSwitcher } from "@/components/layout/HeaderActions";
import { Logo } from "@/components/layout/Logo";
import { ThemeSwitcher } from "@/features/theme/ThemeSwitcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center bg-gradient-to-b from-accent-soft via-bg to-bg px-4 pb-10 pt-20 sm:py-10">
      <div className="absolute end-4 top-4 flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-card sm:p-8">{children}</div>
      </div>
    </div>
  );
}
