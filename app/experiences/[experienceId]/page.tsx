import { headers } from "next/headers";
import { WhopAPI } from "@whop-apps/sdk";
import { whopsdk } from "@/lib/whop-sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/app/dashboard/DashboardClient";

type ExperiencePageProps = {
  params: {
    experienceId: string;
  };
};

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { experienceId } = params;

  // Validate Whop user token and access using the documented pattern
  const { userId } = await whopsdk.verifyUserToken(await headers());

  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (!access.has_access) {
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


