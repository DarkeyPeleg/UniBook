import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BookingCalendar } from "@/components/BookingCalendar";
import { auth } from "@/lib/auth";
import {
  getLecturerCalendarAppointments,
  getStudentCalendarAppointments,
} from "@/lib/actions";
import { monthBounds } from "@/lib/slots";

type Props = {
  searchParams: Promise<{ month?: string; day?: string }>;
};

function parseMonth(raw: string | undefined) {
  const now = new Date();
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
    return {
      year: now.getUTCFullYear(),
      monthIndex0: now.getUTCMonth(),
    };
  }
  const [y, m] = raw.split("-").map(Number);
  return { year: y, monthIndex0: m - 1 };
}

export default async function CalendarPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const { year, monthIndex0 } = parseMonth(params.month);
  const { start, end } = monthBounds(year, monthIndex0);

  const role = session.user.role;
  const events =
    role === "lecturer"
      ? await getLecturerCalendarAppointments(session.user.id, start, end)
      : role === "admin"
        ? await getLecturerCalendarAppointments(session.user.id, start, end)
        : await getStudentCalendarAppointments(session.user.id, start, end);

  // Admin without lecturer bookings: also show student view if they book
  const adminStudentEvents =
    role === "admin"
      ? await getStudentCalendarAppointments(session.user.id, start, end)
      : [];

  const merged =
    role === "admin"
      ? [...events, ...adminStudentEvents].sort(
          (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
        )
      : events;

  const partyLabel =
    role === "lecturer" ? "Student" : role === "admin" ? "With" : "Lecturer";

  return (
    <AppShell user={session.user} active="calendar">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 border-b border-line pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Calendar
          </h1>
          <p className="mt-2 max-w-2xl text-base text-ink-muted">
            See all your bookings by day. Pending and accepted meetings block
            overlapping times for that lecturer.
          </p>
        </div>

        <BookingCalendar
          year={year}
          monthIndex0={monthIndex0}
          events={merged}
          basePath="/calendar"
          selectedDate={params.day}
          partyLabel={partyLabel}
        />
      </main>
    </AppShell>
  );
}
