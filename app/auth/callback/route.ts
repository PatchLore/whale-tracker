import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectParam = requestUrl.searchParams.get("redirect") ?? "/dashboard";

  if (!code) {
    // Missing auth code, send back to login.
    const loginUrl = new URL("/login", requestUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createRouteHandlerClient({ cookies });

  await supabase.auth.exchangeCodeForSession(code);

  // After exchanging the code for a session, redirect to the intended destination.
  const redirectUrl = new URL(redirectParam, requestUrl.origin);
  return NextResponse.redirect(redirectUrl);
}

