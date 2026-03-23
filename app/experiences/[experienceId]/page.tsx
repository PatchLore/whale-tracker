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
  try {
    const { experienceId } = params;
    const requestHeaders = await headers();

    const { userId } = await whopsdk.verifyUserToken(requestHeaders);

    const accessRes = await whopsdk.users.checkAccess(experienceId, {
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
  } catch {
    return <UnableToVerifySession />;
  }
}
