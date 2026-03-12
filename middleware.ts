import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  // Supabase sets an access token cookie; if it's missing, treat user as unauthenticated.
  const hasSessionCookie =
    !!req.cookies.get("sb-access-token") || !!req.cookies.get("sb-refresh-token");

  if (isDashboardRoute && !hasSessionCookie) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set(
      "redirect",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};

