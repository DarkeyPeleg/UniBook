import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRangeLabel, monthBounds, shiftMonth, toDateKey } from "@/lib/slots";

export type CalendarEvent = {
  id: string;
  startsAt: Date;
  durationMinutes: number;
  reason: string;
  status: string;
  otherPartyName: string;
};

type Props = {
  year: number;
  monthIndex0: number;
  events: CalendarEvent[];
  basePath: string;
  selectedDate?: string;
  partyLabel: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BookingCalendar({
  year,
  monthIndex0,
  events,
  basePath,
  selectedDate,
  partyLabel,
}: Props) {
  const monthName = new Date(Date.UTC(year, monthIndex0, 1)).toLocaleString(
    "en-GH",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );

  const { start } = monthBounds(year, monthIndex0);
  const daysInMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  // Monday-first index: Sun=6, Mon=0...
  const firstDow = (start.getUTCDay() + 6) % 7;

  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = toDateKey(event.startsAt);
    const list = byDate.get(key) ?? [];
    list.push(event);
    byDate.set(key, list);
  }

  const prev = shiftMonth(year, monthIndex0, -1);
  const next = shiftMonth(year, monthIndex0, 1);
  const prevHref = `${basePath}?month=${prev.year}-${String(prev.monthIndex0 + 1).padStart(2, "0")}`;
  const nextHref = `${basePath}?month=${next.year}-${String(next.monthIndex0 + 1).padStart(2, "0")}`;

  const selectedEvents =
    selectedDate && byDate.get(selectedDate)
      ? byDate.get(selectedDate)!
      : [];

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: null, key: `pad-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, key: `day-${day}` });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">{monthName}</h2>
        <div className="flex gap-2">
          <Link
            href={prevHref}
            className="inline-flex min-h-10 items-center rounded-md border border-line bg-surface px-3 text-sm font-bold text-ink no-underline hover:bg-select"
          >
            Previous
          </Link>
          <Link
            href={nextHref}
            className="inline-flex min-h-10 items-center rounded-md border border-line bg-surface px-3 text-sm font-bold text-ink no-underline hover:bg-select"
          >
            Next
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-xs font-bold uppercase tracking-wide text-ink-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-1 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            if (cell.day === null) {
              return (
                <div
                  key={cell.key}
                  className="min-h-20 border-b border-r border-line bg-paper/50 sm:min-h-24"
                />
              );
            }
            const dateKey = `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
            const dayEvents = byDate.get(dateKey) ?? [];
            const active = dayEvents.filter(
              (e) => e.status === "pending" || e.status === "accepted",
            );
            const isSelected = selectedDate === dateKey;
            const href = `${basePath}?month=${year}-${String(monthIndex0 + 1).padStart(2, "0")}&day=${dateKey}`;

            return (
              <Link
                key={cell.key}
                href={href}
                className={`min-h-20 border-b border-r border-line p-1.5 no-underline transition-colors sm:min-h-24 sm:p-2 ${
                  isSelected ? "bg-select" : "bg-surface hover:bg-paper"
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    active.length > 0 ? "text-navy" : "text-ink"
                  }`}
                >
                  {cell.day}
                </p>
                {active.length > 0 ? (
                  <p className="mt-1 text-[11px] font-semibold text-ink-muted">
                    {active.length} booking{active.length === 1 ? "" : "s"}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div
          className="bg-section px-4 py-2.5 text-sm font-bold text-white"
          style={{ color: "#ffffff" }}
        >
          {selectedDate
            ? `Bookings on ${new Date(selectedDate + "T12:00:00Z").toLocaleDateString("en-GH", { dateStyle: "full", timeZone: "UTC" })}`
            : "Select a day to see bookings"}
        </div>
        {!selectedDate ? (
          <p className="px-4 py-6 text-sm text-ink-muted">
            Tap a date on the calendar.
          </p>
        ) : selectedEvents.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-muted">
            No bookings on this day.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {selectedEvents.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
              >
                <div>
                  <p className="font-bold text-ink">
                    {formatRangeLabel(event.startsAt, event.durationMinutes)} ·{" "}
                    {event.otherPartyName}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {partyLabel}: {event.otherPartyName}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{event.reason}</p>
                </div>
                <StatusBadge status={event.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
