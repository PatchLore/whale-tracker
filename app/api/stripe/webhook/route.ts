import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const sig = headers().get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  // Single Stripe client instance used for both signature verification and any
  // follow-up subscription lookups.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover"
  });

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown webhook error";
    return NextResponse.json({ error: `Webhook signature error: ${msg}` }, { status: 400 });
  }

  try {
    // High-level logging for debugging in Vercel
    // eslint-disable-next-line no-console
    console.log("[stripe/webhook] received event:", {
      id: event.id,
      type: event.type
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseUserId = session.metadata?.supabaseUserId;

        if (supabaseUserId) {
          // Stripe integration deprecated - Whop now handles subscriptions
          // eslint-disable-next-line no-console
          console.log("[stripe/webhook] Stripe checkout completed (Whop now handles subscriptions)", {
            eventType: event.type,
            supabaseUserId
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const supabaseUserId = subscription.metadata?.supabaseUserId;

        if (supabaseUserId) {
          // Stripe integration deprecated - Whop now handles subscriptions
          // eslint-disable-next-line no-console
          console.log("[stripe/webhook] Stripe subscription deleted (Whop now handles subscriptions)", {
            eventType: event.type,
            supabaseUserId
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        let supabaseUserId: string | undefined;

        // `subscription` may be a string ID or an expanded object; it is not
        // always present on the Stripe.Invoice TypeScript type, so we access it
        // via a narrowed alias.
        const subscriptionField = (invoice as any)
          .subscription as string | Stripe.Subscription | null | undefined;

        // Handle the case where subscription is just an ID (string)
        if (typeof subscriptionField === "string") {
          const subscription = await stripe.subscriptions.retrieve(subscriptionField);
          supabaseUserId = subscription.metadata?.supabaseUserId;
        } else if (subscriptionField) {
          // In case it was already expanded (unlikely in webhooks, but safe)
          supabaseUserId = (subscriptionField as Stripe.Subscription).metadata
            ?.supabaseUserId;
        }

        if (supabaseUserId) {
          // Stripe integration deprecated - Whop now handles subscriptions
          // eslint-disable-next-line no-console
          console.log("[stripe/webhook] Stripe payment failed (Whop now handles subscriptions)", {
            supabaseUserId
          });
        }
        break;
      }
      default:
        // eslint-disable-next-line no-console
        console.log("[stripe/webhook] unhandled event type", { type: event.type });
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[stripe/webhook] handler error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

