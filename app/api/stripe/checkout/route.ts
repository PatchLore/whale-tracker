import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRO_PRICE_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!stripeSecretKey) {
  // eslint-disable-next-line no-console
  console.warn("STRIPE_SECRET_KEY is not set. Stripe checkout will not work.");
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-02-25.clover"
    })
  : null;

export async function POST() {
  try {
    if (!stripe || !priceId) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = session.user;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      customer_email: user.email ?? undefined,
      metadata: {
        supabaseUserId: user.id
      },
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/dashboard`
    });

    return NextResponse.json(
      { url: checkoutSession.url },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

