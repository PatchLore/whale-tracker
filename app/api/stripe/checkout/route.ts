import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover"
    });

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { userId } = (await req.json()) as { userId?: string };
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        metadata: {
          supabaseUserId: userId
        },
        subscription_data: {
          metadata: {
            supabaseUserId: userId
          }
        },
        success_url: `${appUrl}/dashboard?upgraded=true`,
        cancel_url: `${appUrl}/dashboard`
      });

      return NextResponse.json(
        { url: checkoutSession.url },
        { status: 200 }
      );
    } catch (err: any) {
      // Log Stripe-specific errors for easier debugging
      console.error("[stripe/checkout] Stripe error:", err?.message ?? err);
      return NextResponse.json(
        { error: err?.message ?? "Stripe checkout error" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

