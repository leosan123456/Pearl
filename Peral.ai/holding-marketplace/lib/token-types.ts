// Client-safe types and constants — NO Stripe or Prisma imports allowed here.
// Server code that needs functions should import from lib/tokens.ts instead.

export type TokenType = "ai_analysis" | "intel_session" | "forecast";
export type PackageSize = "small" | "medium" | "large";
export type PlanKey = "personal" | "business" | "trialing";

export const TOKEN_TYPES: TokenType[] = ["ai_analysis", "intel_session", "forecast"];

export const TOKEN_LABELS: Record<TokenType, { label: string; description: string; icon: string }> = {
  ai_analysis:   { label: "Análises de IA",    description: "Análises Claude por empresa",         icon: "🤖" },
  intel_session: { label: "Sessões Intel",      description: "Sessões de inteligência estratégica", icon: "💬" },
  forecast:      { label: "Forecasts",          description: "Previsões de receita",                icon: "📈" },
};

export const PLAN_QUOTAS: Record<PlanKey, Record<TokenType, number>> = {
  personal:  { ai_analysis: 20,  intel_session: 5,   forecast: 5   },
  business:  { ai_analysis: 500, intel_session: 100, forecast: 100 },
  trialing:  { ai_analysis: 5,   intel_session: 2,   forecast: 2   },
};

// Package metadata without Stripe Price IDs (safe for client bundle)
export const TOKEN_PACKAGES_META: Record<TokenType, Record<PackageSize, { qty: number; priceBrl: number; label: string }>> = {
  ai_analysis: {
    small:  { qty: 10,  priceBrl: 19,  label: "10 análises"  },
    medium: { qty: 30,  priceBrl: 49,  label: "30 análises"  },
    large:  { qty: 100, priceBrl: 129, label: "100 análises" },
  },
  intel_session: {
    small:  { qty: 5,  priceBrl: 15, label: "5 sessões"   },
    medium: { qty: 15, priceBrl: 39, label: "15 sessões"  },
    large:  { qty: 50, priceBrl: 99, label: "50 sessões"  },
  },
  forecast: {
    small:  { qty: 5,  priceBrl: 9,  label: "5 forecasts"  },
    medium: { qty: 20, priceBrl: 29, label: "20 forecasts" },
    large:  { qty: 60, priceBrl: 69, label: "60 forecasts" },
  },
};
