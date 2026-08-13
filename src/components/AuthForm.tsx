"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/types";

type Props = {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
};

const fieldClass =
  "mt-2 w-full rounded-md border border-line bg-[#fafbfc] px-3.5 py-3 text-[0.9375rem] text-ink outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-ink-muted/60 hover:border-[#b8c0cc] focus:border-navy focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,51,102,0.15)]";

export function AuthForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Please wait…",
}: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <p
          className="rounded-md border border-danger/20 bg-[#ffebee] px-3.5 py-3 text-sm text-danger"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <fieldset
        disabled={pending}
        className="space-y-5 border-0 p-0 disabled:opacity-70"
      >
        {children}
        <button
          type="submit"
          className="mt-2 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-navy px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-nav-active disabled:cursor-not-allowed"
          style={{ color: "#ffffff" }}
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </fieldset>
    </form>
  );
}

export function AuthField({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  const id = props.id ?? (typeof props.name === "string" ? props.name : undefined);
  return (
    <label className="block text-sm" htmlFor={id}>
      <span className="font-semibold text-ink">{label}</span>
      <input id={id} className={fieldClass} {...props} />
      {hint ? (
        <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}
