import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type Lecturer = { id: string; name: string; email: string };

export function LecturerList({ lecturers }: { lecturers: Lecturer[] }) {
  if (lecturers.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line bg-paper px-6 py-14 text-center">
        <p className="text-lg font-bold text-ink">No lecturers available</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Lecturers show up here when they turn on accepting appointments.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {lecturers.map((lecturer) => (
        <li
          key={lecturer.id}
          className="flex flex-wrap items-center justify-between gap-4 py-4"
        >
          <div className="min-w-0">
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
  );
}
