import { NextRequest, NextResponse } from "next/server";
import { WhopServerSdk } from "@whop/api";

const apiKey = process.env.WHOP_API_KEY;
const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
if (!apiKey || !appId) {
  throw new Error(`Missing WHOP_API_KEY (${apiKey ? "set" : "missing"}) or NEXT_PUBLIC_WHOP_APP_ID (${appId ? "set" : "missing"})`);
}

const whop = WhopServerSdk({
  appApiKey: apiKey,
  appId,
});

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const user = await whop.users.getCurrentUser({}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!user) {
      return NextResponse.json({ error: "No user data" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("[api/whop/user] error", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
