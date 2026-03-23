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
    const { userId } = await whopsdk.verifyUserToken(requestHeaders);

    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    if (!companyId) {
      throw new Error("Missing NEXT_PUBLIC_WHOP_COMPANY_ID environment variable");
    }

    const accessRes = await whopsdk.users.checkAccess(companyId, {
      id: userId
    });

    if (!accessRes.has_access) {
      return <AccessDenied />;
    }

    const meResponse = (await whopsdk.get("/me", {
      headers: requestHeaders
    })) as Record<string, unknown> & { data?: { email?: string } };
    const email =
      (typeof meResponse?.email === "string" ? meResponse.email : undefined) ??
      meResponse?.data?.email;

    if (!email) {
      throw new Error("No email");
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
    console.error("[experiences] Headers:", {
      token: requestHeaders.get("x-whop-user-token")?.slice(0, 20) + "...",
      hasToken: !!requestHeaders.get("x-whop-user-token"),
    });
    
    return (
      <div style={{ padding: 20, color: 'white' }}>
        <h2>Unable to verify Whop session</h2>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        <p>Has token: {requestHeaders.get("x-whop-user-token") ? "Yes" : "No"}</p>
      </div>
    );
  }
}
