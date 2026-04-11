import { NextRequest, NextResponse } from "next/server";

const WHOP_API_BASE = "https://api.whop.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.WHOP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "WHOP_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const channelId =
      process.env.WHOP_SUPPORT_CHANNEL_ID ||
      process.env.NEXT_PUBLIC_WHOP_APP_ID;

    if (!channelId) {
      return NextResponse.json(
        {
          error:
            "Support channel ID is not configured. Set WHOP_SUPPORT_CHANNEL_ID or NEXT_PUBLIC_WHOP_APP_ID."
        },
        { status: 500 }
      );
    }

    const response = await fetch(`${WHOP_API_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        channel_id: channelId,
        content: message
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.text();
      return NextResponse.json(
        { error: `Whop API error: ${response.status}`, details: payload },
        { status: response.status }
      );
    }

    const payload = await response.json();
    return NextResponse.json({ ok: true, message: payload });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error while sending support message."
      },
      { status: 500 }
    );
  }
}
