import { headers } from "next/headers";
import { supabaseServiceClient } from "@/lib/supabase/service";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import { whopsdk } from "@/lib/whop-sdk";

function AccessDenied() {
  return <div>Access denied</div>;
}

function UnableToVerifySession() {
  return <div>Unable to verify Whop session</div>;
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const requestHeaders = await headers();

  // CRITICAL: Validate Whop token header exists
  const whopToken = requestHeaders.get("x-whop-user-token");
  if (!whopToken) {
    console.error("[ExperiencePage] Missing x-whop-user-token header");
    console.error("[ExperiencePage] All headers:", Object.fromEntries(requestHeaders.entries()));
    return <UnableToVerifySession />;
  }

  // Validate app ID exists
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  if (!appId) {
    console.error("[ExperiencePage] NEXT_PUBLIC_WHOP_APP_ID is not set");
    return <UnableToVerifySession />;
  }

  try {
    const { userId } = await whopsdk.verifyUserToken(requestHeaders, {
      appId: appId,
    });

    const accessRes = await whopsdk.users.checkAccess(experienceId, {
      id: userId,
    });

    if (!accessRes.has_access) {
      return <AccessDenied />;
    }

    return (
      <DashboardClient
        suppressAuthRedirect
        userId={userId}
      />
    );
  } catch (error) {
    // Detailed error logging for diagnosis
    console.error("[ExperiencePage] Token verification failed:", {
      error: error instanceof Error ? error.message : error,
      hasToken: !!whopToken,
      tokenPrefix: whopToken?.substring(0, 20),
      appIdConfigured: !!appId,
    });
    return <UnableToVerifySession />;
  }
}
