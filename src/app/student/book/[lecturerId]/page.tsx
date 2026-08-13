import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BookingForm } from "@/components/BookingForm";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import { getAvailableLecturerById } from "@/lib/actions";

type Props = {
  params: Promise<{ lecturerId: string }>;
};

export default async function BookLecturerPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { lecturerId } = await params;
  const lecturer = await getAvailableLecturerById(lecturerId);
  if (!lecturer) notFound();

  return (
    <AppShell user={session.user} active="book">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
        <Link
          href="/student/book"
          className="text-sm font-bold no-underline hover:underline"
          style={{ color: "var(--color-link)" }}
        >
          ← Back to lecturers
        </Link>

        <div className="mt-4 mb-8 border-b border-line pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Book appointment
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            Send a consultation request to this lecturer.
          </p>
        </div>

        <section className="mb-6 overflow-hidden rounded-md border border-line bg-surface">
          <div className="bg-section px-5 py-3">
            <p
              className="text-sm font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              Lecturer
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
            <div>
              <p className="text-xl font-bold text-ink">{lecturer.name}</p>
              <p className="mt-1 text-sm text-ink-muted">{lecturer.email}</p>
            </div>
            <StatusBadge status="available" label="Accepting now" />
          </div>
        </section>

        <section className="overflow-hidden rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="bg-section px-5 py-3">
            <p
              className="text-sm font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              Request details
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <BookingForm
              lecturerId={lecturer.id}
              lecturerName={lecturer.name}
            />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
