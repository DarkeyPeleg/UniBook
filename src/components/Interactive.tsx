"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { ActionResult } from "@/lib/types";

export function AvailabilityToggleButton({
  isAvailable,
  action,
}: {
  isAvailable: boolean;
  action: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function switchTo(wantAvailable: boolean) {
    if (wantAvailable === isAvailable || pending) return;
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage(result.error ?? "Could not update availability");
    });
  }

  return (
    <div className="w-full max-w-xl space-y-3">
      <div>
        <p className="text-sm font-bold text-ink">Your booking status</p>
        <p className="mt-1 text-sm text-ink-muted">
          Choose whether students can request appointments with you right now.
        </p>
      </div>

      <div
        role="group"
        aria-label="Booking availability"
        className="grid gap-3 sm:grid-cols-2"
      >
        <button
          type="button"
          disabled={pending}
          aria-pressed={isAvailable}
          onClick={() => switchTo(true)}
          className={`cursor-pointer rounded-md border px-4 py-4 text-left transition-colors disabled:opacity-60 ${
            isAvailable
              ? "border-available bg-[#e8f5e9] ring-2 ring-available/30"
              : "border-line bg-white hover:bg-paper"
          }`}
        >
          <p
            className={`text-sm font-bold ${isAvailable ? "text-available" : "text-ink"}`}
          >
            Accepting appointments
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Students can see you and send booking requests.
          </p>
          {isAvailable ? (
            <p className="mt-2 text-xs font-bold text-available">Currently selected</p>
          ) : null}
        </button>

        <button
          type="button"
          disabled={pending}
          aria-pressed={!isAvailable}
          onClick={() => switchTo(false)}
          className={`cursor-pointer rounded-md border px-4 py-4 text-left transition-colors disabled:opacity-60 ${
            !isAvailable
              ? "border-unavailable bg-[#eceff1] ring-2 ring-unavailable/25"
              : "border-line bg-white hover:bg-paper"
          }`}
        >
          <p
            className={`text-sm font-bold ${!isAvailable ? "text-unavailable" : "text-ink"}`}
          >
            Unavailable
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            You are hidden from the student booking list.
          </p>
          {!isAvailable ? (
            <p className="mt-2 text-xs font-bold text-unavailable">
              Currently selected
            </p>
          ) : null}
        </button>
      </div>

      {pending ? (
        <p className="text-sm text-ink-muted">Updating your status…</p>
      ) : null}
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
        className="min-h-11 cursor-pointer rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        style={{ color: "#ffffff" }}
      >
        Accept
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("declined")}
        className="min-h-11 cursor-pointer rounded-md border border-danger px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
      >
        Decline
      </button>
      {message ? <p className="w-full text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}

export function CancelAppointmentForm({
  appointmentId,
  cancel,
}: {
  appointmentId: string;
  cancel: (id: string, reason: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await cancel(appointmentId, reason);
      if (result.emailWarning) setMessage(result.emailWarning);
      if (!result.ok) {
        setMessage(result.error ?? "Could not cancel appointment");
        return;
      }
      setOpen(false);
      setReason("");
    });
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(true)}
          className="min-h-11 cursor-pointer rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-60"
        >
          Cancel appointment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-2">
      <label className="block text-sm font-semibold text-ink" htmlFor={`cancel-${appointmentId}`}>
        Reason for cancelling
      </label>
      <textarea
        id={`cancel-${appointmentId}`}
        required
        minLength={3}
        maxLength={500}
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explain why you need to cancel…"
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-section"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || reason.trim().length < 3}
          className="min-h-11 cursor-pointer rounded-md border border-danger bg-white px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
        >
          {pending ? "Cancelling…" : "Confirm cancel"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setReason("");
            setMessage(null);
          }}
          className="min-h-11 cursor-pointer rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-60"
        >
          Keep appointment
        </button>
      </div>
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </form>
  );
}
