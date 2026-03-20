import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import { whopsdk } from "@/lib/whop-sdk";

type ExperiencePageProps = {
  params: {
    experienceId: string;
  };
};

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { experienceId } = params;

  // Validate Whop user token using documented validateToken helper
  let userId: string = "guest";
  const requestHeaders = await headers();
  try {
    ({ userId } = await whopsdk.verifyUserToken(requestHeaders));
  } catch {
    // Non-Whop context (or token missing) — render dashboard anyway for testing.
    return <DashboardClient userId="guest" />;
  }

  // Check access via Whop API (keep loose typing to avoid SDK version drift issues)
  const accessRes = await whopsdk.users.checkAccess(experienceId, {
    id: userId
  });
  const access = {
    has_access: accessRes.has_access,
    access_level: accessRes.access_level
  };

  if (!access.has_access && access.access_level !== "admin") {
    return <div>Access denied</div>;
  }

  // Fetch the current Whop user (including email) using the SDK
  const meResponse = (await whopsdk.get("/me", {
    headers: requestHeaders
  })) as any;
  const email = meResponse?.email ?? meResponse?.data?.email;

  if (!email) {
    return <div>Access denied</div>;
  }

  const supabase = createServerSupabaseClient();

  // Ensure there is a profile row for this email and that it is marked as pro.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, tier")
    .eq("email", email)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from("profiles").insert({
      email,
      tier: "pro"
    });
  } else if (existingProfile.tier !== "pro") {
    await supabase
      .from("profiles")
      .update({ tier: "pro" })
      .eq("id", existingProfile.id);
  }

  // At this point, the user is validated via Whop and has a pro profile.
  // Render the dashboard directly inside the Whop experience.
  return <DashboardClient />;
}


