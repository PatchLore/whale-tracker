import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !session) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set(
      "redirect",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"]
};

