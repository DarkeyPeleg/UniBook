import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";

type Props = {
  user?: { name: string; email: string; role: UserRole } | null;
};

export function AppHeader({ user }: Props) {
  return (
    <header className="bg-navy text-on-navy">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-on-navy no-underline" style={{ color: "#ffffff" }}>
            UniBook
          </Link>
          {user ? (
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              {user.role === "student" || user.role === "admin" ? (
                <>
                  <Link href="/student" className="text-on-navy no-underline hover:underline" style={{ color: "#ffffff" }}>
                    Lecturers
                  </Link>
                  <Link
                    href="/student/requests"
                    className="text-on-navy no-underline hover:underline"
                    style={{ color: "#ffffff" }}
                  >
                    My requests
                  </Link>
                </>
              ) : null}
              {user.role === "lecturer" || user.role === "admin" ? (
                <Link href="/lecturer" className="text-on-navy no-underline hover:underline" style={{ color: "#ffffff" }}>
                  Consultation desk
                </Link>
              ) : null}
              {user.role === "admin" ? (
                <Link href="/admin" className="text-on-navy no-underline hover:underline" style={{ color: "#ffffff" }}>
                  Admin
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-on-navy/80 sm:inline">
                {user.name} · {user.role}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded border border-white/40 px-3 py-1.5 font-semibold text-on-navy hover:bg-white/10"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-on-navy no-underline hover:underline">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded border border-white/40 px-3 py-1.5 font-semibold text-on-navy no-underline hover:bg-white/10"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
