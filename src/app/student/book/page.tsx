import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import { getAvailableLecturers } from "@/lib/actions";

export default async function BookIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lecturers = await getAvailableLecturers();

  return (
    <AppShell user={session.user} active="book">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 border-b border-line pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Book a lecturer
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Select a lecturer who is accepting appointments to open the booking
            form.
          </p>
        </div>

        <section className="overflow-hidden rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="bg-section px-5 py-3.5">
            <p
              className="text-base font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              Choose a lecturer
            </p>
          </div>

          {lecturers.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-lg font-bold text-ink">No lecturers available</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
                Lecturers appear here when they turn on accepting appointments.
              </p>
              <Link
                href="/student"
                className="mt-6 inline-flex min-h-11 items-center rounded-md border border-line px-4 py-2.5 text-sm font-bold text-ink no-underline hover:bg-select"
              >
                Back to lecturers
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lecturers.map((lecturer) => (
                <li
                  key={lecturer.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-ink">{lecturer.name}</p>
                      <StatusBadge status="available" label="Accepting now" />
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{lecturer.email}</p>
                  </div>
                  <Link
                    href={`/student/book/${lecturer.id}`}
                    className="inline-flex min-h-12 cursor-pointer items-center rounded-md bg-navy px-5 py-3 text-sm font-bold text-white no-underline hover:bg-nav-active"
                    style={{ color: "#ffffff" }}
                  >
                    Book appointment
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
