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
    // Detailed logging before API call
    console.log("[experiences] Verifying token with:", {
      appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      hasApiKey: !!process.env.WHOP_API_KEY,
      experienceId,
    });

    const token = requestHeaders.get("x-whop-user-token");
    console.log("[experiences] Token info:", {
      hasToken: !!token,
      tokenPreview: token ? token.slice(0, 50) + "..." : null,
    });

    if (!token) {
      throw new Error("Missing x-whop-user-token");
    }

    // Try direct API call instead of SDK method
    console.log("[experiences] Attempting direct API call to Whop...");
    const verifyRes = await fetch("https://api.whop.com/api/v1/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[experiences] Whop API response status:", verifyRes.status);

    if (!verifyRes.ok) {
      const errorText = await verifyRes.text();
      console.error("[experiences] Whop API error response:", errorText);
      throw new Error(`Whop API error: ${verifyRes.status} - ${errorText}`);
    }

    const userData = await verifyRes.json();
    const userId = userData.id;
    console.log("[experiences] Successfully verified user:", userId);

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const userResponse = await fetch(`${appUrl}/api/whop/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      console.error("[experiences] Internal API failed:", userResponse.status);
      // Fallback: Use the userData we already got from Whop
      console.log("[experiences] Using direct Whop API data as fallback");
      const email = userData?.email;
      
      if (!email) {
        throw new Error("No email available from Whop API");
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

    const userJson = await userResponse.json();
    const email =
      (typeof userJson?.data?.email === "string" ? userJson.data.email : undefined) ??
      (typeof userJson?.email === "string" ? userJson.email : undefined);

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
    const token = requestHeaders.get("x-whop-user-token");
    console.error("[experiences] Debug info:", {
      tokenPreview: token ? token.slice(0, 50) + "..." : null,
      hasToken: !!token,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // JWT decode fallback (extract user ID from token payload if API calls fail)
    if (token && error instanceof Error && error.message.includes("Whop API error")) {
      console.warn("[experiences] Attempting JWT decode fallback...");
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          // Decode JWT payload (base64 decode)
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
          );
          console.log("[experiences] JWT payload decoded:", {
            sub: payload.sub,
            email: payload.email,
            hasUserId: !!payload.sub,
          });
          // Note: This is a fallback for debugging. In production, prefer direct API calls.
        }
      } catch (decodeError) {
        console.error("[experiences] JWT decode failed:", decodeError);
      }
    }
    
    return (
      <div style={{ padding: 20, color: 'white' }}>
        <h2>Unable to verify Whop session</h2>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        <p>Has token: {token ? "Yes" : "No"}</p>
      </div>
    );
  }
}
