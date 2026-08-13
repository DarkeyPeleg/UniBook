import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { auth } from "@/lib/auth";
import { getCurrentUserProfile } from "@/lib/actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [profile, params] = await Promise.all([
    getCurrentUserProfile(),
    searchParams,
  ]);

  if (!profile) redirect("/login");

  return (
    <AppShell user={session.user} active="profile">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Profile
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink-muted">
              Your account details for UniBook.
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-nav-active"
            style={{ color: "#ffffff" }}
          >
            Edit profile
          </Link>
        </div>

        {params.updated === "1" ? (
          <p
            className="mb-6 rounded-md border border-accepted/25 bg-[#e8f5e9] px-4 py-3 text-sm font-semibold text-accepted"
            role="status"
          >
            Profile updated.
          </p>
        ) : null}

        <section className="overflow-hidden rounded-md border border-line bg-surface">
          <div
            className="bg-section px-4 py-2.5 text-sm font-bold text-white"
            style={{ color: "#ffffff" }}
          >
            Account
          </div>
          <dl className="divide-y divide-line">
            <ProfileRow label="Full name" value={profile.name} />
            <ProfileRow label="Email" value={profile.email} />
            <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <dt className="text-sm font-semibold text-ink-muted">Role</dt>
              <dd>
                <StatusBadge status={profile.role} />
              </dd>
            </div>
            {profile.role === "lecturer" ? (
              <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <dt className="text-sm font-semibold text-ink-muted">
                  Booking status
                </dt>
                <dd>
                  <StatusBadge
                    status={profile.availabilityStatus}
                    label={
                      profile.availabilityStatus === "available"
                        ? "Accepting appointments"
                        : "Unavailable"
                    }
                  />
                </dd>
              </div>
            ) : null}
            <ProfileRow
              label="Member since"
              value={profile.createdAt.toLocaleDateString("en-GH", {
                dateStyle: "long",
              })}
            />
          </dl>
        </section>
      </main>
    </AppShell>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <dt className="text-sm font-semibold text-ink-muted">{label}</dt>
      <dd className="text-sm font-bold text-ink sm:text-right">{value}</dd>
    </div>
  );
}
