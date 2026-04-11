import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message ?? "").trim();
    const userId = String(body?.userId ?? "").trim();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required." },
        { status: 400 }
      );
    }

    const companyId = process.env.WHOP_COMPANY_ID ?? process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    if (!companyId) {
      return NextResponse.json(
        {
          error:
            "WHOP_COMPANY_ID or NEXT_PUBLIC_WHOP_COMPANY_ID is not configured. This is required to create a support channel."
        },
        { status: 500 }
      );
    }

    const supportChannel = await whopsdk.supportChannels.create({
      company_id: companyId,
      user_id: userId
    });

    const sentMessage = await whopsdk.messages.create({
      channel_id: supportChannel.id,
      content: message
    });

    return NextResponse.json({
      success: true,
      messageId: sentMessage.id,
      channelId: supportChannel.id
    });
  } catch (error) {
    console.error("[Support API] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send support message."
      },
      { status: 500 }
    );
  }
}
