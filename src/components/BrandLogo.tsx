import Link from "next/link";

type Props = {
  href: string;
  /** White wordmark for navy headers */
  variant?: "onNavy" | "onLight";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { mark: 28, text: "text-lg" },
  md: { mark: 32, text: "text-xl" },
  lg: { mark: 40, text: "text-2xl" },
} as const;

export function BrandLogo({
  href,
  variant = "onNavy",
  size = "md",
  className = "",
}: Props) {
  const s = sizes[size];
  const textColor = variant === "onNavy" ? "#ffffff" : "var(--color-navy)";

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 no-underline ${className}`}
      aria-label="UniBook home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/unibook-mark.svg"
        alt=""
        width={s.mark}
        height={s.mark}
        className="rounded-md"
      />
      <span
        className={`font-bold tracking-tight ${s.text}`}
        style={{ color: textColor }}
      >
        UniBook
      </span>
    </Link>
  );
}
