import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import { getStudentAppointments } from "@/lib/actions";

export default async function StudentRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await getStudentAppointments(session.user.id);

  return (
    <>
      <AppHeader user={session.user} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-xl font-bold text-ink">Your requests</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Refresh the page to see the latest status from your lecturers.
        </p>
        <Panel title="History">
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted">
              You have not submitted any appointment requests yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{row.lecturerName}</p>
                    <p className="text-sm text-ink-muted">
                      {row.startsAt.toLocaleString("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-ink">{row.reason}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </main>
    </>
  );
}
