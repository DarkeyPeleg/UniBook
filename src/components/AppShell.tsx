import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";

export type AppNavActive =
  | "lecturers"
  | "book"
  | "requests"
  | "desk"
  | "lecturerRequests"
  | "admin";

type User = { name: string; email: string; role: UserRole };

type Props = {
  user: User;
  active: AppNavActive;
  children: ReactNode;
};

type NavItem = { href: string; label: string; key: AppNavActive };

function navItemsFor(role: UserRole): NavItem[] {
  const items: NavItem[] = [];
  if (role === "student" || role === "admin") {
    items.push(
      { href: "/student", label: "Dashboard", key: "lecturers" },
      { href: "/student/book", label: "Book a lecturer", key: "book" },
      { href: "/student/requests", label: "My requests", key: "requests" },
    );
  }
  if (role === "lecturer" || role === "admin") {
    items.push(
      { href: "/lecturer", label: "Dashboard", key: "desk" },
      { href: "/lecturer/requests", label: "Requests", key: "lecturerRequests" },
    );
  }
  if (role === "admin") {
    items.push({ href: "/admin", label: "Admin", key: "admin" });
  }
  return items;
}

export function AppShell({ user, active, children }: Props) {
  const items = navItemsFor(user.role);
  const home =
    user.role === "lecturer"
      ? "/lecturer"
      : user.role === "admin"
        ? "/admin"
        : "/student";

  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <header className="sticky top-0 z-50 border-b border-navy-deep bg-navy">
        <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-6">
          <Link
            href={home}
            className="text-xl font-bold tracking-tight text-white no-underline"
            style={{ color: "#ffffff" }}
          >
            UniBook
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm leading-tight sm:block">
              <p className="font-semibold text-white" style={{ color: "#ffffff" }}>
                {user.name}
              </p>
              <p className="capitalize text-white/75">{user.role}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="min-h-10 cursor-pointer rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                style={{ color: "#ffffff" }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-surface lg:block lg:w-72">
          <div className="flex h-full flex-col px-3 py-6">
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
              Navigation
            </p>
            <nav aria-label="Primary" className="flex flex-col gap-2">
              {items.map((item) => (
                <SideLink
                  key={item.key}
                  href={item.href}
                  label={item.label}
                  active={active === item.key}
                />
              ))}
            </nav>

            <div className="mt-auto border-t border-line px-3 pt-5">
              <p className="truncate text-sm font-bold text-ink">{user.name}</p>
              <p className="mt-1 truncate text-sm text-ink-muted">{user.email}</p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <nav
            aria-label="Primary mobile"
            className="flex gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-3 lg:hidden"
          >
            {items.map((item) => (
              <SideLink
                key={item.key}
                href={item.href}
                label={item.label}
                active={active === item.key}
                mobile
              />
            ))}
          </nav>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SideLink({
  href,
  label,
  active,
  mobile,
}: {
  href: string;
  label: string;
  active?: boolean;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <Link
        href={href}
        className={`cursor-pointer whitespace-nowrap rounded-md px-4 py-3 text-sm font-bold no-underline ${
          active ? "bg-navy text-white" : "bg-paper text-ink hover:bg-select"
        }`}
        style={active ? { color: "#ffffff" } : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`cursor-pointer rounded-md px-4 py-3.5 text-base font-bold leading-snug no-underline transition-colors duration-150 ${
        active ? "bg-navy text-white shadow-sm" : "text-ink hover:bg-select"
      }`}
      style={active ? { color: "#ffffff" } : { color: "var(--color-ink)" }}
    >
      {label}
    </Link>
  );
}
