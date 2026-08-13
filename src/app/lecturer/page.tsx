import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  AvailabilityToggleButton,
  RespondButtons,
} from "@/components/Interactive";
import { auth } from "@/lib/auth";
import {
  getLecturerAvailability,
  getLecturerRequestSummary,
  getPendingForLecturer,
  respondToAppointment,
  toggleAvailability,
} from "@/lib/actions";

export default async function LecturerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "lecturer" && session.user.role !== "admin") {
    redirect("/student");
  }

  const lecturerId = session.user.id;
  const [availability, summary, pending] = await Promise.all([
    getLecturerAvailability(lecturerId),
    getLecturerRequestSummary(lecturerId),
    getPendingForLecturer(lecturerId),
  ]);
  const isAvailable = availability === "available";
  const preview = pending.slice(0, 3);

  async function onToggle() {
    "use server";
    const result = await toggleAvailability();
    revalidatePath("/lecturer");
    revalidatePath("/lecturer/requests");
    revalidatePath("/student");
    revalidatePath("/student/book");
    return result;
  }

  async function onRespond(
    appointmentId: string,
    status: "accepted" | "declined",
  ) {
    "use server";
    const result = await respondToAppointment(appointmentId, status);
    revalidatePath("/lecturer");
    revalidatePath("/lecturer/requests");
    revalidatePath("/student/requests");
    return result;
  }

  return (
    <AppShell user={session.user} active="desk">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink-muted">
              Your availability and a quick look at incoming consultation
              requests.
            </p>
          </div>
          <Link
            href="/lecturer/requests"
            className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-nav-active"
            style={{ color: "#ffffff" }}
          >
            View all requests
          </Link>
        </div>

        <section className="mb-8 overflow-hidden rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="bg-section px-5 py-3.5">
            <p
              className="text-base font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              Availability
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <AvailabilityToggleButton
              isAvailable={isAvailable}
              action={onToggle}
            />
          </div>
        </section>

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
              href="/lecturer/requests"
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
              Needs your decision
            </p>
            <Link
              href="/lecturer/requests"
              className="text-sm font-semibold text-white/90 no-underline hover:text-white"
              style={{ color: "#ffffff" }}
            >
              See all →
            </Link>
          </div>
          <div className="p-5 sm:p-6">
            {preview.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No pending requests right now.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {preview.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-ink">{row.studentName}</p>
                      <p className="text-sm text-ink-muted">{row.studentEmail}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {row.startsAt.toLocaleString("en-GH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">{row.reason}</p>
                    </div>
                    <RespondButtons appointmentId={row.id} respond={onRespond} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
