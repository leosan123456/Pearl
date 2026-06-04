import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers para Stripe v22 (dahlia) ────────────────────────────────────────

// Em Stripe v22, current_period_start/end estão no SubscriptionItem, não na raiz
function getPeriodFromSub(sub: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = sub.items?.data?.[0];
  if (!item) return { start: null, end: null };
  return {
    start: item.current_period_start ? new Date(item.current_period_start * 1000) : null,
    end:   item.current_period_end   ? new Date(item.current_period_end   * 1000) : null,
  };
}

// Em Stripe v22, Invoice.subscription está em Invoice.parent.subscription_details.subscription
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as { subscription_details?: { subscription?: string | { id: string } } } | null;
  const sub = parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;
  if (!userId) return;

  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSub.items.data[0]?.price.id ?? "";
  const plan = getPlanByPriceId(priceId) ?? "personal";
  const { start, end } = getPeriodFromSub(stripeSub);

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: stripeSub.status,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: start,
      currentPeriodEnd:   end,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
      plan,
      status: stripeSub.status,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: start,
      currentPeriodEnd:   end,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const priceId = stripeSub.items.data[0]?.price.id ?? "";
  const plan = getPlanByPriceId(priceId);
  const { start, end } = getPeriodFromSub(stripeSub);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSub.id },
    data: {
      status: stripeSub.status,
      ...(plan ? { plan, stripePriceId: priceId } : {}),
      currentPeriodStart: start,
      currentPeriodEnd:   end,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSub.id },
    data: { status: "canceled", cancelAtPeriodEnd: false },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: "past_due" },
  });
}
