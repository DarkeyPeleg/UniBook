"use client";

import { useActionState, useState, useTransition } from "react";
import { createAppointmentRequest } from "@/lib/actions";
import type { ActionResult } from "@/lib/types";

type Lecturer = { id: string; name: string; email: string };

export function LecturerList({ lecturers }: { lecturers: Lecturer[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (lecturers.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No lecturers are accepting appointments right now. Refresh later.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {lecturers.map((lecturer) => (
        <li key={lecturer.id} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{lecturer.name}</p>
              <p className="text-sm text-ink-muted">{lecturer.email}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setOpenId((id) => (id === lecturer.id ? null : lecturer.id))
              }
              className="min-h-11 rounded bg-navy px-3 py-2 text-sm font-semibold text-white"
            >
              {openId === lecturer.id ? "Close" : "Request appointment"}
            </button>
          </div>
          {openId === lecturer.id ? (
            <RequestForm lecturerId={lecturer.id} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function RequestForm({ lecturerId }: { lecturerId: string }) {
  const [state, formAction, pending] = useActionState(
    createAppointmentRequest,
    null as ActionResult | null,
  );

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded border border-line bg-paper p-3">
      <input type="hidden" name="lecturerId" value={lecturerId} />
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Date</span>
          <input
            type="date"
            name="date"
            required
            className="w-full rounded border border-line bg-surface px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Time</span>
          <input
            type="time"
            name="time"
            required
            className="w-full rounded border border-line bg-surface px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Reason</span>
        <textarea
          name="reason"
          required
          minLength={5}
          rows={3}
          className="w-full rounded border border-line bg-surface px-3 py-2"
          placeholder="Brief reason for the consultation"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}

export function AvailabilityToggleButton({
  isAvailable,
  action,
}: {
  isAvailable: boolean;
  action: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await action();
            if (!result.ok) setMessage(result.error ?? "Update failed");
          });
        }}
        className={`min-h-11 rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
          isAvailable ? "bg-unavailable" : "bg-available"
        }`}
      >
        {pending
          ? "Updating…"
          : isAvailable
            ? "Set Unavailable"
            : "Start accepting appointments"}
      </button>
      {message ? <p className="text-sm text-danger">{message}</p> : null}
    </div>
  );
}

export function RespondButtons({
  appointmentId,
  respond,
}: {
  appointmentId: string;
  respond: (
    id: string,
    status: "accepted" | "declined",
  ) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(status: "accepted" | "declined") {
    if (status === "declined") {
      const ok = window.confirm("Decline this request?");
      if (!ok) return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await respond(appointmentId, status);
      if (result.emailWarning) setMessage(result.emailWarning);
      if (!result.ok) setMessage(result.error ?? "Action failed");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("accepted")}
        className="min-h-11 rounded bg-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("declined")}
        className="min-h-11 rounded border border-danger px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
      >
        Decline
      </button>
      {message ? <p className="w-full text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}
