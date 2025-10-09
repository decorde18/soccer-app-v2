import { NextResponse } from "next/server";

export function middleware(req) {
  const token = "fakeTOekn"; // adjust to your real cookie name
  // const token = req.cookies.get("session"); // adjust to your real cookie name
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/auth");
  const isRoot = pathname === "/";

  // 1️⃣ If no token → allow auth pages, otherwise force login
  if (!token) {
    if (!isAuthPage) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    return NextResponse.next(); // allow staying on /auth/*
  }

  // 2️⃣ If token but on /auth/* → redirect to dashboard
  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3️⃣ If root → send to dashboard
  if (isRoot) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4️⃣ Otherwise → allow route (or you can redirect invalids to dashboard)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico).*)", // exclude _next, static files, and favicon
  ],
};
