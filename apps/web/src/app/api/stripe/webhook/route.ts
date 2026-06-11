import {
  clearSubscriptionForUser,
  syncCheckoutSessionToProfile,
  syncSubscriptionToProfile,
} from "@/lib/billing/sync-subscription";
import { getStripe, resolveSubscriptionUserId, retrieveSubscriptionForSync } from "@/lib/billing/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await syncCheckoutSessionToProfile(session, stripe);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const expanded = await retrieveSubscriptionForSync(
          stripe,
          subscription.id
        );
        await syncSubscriptionToProfile(expanded, { stripe });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata.user_id ??
          (await resolveSubscriptionUserId(subscription, stripe));
        if (userId) {
          await clearSubscriptionForUser(userId);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed.";
    console.error("[stripe webhook]", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
