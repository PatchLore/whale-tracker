import { headers } from "next/headers";
import { supabaseServiceClient } from "@/lib/supabase/service";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import { whopsdk } from "@/lib/whop-sdk";
import { WHOP_EXPERIENCE_SLUG, WHOP_STORE_URL } from "@/lib/config";
import { DemoDashboard } from "@/components/DemoDashboard";

function AccessDenied() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#060501" }}
    >
      <div
        className="w-full max-w-md rounded-xl border px-6 py-8 text-center"
        style={{
          borderColor: "var(--border2)",
          backgroundColor: "rgba(0,0,0,0.6)",
          boxShadow: "0 0 40px rgba(255,179,0,0.15)",
        }}
      >
        <h1
          className="text-2xl font-bold tracking-[0.35em] uppercase"
          style={{
            color: "var(--amber)",
            fontFamily: "var(--font-orbitron)",
          }}
        >
          Access Denied
        </h1>
        <p className="mt-4 text-sm text-neutral-300">
          {"You don't have an active subscription for this app."}
        </p>
        <a
          href={WHOP_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block w-full rounded-md border px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] transition"
          style={{
            borderColor: "rgba(255,179,0,0.6)",
            backgroundImage: "linear-gradient(135deg, var(--amber), var(--amber2))",
            color: "var(--bg)",
            fontFamily: "var(--font-orbitron)",
          }}
        >
          Subscribe on Whop
        </a>
      </div>
    </div>
  );
}

function UnableToVerifySession() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#060501" }}
    >
      <div
        className="w-full max-w-md rounded-xl border px-6 py-8 text-center"
        style={{
          borderColor: "var(--border2)",
          backgroundColor: "rgba(0,0,0,0.6)",
          boxShadow: "0 0 40px rgba(255,179,0,0.15)",
        }}
      >
        <h1
          className="text-2xl font-bold tracking-[0.35em] uppercase"
          style={{
            color: "var(--amber)",
            fontFamily: "var(--font-orbitron)",
          }}
        >
          Unable to Verify Session
        </h1>
        <p className="mt-4 text-sm text-neutral-300">
          {"Please make sure you're opening this app from within Whop."}
          {" If the problem persists, try refreshing the page."}
        </p>
      </div>
    </div>
  );
}

// Map URL slugs to actual Whop experience IDs
const experienceSlugToId: Record<string, string> = {
  // Add mappings here if needed in the future
  // Example: 'slug-name': 'actual-experience-id'
};

function resolveExperienceId(slugOrId: string): string {
  // If it's already a valid experience ID format, return as-is
  // Whop experience IDs can be slugs like 'whalenet-2e' or exp_ prefixed IDs
  if (slugOrId.startsWith("exp_") || slugOrId.includes("-")) {
    return slugOrId;
  }

  // Check if it's a known slug mapping
  const mappedId = experienceSlugToId[slugOrId];
  if (mappedId) {
    return mappedId;
  }

  // Unknown format - throw error
  throw new Error(
    `Invalid experience identifier: "${slugOrId}". Must be a valid experience ID or a known slug.`
  );
}

export default async function ExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ experienceId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { experienceId: rawExperienceId } = await params;
  const { preview } = await searchParams;
  const requestHeaders = await headers();

  // Check for preview mode via URL parameter only (for screenshots)
  const isPreviewMode = preview === "true";

  // If preview mode is enabled, show the demo dashboard with mock data
  if (isPreviewMode) {
    return <DemoDashboard />;
  }

  // Resolve the actual experience ID
  let experienceId: string;
  try {
    experienceId = resolveExperienceId(rawExperienceId);
  } catch {
    return <UnableToVerifySession />;
  }

  // CRITICAL: Validate Whop token header exists
  const whopToken = requestHeaders.get("x-whop-user-token");
  if (!whopToken) {
    return <UnableToVerifySession />;
  }

  // Validate app ID exists
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  if (!appId) {
    return <UnableToVerifySession />;
  }

  try {
    const { userId } = await whopsdk.verifyUserToken(requestHeaders, {
      appId,
    });

    // Review mode: bypass access check for app reviewers
    const isReviewMode = process.env.NEXT_PUBLIC_REVIEW_MODE === "true";
    if (isReviewMode) {
      return <DashboardClient suppressAuthRedirect userId={userId} />;
    }

    // Normal access check for production
    const accessRes = await whopsdk.users.checkAccess(experienceId, {
      id: userId,
    });

    if (!accessRes.has_access) {
      return <AccessDenied />;
    }

    return <DashboardClient suppressAuthRedirect userId={userId} />;
  } catch {
    return <UnableToVerifySession />;
  }
}
