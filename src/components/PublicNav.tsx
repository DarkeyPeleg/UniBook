import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

type Props = {
  active?: "login" | "register" | "home";
};

export function PublicNav({ active }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-navy-deep bg-navy shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <BrandLogo href="/" size="sm" />

        <nav aria-label="Account" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className={`inline-flex min-h-10 cursor-pointer items-center rounded px-3 py-2 text-sm font-semibold no-underline transition-colors duration-150 sm:px-4 ${
              active === "login"
                ? "bg-white/15 text-white"
                : "text-white hover:bg-white/10"
            }`}
            style={{ color: "#ffffff" }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className={`inline-flex min-h-10 cursor-pointer items-center rounded px-3 py-2 text-sm font-semibold no-underline transition-colors duration-150 sm:px-4 ${
              active === "register"
                ? "bg-white text-navy"
                : "bg-white/95 text-navy hover:bg-select"
            }`}
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
