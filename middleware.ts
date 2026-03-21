import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Create a response object we can pass into the Supabase client so it can
  // set / refresh auth cookies as needed when getUser() is called.
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // @supabase/ssr will call setAll to update auth cookies. We propagate
        // those onto the NextResponse so the browser receives the refreshed
        // session on this middleware pass.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // eslint-disable-next-line no-console
  console.log("[Middleware] User status:", user ? "Logged In" : "Logged Out");

  const pathname = request.nextUrl.pathname;

  // If not logged in and trying to access dashboard routes, redirect to login.
  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in but not Pro, gate dashboard behind subscription.
  if (user && pathname.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();

    if (profile?.tier !== "pro") {
      const subscribeUrl = new URL("/subscribe", request.url);
      return NextResponse.redirect(subscribeUrl);
    }
  }

  return response;
}

// Only /dashboard is protected. /experiences/* must never hit this middleware —
// Whop embeds load the app without a Supabase session; tier/login redirects would break the iframe.
export const config = {
  matcher: ["/dashboard/:path*"]
};

