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
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-sm"
      style={{ color: "var(--muted)", fontFamily: "var(--font-plex-mono)" }}
    >
      Access denied
    </div>
  );
}

function UnableToVerifySession() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-sm"
      style={{ color: "var(--muted)", fontFamily: "var(--font-plex-mono)" }}
    >
      Unable to verify Whop session
    </div>
  );
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { experienceId } = params;
  const requestHeaders = await headers();

  let userId: string;
  try {
    ({ userId } = await whopsdk.verifyUserToken(requestHeaders));
  } catch {
    return <UnableToVerifySession />;
  }

  let accessRes: { has_access: boolean; access_level: string };
  try {
    accessRes = await whopsdk.users.checkAccess(experienceId, {
      id: userId
    });
  } catch {
    return <UnableToVerifySession />;
  }

  const hasAccess = accessRes.has_access;
  const accessLevel = accessRes.access_level;
  if (!hasAccess && accessLevel !== "admin") {
    return <AccessDenied />;
  }

  let email: string | undefined;
  try {
    const meResponse = (await whopsdk.get("/me", {
      headers: requestHeaders
    })) as Record<string, unknown> & { data?: { email?: string } };
    email =
      (typeof meResponse?.email === "string" ? meResponse.email : undefined) ??
      meResponse?.data?.email;
  } catch {
    return <UnableToVerifySession />;
  }

  if (!email) {
    return <UnableToVerifySession />;
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
}
