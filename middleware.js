// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;

  // ✅ Public routes - no auth required
  const isPublicRoute =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/teams") || // ✅ ADD THIS - teams are public viewable
    pathname.startsWith("/clubs"); // ✅ ADD THIS - clubs are public viewable

  const isAuthRoute = pathname.startsWith("/auth");
  const isRoot = pathname === "/";

  // Root redirects to dashboard /landing page
  if (isRoot) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // No token - allow public routes, block protected routes
  if (!token) {
    if (isPublicRoute) {
      return NextResponse.next(); // ✅ Allow without auth
    }
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Has token - redirect auth pages to dashboard
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|api|.*\\..*).)*"],
};
