import { whopsdk } from "@/lib/whop-sdk";
import { supabaseServiceClient } from "@/lib/supabase/service";
import { clearWhopAccessCache } from "./access";

/**
 * Link a Supabase user account to a Whop account using email verification
 * This is useful for users who signed up via regular signup but have a Whop subscription
 */
export async function linkWhopAccountByEmail(
  supabaseUserId: string,
  whopUserToken: string
): Promise<{
  success: boolean;
  error?: string;
  whopUserId?: string;
}> {
  try {
    // Verify the Whop token and get user data
    const userResponse = await fetch("https://api.whop.com/v5/me", {
      headers: {
        Authorization: `Bearer ${whopUserToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[linkWhopAccount] Whop API error:", userResponse.status, errorText);
      return {
        success: false,
        error: `Whop API error: ${userResponse.status}`
      };
    }

    const whopUserData = await userResponse.json();
    const whopUserId = whopUserData.id;
    const email = whopUserData.email;

    if (!email) {
      return {
        success: false,
        error: "No email returned from Whop API"
      };
    }

    // Get the user's Supabase profile to verify email matches
    const { data: profile } = await supabaseServiceClient
      .from("profiles")
      .select("email")
      .eq("id", supabaseUserId)
      .single();

    if (!profile) {
      return {
        success: false,
        error: "User profile not found"
      };
    }

    // Optional: Verify emails match (can be skipped if you trust the token)
    if (profile.email && profile.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        error: "Email does not match your account"
      };
    }

    // Update the profile with Whop user ID only
    // Tier is no longer stored in Supabase - Whop controls access directly
    const { error } = await supabaseServiceClient
      .from("profiles")
      .update({ 
        whop_user_id: whopUserId
      })
      .eq("id", supabaseUserId);

    if (error) {
      console.error("[linkWhopAccount] Supabase update error:", error);
      return {
        success: false,
        error: error.message
      };
    }

    // Clear cache for this user
    clearWhopAccessCache(whopUserId);

    console.log(`[linkWhopAccount] Successfully linked Supabase user ${supabaseUserId} to Whop user ${whopUserId}`);
    
    return {
      success: true,
      whopUserId
    };
  } catch (error) {
    console.error("[linkWhopAccount] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Check if a user's email has a Whop subscription and auto-link if possible
 * This can be called during login/signup to auto-link accounts
 */
export async function autoLinkWhopAccountByEmail(
  supabaseUserId: string,
  userEmail: string
): Promise<{
  linked: boolean;
  whopUserId?: string;
  message?: string;
}> {
  // Note: This would require additional Whop API endpoints or webhook data
  // Currently, users need to explicitly link via token
  // This is a placeholder for future implementation
  
  return {
    linked: false,
    message: "Manual linking required. Please use the link account feature."
  };
}
