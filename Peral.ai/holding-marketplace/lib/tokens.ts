import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// ─── Re-exportar tipos/constantes client-safe de token-types ─────────────────
export type { TokenType, PackageSize, PlanKey } from "@/lib/token-types";
export { TOKEN_TYPES, TOKEN_LABELS, PLAN_QUOTAS, TOKEN_PACKAGES_META } from "@/lib/token-types";

import type { TokenType, PackageSize, PlanKey } from "@/lib/token-types";
import { TOKEN_TYPES, TOKEN_LABELS, PLAN_QUOTAS } from "@/lib/token-types";

// ─── Pacotes avulsos ──────────────────────────────────────────────────────────
export const TOKEN_PACKAGES: Record<TokenType, Record<PackageSize, { qty: number; priceBrl: number; label: string; priceId: string }>> = {
  ai_analysis: {
    small:  { qty: 10,  priceBrl: 19,  label: "10 análises",  priceId: process.env.STRIPE_PRICE_AI_SMALL  ?? "" },
    medium: { qty: 30,  priceBrl: 49,  label: "30 análises",  priceId: process.env.STRIPE_PRICE_AI_MEDIUM ?? "" },
    large:  { qty: 100, priceBrl: 129, label: "100 análises", priceId: process.env.STRIPE_PRICE_AI_LARGE  ?? "" },
  },
  intel_session: {
    small:  { qty: 5,  priceBrl: 15, label: "5 sessões",   priceId: process.env.STRIPE_PRICE_INTEL_SMALL  ?? "" },
    medium: { qty: 15, priceBrl: 39, label: "15 sessões",  priceId: process.env.STRIPE_PRICE_INTEL_MEDIUM ?? "" },
    large:  { qty: 50, priceBrl: 99, label: "50 sessões",  priceId: process.env.STRIPE_PRICE_INTEL_LARGE  ?? "" },
  },
  forecast: {
    small:  { qty: 5,  priceBrl: 9,  label: "5 forecasts",  priceId: process.env.STRIPE_PRICE_FORECAST_SMALL  ?? "" },
    medium: { qty: 20, priceBrl: 29, label: "20 forecasts", priceId: process.env.STRIPE_PRICE_FORECAST_MEDIUM ?? "" },
    large:  { qty: 60, priceBrl: 69, label: "60 forecasts", priceId: process.env.STRIPE_PRICE_FORECAST_LARGE  ?? "" },
  },
};

// ─── Garantir que os 3 saldos existem para o usuário ─────────────────────────
export async function ensureTokenBalances(userId: string): Promise<void> {
  for (const tokenType of TOKEN_TYPES) {
    await prisma.tokenBalance.upsert({
      where: { userId_tokenType: { userId, tokenType } },
      create: { userId, tokenType, balance: 0, monthlyQuota: 0 },
      update: {},
    });
  }
}

// ─── Buscar todos os saldos do usuário ────────────────────────────────────────
export async function getBalances(userId: string) {
  await ensureTokenBalances(userId);
  return prisma.tokenBalance.findMany({ where: { userId } });
}

// ─── Verificar se há saldo suficiente ────────────────────────────────────────
export async function checkBalance(
  userId: string,
  tokenType: TokenType
): Promise<{ enough: boolean; balance: number }> {
  const record = await prisma.tokenBalance.findUnique({
    where: { userId_tokenType: { userId, tokenType } },
  });
  const balance = record?.balance ?? 0;
  return { enough: balance > 0, balance };
}

// ─── Consumir 1 token ─────────────────────────────────────────────────────────
export async function consumeToken(
  userId: string,
  tokenType: TokenType,
  referenceId?: string,
  description?: string
): Promise<void> {
  const record = await prisma.tokenBalance.update({
    where: { userId_tokenType: { userId, tokenType } },
    data: {
      balance:   { decrement: 1 },
      totalUsed: { increment: 1 },
    },
  });

  await prisma.tokenTransaction.create({
    data: {
      userId,
      tokenType,
      amount:      -1,
      balanceAfter: record.balance,
      type:        "usage",
      description: description ?? `Uso de ${TOKEN_LABELS[tokenType].label}`,
      referenceId,
    },
  });
}

