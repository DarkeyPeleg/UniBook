import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import { getAdminStats } from "@/lib/actions";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const { userCounts, apptCounts, recent } = await getAdminStats();

  return (
    <>
      <AppHeader user={session.user} />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-xl font-bold text-ink">System overview</h1>

        <Panel title="Users">
          <dl className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <dt className="text-ink-muted">Total</dt>
              <dd className="text-lg font-bold">{userCounts?.total ?? 0}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Students</dt>
              <dd className="text-lg font-bold">{userCounts?.students ?? 0}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Lecturers</dt>
              <dd className="text-lg font-bold">{userCounts?.lecturers ?? 0}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Appointments">
          <dl className="grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Total</dt>
              <dd className="text-lg font-bold">{apptCounts?.total ?? 0}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Pending</dt>
              <dd className="text-lg font-bold">{apptCounts?.pending ?? 0}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Accepted</dt>
              <dd className="text-lg font-bold">{apptCounts?.accepted ?? 0}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Declined</dt>
              <dd className="text-lg font-bold">{apptCounts?.declined ?? 0}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Recent activity">
          {recent.length === 0 ? (
            <p className="text-sm text-ink-muted">No appointments yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {recent.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span>
                    {row.startsAt.toLocaleString("en-GH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    — {row.reason.slice(0, 60)}
                    {row.reason.length > 60 ? "…" : ""}
                  </span>
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
