import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LecturerList } from "@/components/LecturerList";
import { auth } from "@/lib/auth";
import {
  getAvailableLecturers,
  getStudentRequestSummary,
} from "@/lib/actions";

export default async function StudentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [lecturers, summary] = await Promise.all([
    getAvailableLecturers(),
    getStudentRequestSummary(session.user.id),
  ]);

  return (
    <AppShell user={session.user} active="lecturers">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink-muted">
              Overview of your requests and lecturers currently accepting
              appointments.
            </p>
          </div>
          <Link
            href="/student/book"
            className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-nav-active"
            style={{ color: "#ffffff" }}
          >
            Book a lecturer
          </Link>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: "Pending", value: summary.pending, color: "text-pending" },
            { label: "Accepted", value: summary.accepted, color: "text-accepted" },
            { label: "Declined", value: summary.declined, color: "text-declined" },
            {
              label: "Cancelled",
              value: summary.cancelled,
              color: "text-cancelled",
            },
          ].map((item) => (
            <Link
              key={item.label}
              href="/student/requests"
              className="rounded-md border border-line bg-surface px-3 py-5 text-center no-underline shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-section sm:px-5"
            >
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="mt-1 text-sm font-bold text-ink">{item.label}</p>
            </Link>
          ))}
        </section>

        <section className="overflow-hidden rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-section px-5 py-3.5">
            <p
              className="text-base font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              Available lecturers
            </p>
            <p className="text-sm font-semibold text-white/90">
              {lecturers.length}{" "}
              {lecturers.length === 1 ? "lecturer" : "lecturers"}
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <LecturerList lecturers={lecturers} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
