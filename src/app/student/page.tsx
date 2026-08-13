import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LecturerList } from "@/components/Interactive";
import { Panel } from "@/components/Panel";
import { auth } from "@/lib/auth";
import { getAvailableLecturers } from "@/lib/actions";

export default async function StudentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lecturers = await getAvailableLecturers();

  return (
    <>
      <AppHeader user={session.user} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-xl font-bold text-ink">Available lecturers</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Only lecturers currently accepting appointments are listed. Refresh to
          see updates.
        </p>
        <Panel title="Browse and request">
          <LecturerList lecturers={lecturers} />
        </Panel>
      </main>
    </>
  );
}
