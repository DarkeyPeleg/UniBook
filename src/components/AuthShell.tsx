import Image from "next/image";
import type { ReactNode } from "react";
import { PublicNav } from "@/components/PublicNav";

type Props = {
  active: "login" | "register";
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ active, title, subtitle, children, footer }: Props) {
  return (
    <div className="relative isolate min-h-svh">
      {/* Background sits inside this page layer (not behind body) */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-campus.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#002147]/60" aria-hidden />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col">
        <PublicNav active={active} />

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
          <div className="w-full max-w-[420px] motion-safe:animate-[fadeUp_0.35s_ease-out]">
            <div className="overflow-hidden rounded-md border border-white/25 bg-white shadow-[0_12px_40px_rgba(0,33,71,0.35)]">
              <div className="border-b border-line px-6 pb-1 pt-6 sm:px-7 sm:pt-7">
                <h1 className="text-2xl font-bold tracking-tight text-ink">
                  {title}
                </h1>
                <p className="mt-1.5 pb-5 text-sm leading-relaxed text-ink-muted">
                  {subtitle}
                </p>
              </div>
              <div className="px-6 py-6 sm:px-7 sm:py-7">{children}</div>
            </div>

            {footer ? <div className="mt-5">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
