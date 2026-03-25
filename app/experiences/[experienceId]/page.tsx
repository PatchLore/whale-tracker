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

// Map URL slugs to actual Whop experience IDs (exp_xxx)
const experienceSlugToId: Record<string, string> = {
  'whalenet-2e': process.env.NEXT_PUBLIC_EXPERIENCE_ID || 'exp_YOUR_ID_HERE',
  // Add more mappings as needed
};

function resolveExperienceId(slugOrId: string): string {
  // If it's already an exp_ ID, return as-is
  if (slugOrId.startsWith('exp_')) {
    return slugOrId;
  }
  
  // Check if it's a known slug
  const mappedId = experienceSlugToId[slugOrId];
  if (mappedId) {
    console.log(`[ExperiencePage] Mapped slug "${slugOrId}" to ID "${mappedId}"`);
    return mappedId;
  }
  
  // Unknown format - throw error
  throw new Error(`Invalid experience identifier: "${slugOrId}". Must be an exp_ ID or a known slug.`);
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId: rawExperienceId } = await params;
  const requestHeaders = await headers();
  
  // Resolve the actual experience ID
  let experienceId: string;
  try {
    experienceId = resolveExperienceId(rawExperienceId);
  } catch (error) {
    console.error("[ExperiencePage] Invalid experience ID:", {
      rawId: rawExperienceId,
      error: error instanceof Error ? error.message : error,
    });
    return <UnableToVerifySession />;
  }
  
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
