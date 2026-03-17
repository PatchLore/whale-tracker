import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WhopEventType = "membership.went_valid" | "membership.went_invalid";

type WhopWebhookPayload = {
  type: WhopEventType;
  data?: {
    user?: {
      email?: string;
    };
    customer?: {
      email?: string;
    };
    email?: string;
  };
};

function getEmailFromPayload(payload: WhopWebhookPayload): string | null {
  return (
    payload.data?.user?.email ??
    payload.data?.customer?.email ??
    payload.data?.email ??
    null
  );
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody, "utf8");
    const expected = hmac.digest("hex");
    // Use constant-time comparison to avoid timing attacks
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "WHOP_WEBHOOK_SECRET not configured" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-whop-signature");

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: WhopWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhopWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const email = getEmailFromPayload(payload);
  if (!email) {
    return NextResponse.json({ error: "Email not found in payload" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const eventType = payload.type;
  if (eventType === "membership.went_valid") {
    const { error } = await supabase
      .from("profiles")
      .update({ tier: "pro" })
      .eq("email", email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (eventType === "membership.went_invalid") {
    const { error } = await supabase
      .from("profiles")
      .update({ tier: "free" })
      .eq("email", email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

