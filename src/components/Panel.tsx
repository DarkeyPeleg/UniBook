import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, children, className = "" }: Props) {
  return (
    <section
      className={`overflow-hidden rounded border border-line bg-surface ${className}`}
    >
      <div className="bg-section px-4 py-2.5 text-sm font-bold text-white">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
