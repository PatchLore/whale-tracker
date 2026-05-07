import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest) {
  try {
    console.log("[Support API] Received support request");

    const body = await request.json();
    const message = String(body?.message ?? "").trim();
    const userId = String(body?.userId ?? "").trim();

    if (!message || !userId) {
      console.warn("[Support API] Missing required fields", { message: !!message, userId: !!userId });
      return NextResponse.json(
        { error: "Message and userId are required." },
        { status: 400 }
      );
    }

    // Runtime validation - ENSURE we never proceed without valid config
    const companyId = process.env.WHOP_COMPANY_ID ?? process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    if (!companyId) {
      console.error("[Support API] FATAL: WHOP_COMPANY_ID is NOT configured");
      throw new Error("Support system is not properly configured. Please contact administrator.");
    }

    console.log("[Support API] Creating support channel for user:", userId);
    const supportChannel = await whopsdk.supportChannels.create({
      company_id: companyId,
      user_id: userId
    });

    console.log("[Support API] Created support channel:", supportChannel.id);

    const sentMessage = await whopsdk.messages.create({
      channel_id: supportChannel.id,
      content: message
    });

    console.log("[Support API] Successfully sent support message:", sentMessage.id);

    return NextResponse.json({
      success: true,
      messageId: sentMessage.id,
      channelId: supportChannel.id
    });
  } catch (error) {
    console.error("[Support API] Failed to process support request:", error);
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