// ─── Conceder cota mensal (chamado na renovação da assinatura) ────────────────
export async function grantQuota(userId: string, plan: string): Promise<void> {
  const planKey = (["personal", "business", "trialing"].includes(plan) ? plan : "personal") as PlanKey;
  const quotas = PLAN_QUOTAS[planKey];
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1);

  for (const tokenType of TOKEN_TYPES) {
    const qty = quotas[tokenType];

    const record = await prisma.tokenBalance.upsert({
      where: { userId_tokenType: { userId, tokenType } },
      create: {
        userId, tokenType,
        balance: qty, totalGranted: qty, monthlyQuota: qty,
        quotaResetAt: nextReset,
      },
      update: {
        balance:      { increment: qty },
        totalGranted: { increment: qty },
        monthlyQuota: qty,
        quotaResetAt: nextReset,
      },
    });

    await prisma.tokenTransaction.create({
      data: {
        userId, tokenType,
        amount:      qty,
        balanceAfter: record.balance,
        type:        "quota_grant",
        description: `Renovação mensal — plano ${planKey}`,
      },
    });
  }
}

// ─── Creditar tokens de compra avulsa ─────────────────────────────────────────
export async function purchaseTokens(
  userId: string,
  tokenType: TokenType,
  packageSize: PackageSize,
  stripePaymentId: string
): Promise<void> {
  const pkg = TOKEN_PACKAGES[tokenType][packageSize];

  const record = await prisma.tokenBalance.upsert({
    where: { userId_tokenType: { userId, tokenType } },
    create: {
      userId, tokenType,
      balance: pkg.qty, totalGranted: pkg.qty,
    },
    update: {
      balance:      { increment: pkg.qty },
      totalGranted: { increment: pkg.qty },
    },
  });

  await prisma.tokenTransaction.create({
    data: {
      userId, tokenType,
      amount:      pkg.qty,
      balanceAfter: record.balance,
      type:        "purchase",
      description: `Compra: ${pkg.label}`,
      referenceId: stripePaymentId,
    },
  });
}

// ─── Disparar recarga automática se necessário ────────────────────────────────
export async function triggerAutoRechargeIfNeeded(
  userId: string,
  tokenType: TokenType
): Promise<void> {
  const record = await prisma.tokenBalance.findUnique({
    where: { userId_tokenType: { userId, tokenType } },
  });

  if (!record?.autoRecharge || record.balance > record.autoRechargeThreshold) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) return;

  const packageSize = record.autoRechargePackage as PackageSize;
  const pkg = TOKEN_PACKAGES[tokenType][packageSize];
  if (!pkg?.priceId || pkg.priceId === "") return;

  // Buscar método de pagamento padrão do customer
  const customer = await stripe.customers.retrieve(user.stripeCustomerId) as { deleted?: boolean; invoice_settings?: { default_payment_method?: string | null } };
  if (customer.deleted) return;

  const paymentMethodId = customer.invoice_settings?.default_payment_method;
  if (!paymentMethodId || typeof paymentMethodId !== "string") return;

  // Criar PaymentIntent com cobrança automática
  const paymentIntent = await stripe.paymentIntents.create({
    amount: pkg.priceBrl * 100, // centavos
    currency: "brl",
    customer: user.stripeCustomerId,
    payment_method: paymentMethodId,
    confirm: true,
    off_session: true,
    metadata: { userId, tokenType, packageSize, autoRecharge: "true" },
    description: `Auto-recarga: ${pkg.label}`,
  });

  if (paymentIntent.status === "succeeded") {
    await purchaseTokens(userId, tokenType, packageSize, paymentIntent.id);

    // Registrar como auto_recharge
    await prisma.tokenTransaction.updateMany({
      where: { referenceId: paymentIntent.id },
      data: { type: "auto_recharge" },
    });
  }
}
