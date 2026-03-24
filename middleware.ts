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

  console.log("[Middleware] User status:", user ? "Logged In" : "Logged Out");

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
      console.log(`[Middleware] No Whop user ID found for Supabase user ${user.id}, redirecting to subscribe`);
      const subscribeUrl = new URL("/subscribe", request.url);
      return NextResponse.redirect(subscribeUrl);
    }
    
    // Check Whop access using the Whop user ID
    // This meets the requirement: const hasAccess = await checkWhopAccess(user.id)
    // (where user.id is effectively mapped to whopUserId)
    const hasAccess = await checkWhopAccess(whopUserId);
    
    if (!hasAccess) {
      console.log(`[Middleware] Supabase user ${user.id} (Whop: ${whopUserId}) has no active subscription, redirecting to subscribe`);
      const subscribeUrl = new URL("/subscribe", request.url);
      return NextResponse.redirect(subscribeUrl);
    }

    console.log(`[Middleware] Supabase user ${user.id} (Whop: ${whopUserId}) has active subscription, allowing access`);
  }

  return response;
}

// Only /dashboard is protected. /experiences/* must never hit this middleware —
// Whop embeds load the app without a Supabase session; tier/login redirects would break the iframe.
export const config = {
  matcher: ["/dashboard/:path*"]
};
