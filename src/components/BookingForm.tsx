"use client";

import { useActionState } from "react";
import { createAppointmentRequest } from "@/lib/actions";
import type { ActionResult } from "@/lib/types";

const fieldClass =
  "mt-2 w-full rounded-md border border-line bg-[#fafbfc] px-3.5 py-3 text-[0.9375rem] text-ink outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-ink-muted/60 hover:border-[#b8c0cc] focus:border-navy focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,51,102,0.15)]";

type Props = {
  lecturerId: string;
  lecturerName: string;
};

export function BookingForm({ lecturerId, lecturerName }: Props) {
  const [state, formAction, pending] = useActionState(
    createAppointmentRequest,
    null as ActionResult | null,
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lecturerId" value={lecturerId} />

      {state?.error ? (
        <p
          className="rounded-md border border-danger/20 bg-[#ffebee] px-3.5 py-3 text-sm text-danger"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-bold text-ink">Preferred date</span>
          <input
            type="date"
            name="date"
            required
            min={minDate}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-bold text-ink">Preferred time</span>
          <input type="time" name="time" required className={fieldClass} />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-bold text-ink">Reason for consultation</span>
        <textarea
          name="reason"
          required
          minLength={5}
          rows={4}
          className={fieldClass}
          placeholder={`Why do you want to meet ${lecturerName}?`}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-nav-active disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
        style={{ color: "#ffffff" }}
      >
        {pending ? "Sending request…" : "Send booking request"}
      </button>
    </form>
  );
}
