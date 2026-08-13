import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { homePathForRole, type UserRole } from "@/lib/roles";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role as UserRole | undefined;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtected =
    pathname.startsWith("/student") ||
    pathname.startsWith("/lecturer") ||
    pathname.startsWith("/admin");

  if (!session && isProtected) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(
      new URL(homePathForRole(role ?? "student"), req.nextUrl.origin),
    );
  }

  if (session && pathname.startsWith("/lecturer") && role === "student") {
    return NextResponse.redirect(new URL("/student", req.nextUrl.origin));
  }

  if (
    session &&
    pathname.startsWith("/student") &&
    role === "lecturer"
  ) {
    return NextResponse.redirect(new URL("/lecturer", req.nextUrl.origin));
  }

  if (session && pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(
      new URL(homePathForRole(role ?? "student"), req.nextUrl.origin),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/student/:path*",
    "/lecturer/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
