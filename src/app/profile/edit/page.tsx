import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { auth } from "@/lib/auth";
import { getCurrentUserProfile, updateProfile } from "@/lib/actions";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  return (
    <AppShell user={session.user} active="profile">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Edit profile
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink-muted">
              Update your name, email, or password.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink no-underline hover:bg-select"
          >
            Back to profile
          </Link>
        </div>

        <section className="overflow-hidden rounded-md border border-line bg-surface">
          <div
            className="bg-section px-4 py-2.5 text-sm font-bold text-white"
            style={{ color: "#ffffff" }}
          >
            Your details
          </div>
          <div className="p-5 sm:p-6">
            <ProfileEditForm
              action={updateProfile}
              defaultName={profile.name}
              defaultEmail={profile.email}
            />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
