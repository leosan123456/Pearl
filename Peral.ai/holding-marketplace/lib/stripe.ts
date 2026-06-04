import Stripe from "stripe";

// ─── Singleton do cliente Stripe ─────────────────────────────────────────────
const globalForStripe = globalThis as unknown as { stripe: Stripe };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });

if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;

// ─── Configuração dos planos ──────────────────────────────────────────────────
export const BILLING_PLANS = {
  personal: {
    id: "personal",
    name: "Personal",
    description: "Para gestores individuais e family offices",
    brl: 197,
    trialDays: 14,
    priceId: process.env.STRIPE_PRICE_PERSONAL_BRL ?? "",
    features: [
      "1 usuário administrador",
      "Até 5 empresas no portfólio",
      "20 análises de IA por mês",
      "Score de risco básico",
      "Dashboard de visão geral",
      "Relatórios mensais em PDF",
      "Suporte por e-mail",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    description: "Para holdings corporativas com análise avançada",
    brl: 697,
    trialDays: 14,
    priceId: process.env.STRIPE_PRICE_BUSINESS_BRL ?? "",
    features: [
      "Até 10 usuários",
      "Empresas ilimitadas",
      "Análises de IA ilimitadas",
      "Score avançado + Forecasting 12 meses",
      "Compliance e matriz de risco",
      "Alertas automáticos em tempo real",
      "Acesso à API",
      "Suporte prioritário 24h",
    ],
    badge: "Mais popular",
  },
} as const;

export type PlanId = keyof typeof BILLING_PLANS;

export function getPlanByPriceId(priceId: string): PlanId | null {
  for (const [id, plan] of Object.entries(BILLING_PLANS)) {
    if (plan.priceId === priceId) return id as PlanId;
  }
  return null;
}

export function getPlanById(planId: string): (typeof BILLING_PLANS)[PlanId] | null {
  return BILLING_PLANS[planId as PlanId] ?? null;
}

// Status legíveis para exibição
export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing:  { label: "Trial ativo",       color: "#8aa26a" },
  active:    { label: "Ativa",             color: "#10b981" },
  past_due:  { label: "Pagamento em atraso", color: "#f59e0b" },
  canceled:  { label: "Cancelada",         color: "#ef4444" },
  unpaid:    { label: "Não paga",          color: "#ef4444" },
};
