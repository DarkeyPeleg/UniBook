import Link from "next/link";
import { AuthField, AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { loginUser } from "@/lib/actions";

export default function LoginPage() {
  return (
    <AuthShell
      active="login"
      title="Sign in"
      subtitle="Enter your email and password to continue."
      footer={
        <div className="space-y-3">
          <p className="text-center text-sm text-white drop-shadow">
            No account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-white underline decoration-white/60 underline-offset-2 hover:decoration-white"
              style={{ color: "#ffffff" }}
            >
              Create an account
            </Link>
          </p>

          <details className="rounded-md border border-white/25 bg-white/95 text-ink open:shadow-md">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
              Demo accounts for testing
            </summary>
            <div className="border-t border-line px-4 py-3 text-sm">
              <p className="text-ink-muted">
                Password:{" "}
                <code className="rounded bg-paper px-1.5 py-0.5 font-semibold text-ink">
                  password123
                </code>
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <span className="text-ink-muted">Student — </span>
                  <code>student@test.com</code>
                </li>
                <li>
                  <span className="text-ink-muted">Lecturer — </span>
                  <code>lecturer@test.com</code>
                </li>
                <li>
                  <span className="text-ink-muted">Admin — </span>
                  <code>admin@test.com</code>
                </li>
              </ul>
            </div>
          </details>
        </div>
      }
    >
      <AuthForm
        action={loginUser}
        submitLabel="Sign in"
        pendingLabel="Signing in…"
      >
        <AuthField
          label="Email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <AuthField
          label="Password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
        />
      </AuthForm>
    </AuthShell>
  );
}
