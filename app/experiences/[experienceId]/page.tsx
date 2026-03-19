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
  const { userId } = await validateToken({ headers: await headers() });

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

  const hasAccess =
    (accessRes as any)?.data?.has_access === true ||
    (accessRes as any)?.data?.has_access === "true";

  if (!hasAccess) {
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


