export type UserRole = "student" | "lecturer" | "admin";

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveRoleForEmail(email: string): UserRole {
  const normalized = email.toLowerCase();
  if (parseList(process.env.ADMIN_EMAILS).includes(normalized)) return "admin";
  if (parseList(process.env.LECTURER_EMAILS).includes(normalized))
    return "lecturer";
  return "student";
}

export function homePathForRole(role: UserRole): string {
  if (role === "lecturer") return "/lecturer";
  if (role === "admin") return "/admin";
  return "/student";
}
