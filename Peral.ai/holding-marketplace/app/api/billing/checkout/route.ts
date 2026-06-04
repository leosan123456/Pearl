import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, BILLING_PLANS, type PlanId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const planId = body.plan as PlanId;

  if (!planId || !BILLING_PLANS[planId]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = BILLING_PLANS[planId];

  if (!plan.priceId || plan.priceId === "price_...") {
    return NextResponse.json(
      { error: "Plano não configurado. Adicione STRIPE_PRICE_*_BRL no .env" },
      { status: 503 }
    );
  }

  // Reutilizar ou criar Stripe Customer
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card", "pix"],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: plan.trialDays,
      metadata: { userId, plan: planId },
    },
    metadata: { userId, plan: planId },
    success_url: `${baseUrl}/dashboard/billing?success=1&plan=${planId}`,
    cancel_url:  `${baseUrl}/dashboard/billing?canceled=1`,
    locale: "pt-BR",
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
