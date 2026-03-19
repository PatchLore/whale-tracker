import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateToken, WhopAPI } from "@whop-apps/sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ExperiencePageProps = {
  params: {
    experienceId: string;
  };
};

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const headersList = headers();

  try {
    // Validate the Whop user token from cookies/headers
    await validateToken({ headers: headersList });
  } catch {
    // If the token is invalid or missing, just send them to the homepage.
    redirect("/");
  }

  // Fetch the current Whop user (including email) using the SDK
  const meResponse = await WhopAPI.me({ headers: headersList }).GET("/me", {});
  const email = meResponse.data?.email;

  if (!email) {
    redirect("/");
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
  // Send them straight into the dashboard experience.
  redirect("/dashboard");
}

