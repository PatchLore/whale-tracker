import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkWhopAccess, getWhopUserIdForAccessCheck } from "@/lib/whop/access";

export async function middleware(request: NextRequest) {
  // Create a response object we can pass into the Supabase client
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

  const pathname = request.nextUrl.pathname;

  // If not logged in and trying to access dashboard routes, redirect to login.
  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in, check Whop access for dashboard routes
  if (user && pathname.startsWith("/dashboard")) {
    // Get Whop user ID for this Supabase user
    const whopUserId = await getWhopUserIdForAccessCheck(
      user.id,
      request.headers,
      {
        get: (name: string) => request.cookies.get(name)
      }
    );

    if (!whopUserId) {
      // No Whop user ID found - user cannot have access
      const subscribeUrl = new URL("/subscribe", request.url);
      return NextResponse.redirect(subscribeUrl);
    }

    // Check Whop access using the Whop user ID
    const hasAccess = await checkWhopAccess(whopUserId);

    if (!hasAccess) {
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
