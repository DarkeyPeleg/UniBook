import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import {
  AvailabilityToggleButton,
  RespondButtons,
} from "@/components/Interactive";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import {
  getLecturerAvailability,
  getPendingForLecturer,
  respondToAppointment,
  toggleAvailability,
} from "@/lib/actions";

export default async function LecturerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "lecturer" && session.user.role !== "admin") {
    redirect("/student");
  }

  const lecturerId = session.user.id;
  const [availability, pending] = await Promise.all([
    getLecturerAvailability(lecturerId),
    getPendingForLecturer(lecturerId),
  ]);
  const isAvailable = availability === "available";

  async function onToggle() {
    "use server";
    const result = await toggleAvailability();
    revalidatePath("/lecturer");
    revalidatePath("/student");
    return result;
  }

  async function onRespond(
    appointmentId: string,
    status: "accepted" | "declined",
  ) {
    "use server";
    const result = await respondToAppointment(appointmentId, status);
    revalidatePath("/lecturer");
    revalidatePath("/student/requests");
    return result;
  }

  return (
    <>
      <AppHeader user={session.user} />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-bold text-ink">Consultation desk</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Broadcast availability and manage incoming student requests.
          </p>
        </div>

        <Panel title="Availability">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              status={isAvailable ? "available" : "unavailable"}
              label={
                isAvailable ? "Accepting appointments" : "Unavailable"
              }
            />
            <AvailabilityToggleButton
              isAvailable={isAvailable}
              action={onToggle}
            />
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            Students only see you in the available list when you are accepting
            appointments.
          </p>
        </Panel>

        <Panel title="Pending requests">
          {pending.length === 0 ? (
            <p className="text-sm text-ink-muted">No pending requests.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pending.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{row.studentName}</p>
                    <p className="text-sm text-ink-muted">{row.studentEmail}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {row.startsAt.toLocaleString("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-sm">{row.reason}</p>
                  </div>
                  <RespondButtons appointmentId={row.id} respond={onRespond} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </main>
    </>
  );
}
