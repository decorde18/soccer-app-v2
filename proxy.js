// proxy.js (Next.js 16)
import { NextResponse } from "next/server";

export function proxy(request) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes do NOT require auth
  const isPublicRoute =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/clubs");

  const isAuthRoute = pathname.startsWith("/auth");
  const isRoot = pathname === "/";

  // Root → dashboard
  if (isRoot) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // No token → allow public routes, block protected routes
  if (!token) {
    if (isPublicRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Has token → redirect auth pages to dashboard
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// matcher works the same as before
export const config = {
  matcher: ["/((?!_next|static|favicon.ico|api|.*\\..*).)*"],
};
