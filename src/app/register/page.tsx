import Link from "next/link";
import { AuthField, AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { registerUser } from "@/lib/actions";

export default function RegisterPage() {
  return (
    <AuthShell
      active="register"
      title="Create account"
      subtitle="Register to book consultations or manage lecturer availability."
      footer={
        <p className="text-center text-sm text-white drop-shadow">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-white underline decoration-white/60 underline-offset-2 hover:decoration-white"
            style={{ color: "#ffffff" }}
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthForm
        action={registerUser}
        submitLabel="Create account"
        pendingLabel="Creating account…"
      >
        <AuthField
          label="Full name"
          type="text"
          name="name"
          required
          minLength={2}
          autoComplete="name"
          placeholder="Your full name"
        />
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
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use at least 8 characters."
        />
      </AuthForm>
    </AuthShell>
  );
}
