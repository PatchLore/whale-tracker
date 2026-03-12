import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServiceClient } from "@/lib/supabase/service";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20"
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const sig = headers().get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown webhook error";
    return NextResponse.json({ error: `Webhook signature error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseUserId = session.metadata?.supabaseUserId;

        if (supabaseUserId) {
          await supabaseServiceClient
            .from("profiles")
            .update({ tier: "pro" })
            .eq("id", supabaseUserId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const supabaseUserId = subscription.metadata?.supabaseUserId;

        if (supabaseUserId) {
          await supabaseServiceClient
            .from("profiles")
            .update({ tier: "free" })
            .eq("id", supabaseUserId);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

