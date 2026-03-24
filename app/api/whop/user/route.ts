import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      console.warn("[api/whop/user] No authorization token provided");
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    console.log("[api/whop/user] Fetching user from Whop API v5...");
    
    const res = await fetch("https://api.whop.com/v5/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    console.log("[api/whop/user] Whop API response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[api/whop/user] Whop API error:", res.status, errorText);
      return NextResponse.json(
        { error: `Whop API error: ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    const user = await res.json();
    console.log("[api/whop/user] Successfully fetched user:", user.id);

    return NextResponse.json(user);
  } catch (err) {
    console.error("[api/whop/user] error", err);
    return NextResponse.json(
      { error: "Failed to fetch user", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
