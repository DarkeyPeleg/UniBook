"use client";

import { useActionState, useMemo, useState } from "react";
import { createAppointmentRequest } from "@/lib/actions";
import {
  DURATION_OPTIONS,
  formatTimeLabel,
  isIntervalTaken,
  possibleStartMinutes,
  toDateKey,
  type DurationOption,
} from "@/lib/slots";
import type { ActionResult } from "@/lib/types";

const fieldClass =
  "mt-2 w-full rounded-md border border-line bg-[#fafbfc] px-3.5 py-3 text-[0.9375rem] text-ink outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-ink-muted/60 hover:border-[#b8c0cc] focus:border-navy focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,51,102,0.15)]";

type OccupiedSlot = {
  startsAt: string;
  durationMinutes: number;
};

type Props = {
  lecturerId: string;
  lecturerName: string;
  occupiedSlots: OccupiedSlot[];
};

export function BookingForm({
  lecturerId,
  lecturerName,
  occupiedSlots,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createAppointmentRequest,
    null as ActionResult | null,
  );

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  const [date, setDate] = useState(minDate);
  const [duration, setDuration] = useState<DurationOption>(30);
  const [time, setTime] = useState("");

  const occupiedForDay = useMemo(() => {
    return occupiedSlots
      .map((slot) => ({
        startsAt: new Date(slot.startsAt),
        durationMinutes: slot.durationMinutes,
      }))
      .filter((slot) => toDateKey(slot.startsAt) === date);
  }, [occupiedSlots, date]);

  const startOptions = useMemo(() => {
    const now = Date.now();
    return possibleStartMinutes(duration)
      .map((minutes) => {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const startsAt = new Date(`${date}T${value}:00`);
        const taken = isIntervalTaken(startsAt, duration, occupiedForDay);
        const past = startsAt.getTime() < now;
        return {
          minutes,
          value,
          label: formatTimeLabel(minutes),
          endLabel: formatTimeLabel(minutes + duration),
          open: !taken && !past,
        };
      })
      .filter((option) => option.open);
  }, [date, duration, occupiedForDay]);

  const openCount = startOptions.length;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lecturerId" value={lecturerId} />
      <input type="hidden" name="time" value={time} />
      <input type="hidden" name="durationMinutes" value={duration} />

      {state?.error ? (
        <p
          className="rounded-md border border-danger/20 bg-[#ffebee] px-3.5 py-3 text-sm text-danger"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="font-bold text-ink">Preferred date</span>
        <input
          type="date"
          name="date"
          required
          min={minDate}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime("");
          }}
          className={fieldClass}
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-ink">Meeting length</legend>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((option) => {
            const selected = duration === option;
            return (
              <button
                key={option}
                type="button"
                disabled={pending}
                onClick={() => {
                  setDuration(option);
                  setTime("");
                }}
                className={`min-h-11 rounded-md border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  selected
                    ? "border-navy bg-navy text-white"
                    : "border-line bg-white text-ink hover:bg-select"
                }`}
                style={selected ? { color: "#ffffff" } : undefined}
              >
                {option} min
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-ink">
          Start time ({duration} min)
        </legend>
        <p className="text-sm text-ink-muted">
          Only open times for a {duration}-minute meeting are shown. Change the
          length above to refresh this list.
        </p>
        {openCount === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-paper px-4 py-6 text-sm text-ink-muted">
            No open {duration}-minute slots on this day. Try another date or a
            shorter meeting.
          </p>
        ) : (
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {startOptions.map((option) => {
              const selected = time === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={pending}
                  onClick={() => setTime(option.value)}
                  className={`min-h-12 rounded-md border px-3 py-2 text-left text-sm font-semibold transition-colors disabled:opacity-60 ${
                    selected
                      ? "border-navy bg-navy text-white"
                      : "border-line bg-white text-ink hover:bg-select"
                  }`}
                  style={selected ? { color: "#ffffff" } : undefined}
                >
                  <span className="block">{option.label}</span>
                  <span
                    className={`mt-0.5 block text-xs font-normal ${
                      selected ? "text-white/80" : "text-ink-muted"
                    }`}
                  >
                    ends {option.endLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {time && openCount > 0 ? (
          <p className="text-sm font-semibold text-ink">
            Selected: {formatTimeLabel(
              Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)),
            )}{" "}
            -{" "}
            {formatTimeLabel(
              Number(time.slice(0, 2)) * 60 +
                Number(time.slice(3, 5)) +
                duration,
            )}{" "}
            ({duration} min)
          </p>
        ) : openCount > 0 ? (
          <p className="text-sm text-ink-muted">
            {openCount} open start time{openCount === 1 ? "" : "s"} for{" "}
            {duration} minutes.
          </p>
        ) : null}
      </fieldset>

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
        disabled={pending || !time}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-nav-active disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
        style={{ color: "#ffffff" }}
      >
        {pending ? "Sending request…" : "Send booking request"}
      </button>
    </form>
  );
}
