"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/types";

const fieldClass =
  "mt-2 w-full rounded-md border border-line bg-[#fafbfc] px-3.5 py-3 text-[0.9375rem] text-ink outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-ink-muted/60 hover:border-[#b8c0cc] focus:border-navy focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,51,102,0.15)]";

type Props = {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  defaultName: string;
  defaultEmail: string;
};

export function ProfileEditForm({
  action,
  defaultName,
  defaultEmail,
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
        <label className="block text-sm" htmlFor="name">
          <span className="font-semibold text-ink">Full name</span>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            defaultValue={defaultName}
            autoComplete="name"
            className={fieldClass}
          />
        </label>

        <label className="block text-sm" htmlFor="email">
          <span className="font-semibold text-ink">Email</span>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            autoComplete="email"
            className={fieldClass}
          />
        </label>

        <div className="border-t border-line pt-5">
          <p className="text-sm font-bold text-ink">Change password</p>
          <p className="mt-1 text-sm text-ink-muted">
            Leave blank to keep your current password.
          </p>

          <label className="mt-4 block text-sm" htmlFor="currentPassword">
            <span className="font-semibold text-ink">Current password</span>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className={fieldClass}
            />
          </label>

          <label className="mt-4 block text-sm" htmlFor="newPassword">
            <span className="font-semibold text-ink">New password</span>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              minLength={8}
              autoComplete="new-password"
              className={fieldClass}
            />
            <span className="mt-1.5 block text-xs text-ink-muted">
              At least 8 characters.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="mt-2 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-navy px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-nav-active disabled:cursor-not-allowed sm:w-auto sm:min-w-[180px]"
          style={{ color: "#ffffff" }}
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </fieldset>
    </form>
  );
}
