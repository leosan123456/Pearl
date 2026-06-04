import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { grantQuota, purchaseTokens, type TokenType, type PackageSize } from "@/lib/tokens";
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
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(pi);
        break;
      }
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers Stripe v22 (dahlia) ──────────────────────────────────────────────

function getPeriodFromSub(sub: Stripe.Subscription): { start: Date | null; end: Date | null } {
  const item = sub.items?.data?.[0];
  if (!item) return { start: null, end: null };
  return {
    start: item.current_period_start ? new Date(item.current_period_start * 1000) : null,
    end:   item.current_period_end   ? new Date(item.current_period_end   * 1000) : null,
  };
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as { subscription_details?: { subscription?: string | { id: string } } } | null;
  const sub = parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function getCustomerIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const c = invoice.customer;
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
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

  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId, plan, status: stripeSub.status,
      stripeSubscriptionId: subscriptionId, stripePriceId: priceId,
      currentPeriodStart: start, currentPeriodEnd: end,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
      plan, status: stripeSub.status,
      stripeSubscriptionId: subscriptionId, stripePriceId: priceId,
      currentPeriodStart: start, currentPeriodEnd: end,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });

  // Conceder cota inicial de tokens
  await grantQuota(userId, plan);
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
      currentPeriodStart: start, currentPeriodEnd: end,
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

// Renovação mensal → repor cota de tokens
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const customerId = getCustomerIdFromInvoice(invoice);
  if (!customerId) return;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    select: { plan: true },
  });
  if (!subscription) return;

  await grantQuota(user.id, subscription.plan);
}

// Auto-recarga: PaymentIntent criado por triggerAutoRechargeIfNeeded
async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const { userId, tokenType, packageSize, autoRecharge } = pi.metadata ?? {};
  if (!autoRecharge || !userId || !tokenType || !packageSize) return;

  // purchaseTokens já foi chamado dentro de triggerAutoRechargeIfNeeded ao confirmar
  // Este handler é para casos onde o confirm foi assíncrono
  const existing = await prisma.tokenTransaction.findFirst({
    where: { referenceId: pi.id, userId },
  });
  if (existing) return; // já processado

  await purchaseTokens(userId, tokenType as TokenType, packageSize as PackageSize, pi.id);
}
