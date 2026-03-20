import { headers } from "next/headers";
import { validateToken, WhopAPI } from "@whop-apps/sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/app/dashboard/DashboardClient";

type ExperiencePageProps = {
  params: {
    experienceId: string;
  };
};

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { experienceId } = params;

  // Validate Whop user token using documented validateToken helper
  let userId: string = "guest";
  try {
    ({ userId } = await validateToken({ headers: await headers() }));
  } catch {
    // Non-Whop context (or token missing) — render dashboard anyway for testing.
    return <DashboardClient userId="guest" />;
  }

  // Check access via Whop API (keep loose typing to avoid SDK version drift issues)
  const accessRes = await WhopAPI.app({
    apiKey: process.env.WHOP_API_KEY!
  }).GET("/apps/experiences/{experience_id}/access/{user_id}" as any, {
    params: {
      path: {
        experience_id: experienceId,
        user_id: userId
      }
    }
  } as any);

  const accessData = (accessRes as any)?.data ?? {};
  const access = {
    has_access:
      accessData?.has_access === true || accessData?.has_access === "true",
    access_level: accessData?.access_level
  };

  if (!access.has_access && access.access_level !== "admin") {
    return <div>Access denied</div>;
  }

  // Fetch the current Whop user (including email) using the SDK
  const meResponse = await WhopAPI.me({ headers }).GET("/me", {});
  const email = meResponse.data?.email;

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


