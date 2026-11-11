import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/employees",
  "/attendance",
  "/leaves",
  "/timesheets",
  "/onboarding",
  "/training",
  "/performance",
  "/departments",
];

/**
 * Next.js Edge Middleware for Server-Side Route Protection.
 * Inspects HttpOnly Session Cookies ('access_token', 'refresh_token')
 * to eliminate Flash of Unauthenticated Content (FOUC).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasAccessToken = Boolean(request.cookies.get("access_token")?.value);
  const hasRefreshToken = Boolean(request.cookies.get("refresh_token")?.value);
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  const isProtectedPath = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 1. Root path "/" -> Redirect based on authentication state
  if (pathname === "/") {
    const targetUrl = new URL(
      isAuthenticated ? "/employees" : "/login",
      request.url
    );
    return NextResponse.redirect(targetUrl);
  }

  // 2. Unauthenticated user accessing protected page -> Redirect directly to /login
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated user accessing /login -> Redirect directly to /dashboard
  if (pathname === "/login" && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/employees/:path*",
    "/attendance/:path*",
    "/leaves/:path*",
    "/timesheets/:path*",
    "/onboarding/:path*",
    "/training/:path*",
    "/performance/:path*",
    "/departments/:path*",
    "/login",
  ],
};

