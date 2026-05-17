import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes accessible without authentication
const PUBLIC_PATHS = ["/", "/landing", "/login", "/register"];

// Role-based protected routes
const SOLVER_PATHS = ["/solver"];
const SEEKER_PATHS = ["/seeker"];
const ADMIN_PATHS = ["/admin"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getHomePathForRole(role: string | undefined): string {
  switch (role) {
    case "SOLVER":
      return "/solver/dashboard";
    case "SEEKER":
      return "/seeker/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/landing";
  }
}

function isAuthorizedForPath(pathname: string, role: string | undefined): boolean {
  if (!role) return false;

  // Check if user is accessing the correct role-based path
  if (ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return role === "ADMIN";
  }
  if (SOLVER_PATHS.some((path) => pathname.startsWith(path))) {
    return role === "SOLVER";
  }
  if (SEEKER_PATHS.some((path) => pathname.startsWith(path))) {
    return role === "SEEKER";
  }

  // Allow access to dashboard - will be handled by role redirect
  if (pathname === "/dashboard") {
    return true;
  }

  return true; // Allow other authenticated routes
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  const role = req.cookies.get("userRole")?.value;
  const pathname = req.nextUrl.pathname;

  const isAuthenticated = !!token;
  const isPublic = isPublicPath(pathname);

  // Redirect unauthenticated users to landing page
  if (!isAuthenticated && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from public auth pages
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    const url = req.nextUrl.clone();
    url.pathname = getHomePathForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from root/landing to their dashboard
  if (isAuthenticated && (pathname === "/" || pathname === "/landing")) {
    const url = req.nextUrl.clone();
    url.pathname = getHomePathForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Redirect /dashboard to role-specific dashboard
  if (isAuthenticated && pathname === "/dashboard") {
    const url = req.nextUrl.clone();
    url.pathname = getHomePathForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Check role-based authorization
  if (isAuthenticated && !isPublic && !isAuthorizedForPath(pathname, role)) {
    const url = req.nextUrl.clone();
    url.pathname = getHomePathForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/public).*)",
  ],
};
