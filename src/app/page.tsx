import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/roles";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-students", label: "Students" },
  { href: "#for-lecturers", label: "Lecturers" },
] as const;

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(homePathForRole(session.user.role));
  }

  return (
    <div className="flex min-h-full flex-col bg-paper">
      {/* Clear solid nav - always visible */}
      <header className="sticky top-0 z-50 border-b border-navy-deep bg-navy shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-6 sm:gap-10">
            <BrandLogo href="/" size="sm" />
            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 md:flex"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="cursor-pointer rounded px-3 py-2 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-white/10"
                  style={{ color: "#ffffff" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-10 cursor-pointer items-center rounded px-3 py-2 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-white/10 sm:px-4"
              style={{ color: "#ffffff" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-10 cursor-pointer items-center rounded bg-white px-3 py-2 text-sm font-semibold text-navy no-underline transition-colors duration-150 hover:bg-select sm:px-4"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Mobile section links */}
        <nav
          aria-label="Page sections"
          className="flex gap-1 overflow-x-auto border-t border-white/15 px-2 py-1 md:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="cursor-pointer whitespace-nowrap rounded px-3 py-2 text-xs font-semibold text-white no-underline hover:bg-white/10"
              style={{ color: "#ffffff" }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative isolate min-h-[70vh] overflow-hidden sm:min-h-[78vh]">
          <Image
            src="/images/hero-campus.jpg"
            alt="University campus buildings at dusk"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-navy/45 sm:bg-gradient-to-r sm:from-navy-deep/70 sm:via-navy/45 sm:to-navy/25"
            aria-hidden
          />

          <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-6xl items-center px-4 py-16 sm:min-h-[78vh] sm:px-6 sm:py-20">
            <div className="max-w-2xl motion-safe:animate-[fadeUp_0.4s_ease-out]">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/unibook-mark.svg"
                  alt=""
                  width={56}
                  height={56}
                  className="rounded-xl shadow-sm"
                />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90 drop-shadow">
                    University of Ghana
                  </p>
                  <p className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">
                    UniBook
                  </p>
                </div>
              </div>
              <h1 className="mt-5 text-balance text-xl font-semibold leading-snug text-white drop-shadow-sm sm:text-2xl md:text-3xl">
                Book lecturer consultations without buried emails.
              </h1>
              <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-white/95 drop-shadow sm:text-lg">
                See who is accepting appointments, request a time slot, and
                track accept or decline in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 cursor-pointer items-center rounded bg-white px-6 py-3 text-sm font-semibold text-navy no-underline transition-colors duration-150 hover:bg-select"
                >
                  Get started
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 cursor-pointer items-center rounded bg-white px-6 py-3 text-sm font-semibold text-navy no-underline transition-colors duration-150 hover:bg-select"
                >
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-b border-line bg-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="border-b border-line pb-8">
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                How it works
              </h2>
              <p className="mt-2 max-w-2xl text-base text-ink-muted">
                A simple request workflow for students and lecturers.
              </p>
            </div>

            <ol className="mt-0 divide-y divide-line">
              {[
                {
                  step: "1",
                  title: "Lecturers broadcast availability",
                  body: "Staff turn on “Accepting appointments” when they can take consultations. Students only see lecturers who are available.",
                },
                {
                  step: "2",
                  title: "Students request a slot",
                  body: "Pick a lecturer, propose a date and time, and add a short reason. The system blocks duplicate bookings for the same slot.",
                },
                {
                  step: "3",
                  title: "Accept or decline - with email notice",
                  body: "Lecturers clear pending requests. Students see Pending, Accepted, or Declined status and get an email when it changes.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="grid gap-3 py-8 sm:grid-cols-[4.5rem_1fr] sm:gap-8"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-navy text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">{item.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-paper">
          <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
            <div
              id="for-students"
              className="scroll-mt-24 border-b border-line px-4 py-14 sm:px-6 sm:py-16 lg:border-b-0 lg:border-r"
            >
              <div className="mb-4 inline-block rounded bg-section px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Students
              </div>
              <h2 className="text-2xl font-bold text-ink">
                Request time when lecturers are free
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
                Browse available lecturers, submit a request, and follow the
                status of every appointment from your dashboard.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-ink">
                <li className="flex gap-2">
                  <span className="font-bold text-navy" aria-hidden>
                    -
                  </span>
                  See only lecturers currently accepting appointments
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-navy" aria-hidden>
                    -
                  </span>
                  Track Pending, Accepted, and Declined requests
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-navy" aria-hidden>
                    -
                  </span>
                  Email notification when a decision is made
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex min-h-11 cursor-pointer items-center rounded bg-navy px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-nav-active"
              >
                Register as a student
              </Link>
            </div>

            <div
              id="for-lecturers"
              className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16"
            >
              <div className="mb-4 inline-block rounded bg-section px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Lecturers
              </div>
              <h2 className="text-2xl font-bold text-ink">
                Control availability and clear your queue
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
                One master switch tells students when you are free. Approve or
                decline requests from a single consultation desk.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-ink">
                <li className="flex gap-2">
                  <span className="font-bold text-navy" aria-hidden>
                    -
                  </span>
                  Toggle Accepting / Unavailable anytime
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-navy" aria-hidden>
                    -
                  </span>
                  Accept or decline pending requests in one click
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-navy" aria-hidden>
                    -
                  </span>
                  Students are notified automatically by email
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex min-h-11 cursor-pointer items-center rounded bg-navy px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-nav-active"
              >
                Register as a lecturer
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-navy-deep bg-navy">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6 sm:py-14">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Start booking consultations today
              </h2>
              <p className="mt-1 text-sm text-white/80 sm:text-base">
                Create an account in under a minute.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-11 cursor-pointer items-center rounded bg-white px-5 py-2.5 text-sm font-semibold text-navy no-underline hover:bg-select"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 cursor-pointer items-center rounded border-2 border-white px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy-deep">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size="sm" />
            <span className="text-white/60">
              University of Ghana appointment booking
            </span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="font-semibold text-white/80 no-underline hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="font-semibold text-white/80 no-underline hover:text-white"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
