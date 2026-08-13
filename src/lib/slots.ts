/** Business day window and booking increments (Ghana / GMT). */
export const DAY_START_MINUTES = 8 * 60; // 08:00
export const DAY_END_MINUTES = 17 * 60; // 17:00
export const SLOT_STEP_MINUTES = 15;
export const DURATION_OPTIONS = [15, 30, 45, 60] as const;
export type DurationOption = (typeof DURATION_OPTIONS)[number];

export function formatTimeLabel(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatDateTimeLabel(d: Date): string {
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  return formatTimeLabel(minutes);
}

export function formatRangeLabel(start: Date, durationMinutes: number): string {
  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
  const endMin = startMin + durationMinutes;
  return `${formatTimeLabel(startMin)} - ${formatTimeLabel(endMin)}`;
}

export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  if (minute % SLOT_STEP_MINUTES !== 0) return null;
  return hour * 60 + minute;
}

export function isValidDuration(value: number): value is DurationOption {
  return (DURATION_OPTIONS as readonly number[]).includes(value);
}

export function buildStartsAt(date: string, minutesFromMidnight: number): Date {
  const hour = Math.floor(minutesFromMidnight / 60);
  const minute = minutesFromMidnight % 60;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${date}T${hh}:${mm}:00`);
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function appointmentEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export type OccupiedInterval = {
  startsAt: Date;
  durationMinutes: number;
};

/** True when [aStart, aEnd) overlaps [bStart, bEnd). */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function isIntervalTaken(
  start: Date,
  durationMinutes: number,
  occupied: OccupiedInterval[],
): boolean {
  const end = appointmentEnd(start, durationMinutes);
  return occupied.some((row) =>
    intervalsOverlap(
      start,
      end,
      row.startsAt,
      appointmentEnd(row.startsAt, row.durationMinutes),
    ),
  );
}

/** Possible start times for a duration that fit inside the business day. */
export function possibleStartMinutes(durationMinutes: number): number[] {
  const latestStart = DAY_END_MINUTES - durationMinutes;
  const starts: number[] = [];
  for (
    let m = DAY_START_MINUTES;
    m <= latestStart;
    m += SLOT_STEP_MINUTES
  ) {
    starts.push(m);
  }
  return starts;
}

export function monthBounds(year: number, monthIndex0: number) {
  const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

export function shiftMonth(year: number, monthIndex0: number, delta: number) {
  const d = new Date(Date.UTC(year, monthIndex0 + delta, 1));
  return { year: d.getUTCFullYear(), monthIndex0: d.getUTCMonth() };
}
