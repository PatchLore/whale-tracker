import { headers } from "next/headers";
import { supabaseServiceClient } from "@/lib/supabase/service";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import { whopsdk } from "@/lib/whop-sdk";

type ExperiencePageProps = {
  params: {
    experienceId: string;
  };
};

function AccessDenied() {
  return <div>Access denied</div>;
}

function UnableToVerifySession() {
  return <div>Unable to verify Whop session</div>;
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { experienceId } = params;
  const requestHeaders = await headers();

  try {
    // Get token from headers
    const token = requestHeaders.get("x-whop-user-token");
    
    console.log("[experiences] Verifying token with:", {
      appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      hasApiKey: !!process.env.WHOP_API_KEY,
      experienceId,
      hasToken: !!token,
    });

    if (!token) {
      throw new Error("Missing x-whop-user-token");
    }

    // Call backend route to verify user with Whop API v5
    console.log("[experiences] Calling backend /api/whop/user route...");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const userResponse = await fetch(`${appUrl}/api/whop/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[experiences] Backend API failed:", userResponse.status, errorText);
      throw new Error(`Failed to verify user: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const userId = userData.id;
    const email = userData?.email;
    
    console.log("[experiences] User verified successfully:", { userId, hasEmail: !!email });

    if (!email) {
      throw new Error("No email returned from Whop API");
    }

    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    if (!companyId) {
      throw new Error("Missing NEXT_PUBLIC_WHOP_COMPANY_ID environment variable");
    }

    // Check access to the company
    const accessRes = await whopsdk.users.checkAccess(companyId, {
      id: userId
    });

    if (!accessRes.has_access) {
      console.warn("[experiences] User does not have access to company", { userId, companyId });
      return <AccessDenied />;
    }

    const { data: existingProfile } = await supabaseServiceClient
      .from("profiles")
      .select("id, tier")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.id && existingProfile.tier !== "pro") {
      await supabaseServiceClient
        .from("profiles")
        .update({ tier: "pro" })
        .eq("id", existingProfile.id);
    }

    return (
      <DashboardClient
        suppressAuthRedirect
        userId={existingProfile?.id}
      />
    );
  } catch (error) {
    console.error("[experiences] Error:", error);
    const token = requestHeaders.get("x-whop-user-token");
    console.error("[experiences] Debug info:", {
      token: token ? token.slice(0, 50) + "..." : null,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    
    return (
      <div style={{ padding: 20, color: 'white' }}>
        <h2>Unable to verify Whop session</h2>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
}
