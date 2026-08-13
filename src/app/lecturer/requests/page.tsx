import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  AvailabilityToggleButton,
  CancelAppointmentForm,
  RespondButtons,
} from "@/components/Interactive";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import {
  cancelAppointment,
  getLecturerAppointments,
  getLecturerAvailability,
  respondToAppointment,
  toggleAvailability,
} from "@/lib/actions";

export default async function LecturerRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "lecturer" && session.user.role !== "admin") {
    redirect("/student");
  }

  const lecturerId = session.user.id;
  const [availability, rows] = await Promise.all([
    getLecturerAvailability(lecturerId),
    getLecturerAppointments(lecturerId),
  ]);
  const isAvailable = availability === "available";
  const pending = rows.filter((r) => r.status === "pending");
  const accepted = rows.filter((r) => r.status === "accepted");
  const history = rows.filter(
    (r) => r.status !== "pending" && r.status !== "accepted",
  );

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

  async function onCancel(appointmentId: string, reason: string) {
    "use server";
    const result = await cancelAppointment(appointmentId, reason);
    revalidatePath("/lecturer");
    revalidatePath("/lecturer/requests");
    revalidatePath("/student");
    revalidatePath("/student/requests");
    return result;
  }

  return (
    <AppShell user={session.user} active="lecturerRequests">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Requests
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink-muted">
              Accept or decline pending consultations, or cancel with a reason
              even after accepting.
            </p>
          </div>
          <Link
            href="/lecturer"
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink no-underline hover:bg-select"
          >
            Back to dashboard
          </Link>
        </div>

        <section className="mb-8 overflow-hidden rounded-md border border-line bg-surface">
          <div className="bg-section px-5 py-3">
            <p
              className="text-sm font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              Availability
            </p>
          </div>
          <div className="p-5">
            <AvailabilityToggleButton
              isAvailable={isAvailable}
              action={onToggle}
            />
          </div>
        </section>

        {rows.length === 0 ? (
          <section className="rounded-md border border-dashed border-line bg-surface px-4 py-12 text-center">
            <p className="text-lg font-bold text-ink">No requests yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              When students book you, their requests will appear here.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            <RequestPanel
              title="Pending"
              empty="No pending requests."
              rows={pending}
              currentUserId={session.user.id}
              respond={onRespond}
              cancel={onCancel}
              mode="pending"
            />
            <RequestPanel
              title="Accepted"
              empty="No accepted appointments."
              rows={accepted}
              currentUserId={session.user.id}
              respond={onRespond}
              cancel={onCancel}
              mode="accepted"
            />
            <RequestPanel
              title="History"
              empty="No declined or cancelled requests yet."
              rows={history}
              currentUserId={session.user.id}
              respond={onRespond}
              cancel={onCancel}
              mode="history"
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
  respond,
  cancel,
  mode,
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
    studentName: string;
    studentEmail: string;
  }>;
  currentUserId: string;
  respond: (
    id: string,
    status: "accepted" | "declined",
  ) => Promise<{ ok: boolean; error?: string; emailWarning?: string }>;
  cancel: (
    id: string,
    reason: string,
  ) => Promise<{ ok: boolean; error?: string; emailWarning?: string }>;
  mode: "pending" | "accepted" | "history";
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
                <p className="font-bold text-ink">{row.studentName}</p>
                <p className="text-sm text-ink-muted">{row.studentEmail}</p>
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
                      : " by student"}
                    : {row.cancellationReason}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <StatusBadge status={row.status} />
                {mode === "pending" ? (
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <RespondButtons appointmentId={row.id} respond={respond} />
                    <CancelAppointmentForm
                      appointmentId={row.id}
                      cancel={cancel}
                    />
                  </div>
                ) : null}
                {mode === "accepted" ? (
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
