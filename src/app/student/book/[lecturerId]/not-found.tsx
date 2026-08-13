import Link from "next/link";

export default function BookNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-ink">Lecturer not available</h1>
      <p className="mt-2 text-ink-muted">
        This lecturer is not accepting appointments, or the link is invalid.
      </p>
      <Link
        href="/student/book"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-navy px-5 py-2.5 text-sm font-bold text-white no-underline"
        style={{ color: "#ffffff" }}
      >
        Choose another lecturer
      </Link>
    </div>
  );
}
