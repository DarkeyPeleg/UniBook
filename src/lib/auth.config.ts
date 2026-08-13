import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

/**
 * Edge-safe Auth.js config (no Node-only imports like `pg` / bcrypt).
 * Used by middleware. Full auth with Credentials lives in auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.role = (token.role as UserRole) ?? "student";
      session.user.email = String(token.email ?? session.user.email ?? "");
      session.user.name = String(token.name ?? session.user.name ?? "");
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");
      const isProtected =
        pathname.startsWith("/student") ||
        pathname.startsWith("/lecturer") ||
        pathname.startsWith("/admin");

      if (!auth && isProtected) return false;
      if (auth && isAuthPage) return true;
      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
