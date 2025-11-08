// middleware.js - Convention-based with route groups
import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;

  // Check if route is in (public) folder - these routes are accessible without auth
  const isPublicRoute =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/pricing");

  const isAuthRoute = pathname.startsWith("/auth");
  const isRoot = pathname === "/";

  // 1️⃣ No token - allow public routes, block everything else
  if (!token) {
    if (isPublicRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/public/auth/login", req.url));
  }

  // 2️⃣ Has token - redirect auth pages to dashboard
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3️⃣ Has token on root - redirect to dashboard
  if (isRoot) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4️⃣ All other routes with token - allow (protected by default)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|api|.*\\..*).)*"],
};
