import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CancelAppointmentForm } from "@/components/Interactive";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import { cancelAppointment, getStudentAppointments } from "@/lib/actions";

export default async function StudentRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await getStudentAppointments(session.user.id);
  const active = rows.filter(
    (r) => r.status === "pending" || r.status === "accepted",
  );
  const history = rows.filter(
    (r) => r.status !== "pending" && r.status !== "accepted",
  );

  async function onCancel(appointmentId: string, reason: string) {
    "use server";
    const result = await cancelAppointment(appointmentId, reason);
    revalidatePath("/student");
    revalidatePath("/student/requests");
    revalidatePath("/lecturer");
    revalidatePath("/lecturer/requests");
    return result;
  }

  return (
    <AppShell user={session.user} active="requests">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              My requests
            </h1>
            <p className="mt-2 max-w-2xl text-base text-ink-muted">
              You can cancel pending or accepted appointments with a reason.
            </p>
          </div>
          <Link
            href="/student/book"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-nav-active"
            style={{ color: "#ffffff" }}
          >
            Book a lecturer
          </Link>
        </div>

        {rows.length === 0 ? (
          <section className="rounded-md border border-dashed border-line bg-surface px-4 py-12 text-center">
            <p className="text-lg font-bold text-ink">No requests yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              When you book a lecturer, the request shows up here.
            </p>
            <Link
              href="/student/book"
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-navy px-5 py-2.5 text-sm font-bold text-white no-underline"
              style={{ color: "#ffffff" }}
            >
              Book a lecturer
            </Link>
          </section>
        ) : (
          <div className="space-y-6">
            <RequestPanel
              title="Active"
              empty="No pending or accepted appointments."
              rows={active}
              currentUserId={session.user.id}
              cancel={onCancel}
              canCancel
            />
            <RequestPanel
              title="History"
              empty="No declined or cancelled requests yet."
              rows={history}
              currentUserId={session.user.id}
              cancel={onCancel}
              canCancel={false}
            />
          </div>
        )}
      </main>
    </AppShell>
  );
}

function RequestPanel({
  title,
  empty,
  rows,
  currentUserId,
  cancel,
  canCancel,
}: {
  title: string;
  empty: string;
  rows: Array<{
    id: string;
    startsAt: Date;
    reason: string;
    status: string;
    cancellationReason: string | null;
    cancelledByUserId: string | null;
    lecturerName: string;
    lecturerEmail: string;
  }>;
  currentUserId: string;
  cancel: (
    id: string,
    reason: string,
  ) => Promise<{ ok: boolean; error?: string; emailWarning?: string }>;
  canCancel: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-surface">
      <div
        className="bg-section px-4 py-2.5 text-sm font-bold text-white"
        style={{ color: "#ffffff" }}
      >
        {title}
        <span className="ml-2 font-normal text-white/80">({rows.length})</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p className="font-bold text-ink">{row.lecturerName}</p>
                <p className="text-sm text-ink-muted">{row.lecturerEmail}</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {row.startsAt.toLocaleString("en-GH", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{row.reason}</p>
                {row.status === "cancelled" && row.cancellationReason ? (
                  <p className="mt-2 text-sm text-cancelled">
                    Cancelled
                    {row.cancelledByUserId === currentUserId
                      ? " by you"
                      : " by lecturer"}
                    : {row.cancellationReason}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <StatusBadge status={row.status} />
                {canCancel ? (
                  <CancelAppointmentForm
                    appointmentId={row.id}
                    cancel={cancel}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
