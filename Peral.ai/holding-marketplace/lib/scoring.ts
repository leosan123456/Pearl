import type { Company, CompanyAsset, RevenueRecord } from "@prisma/client";

export interface ScoreResult {
  overall: number;
  revenueHealth: number;
  growthScore: number;
  assetCoverage: number;
  efficiency: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  breakdown: Record<string, { score: number; label: string; explanation: string }>;
}

// Revenue health: size-based on annual revenue (USD-normalized estimate)
function scoreRevenueHealth(annualRevenue: number | null): number {
  if (!annualRevenue) return 10;
  const r = annualRevenue;
  if (r >= 100_000_000_000) return 95;
  if (r >= 50_000_000_000)  return 88;
  if (r >= 10_000_000_000)  return 78;
  if (r >= 1_000_000_000)   return 62;
  if (r >= 100_000_000)     return 45;
  return 25;
}

// Growth: trend from sorted monthly records (linear regression slope)
function scoreGrowth(records: RevenueRecord[]): number {
  const monthly = records
    .filter((r) => r.month !== null)
    .sort((a, b) => a.year * 12 + (a.month ?? 0) - (b.year * 12 + (b.month ?? 0)));

  if (monthly.length < 3) return 50;

  const n = monthly.length;
  const xs = monthly.map((_, i) => i);
  const ys = monthly.map((r) => r.amount);
  const xMean = xs.reduce((s, x) => s + x, 0) / n;
  const yMean = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  const slopePct = yMean === 0 ? 0 : slope / yMean;

  // Map slope % per month → score
  if (slopePct >= 0.05)  return 95;
  if (slopePct >= 0.02)  return 82;
  if (slopePct >= 0.005) return 68;
  if (slopePct >= 0)     return 55;
  if (slopePct >= -0.02) return 38;
  return 18;
}

// Asset coverage: total assets / annual revenue
function scoreAssetCoverage(assets: CompanyAsset[], annualRevenue: number | null): number {
  const total = assets.reduce((s, a) => s + (a.value ?? 0), 0);
  if (!annualRevenue || total === 0) return 40;
  const ratio = total / annualRevenue;
  if (ratio >= 2.0)  return 92;
  if (ratio >= 1.0)  return 75;
  if (ratio >= 0.5)  return 58;
  if (ratio >= 0.25) return 40;
  return 22;
}

// Efficiency: revenue per employee vs sector benchmarks (USD)
const SECTOR_REVENUE_PER_EMP: Record<string, number> = {
  Technology: 800_000,
  Finance: 700_000,
  Energy: 1_500_000,
  Healthcare: 350_000,
  "Consumer Goods": 250_000,
  "Real Estate": 600_000,
  Materials: 400_000,
  Industrial: 300_000,
  Retail: 200_000,
  Telecommunications: 500_000,
  Other: 400_000,
};

function scoreEfficiency(
  annualRevenue: number | null,
  employees: number | null,
  sector: string
): number {
  if (!annualRevenue || !employees) return 45;
  const actual = annualRevenue / employees;
  const benchmark = SECTOR_REVENUE_PER_EMP[sector] ?? 400_000;
  const ratio = actual / benchmark;
  if (ratio >= 2.0)  return 95;
  if (ratio >= 1.5)  return 85;
  if (ratio >= 1.0)  return 70;
  if (ratio >= 0.7)  return 55;
  if (ratio >= 0.4)  return 38;
  return 20;
}

function riskLevel(overall: number): ScoreResult["riskLevel"] {
  if (overall >= 75) return "low";
  if (overall >= 55) return "medium";
  if (overall >= 35) return "high";
  return "critical";
}

export function computeScore(
  company: Company & { assets: CompanyAsset[]; revenueRecords: RevenueRecord[] }
): ScoreResult {
  const rh = scoreRevenueHealth(company.annualRevenue);
  const gr = scoreGrowth(company.revenueRecords);
  const ac = scoreAssetCoverage(company.assets, company.annualRevenue);
  const ef = scoreEfficiency(company.annualRevenue, company.employees, company.sector);

  const overall = Math.round(rh * 0.30 + gr * 0.25 + ac * 0.20 + ef * 0.25);

  return {
    overall,
    revenueHealth: Math.round(rh),
    growthScore: Math.round(gr),
    assetCoverage: Math.round(ac),
    efficiency: Math.round(ef),
    riskLevel: riskLevel(overall),
    breakdown: {
      revenueHealth: {
        score: Math.round(rh),
        label: "Revenue Health",
        explanation: `Annual revenue of ${company.annualRevenue?.toLocaleString() ?? "N/A"} ${company.currency}`,
      },
      growthScore: {
        score: Math.round(gr),
        label: "Growth Trend",
        explanation: `Calculated from ${company.revenueRecords.filter((r) => r.month).length} monthly data points`,
      },
      assetCoverage: {
        score: Math.round(ac),
        label: "Asset Coverage",
        explanation: `Total assets vs annual revenue ratio`,
      },
      efficiency: {
        score: Math.round(ef),
        label: "Operational Efficiency",
        explanation: `Revenue per employee vs ${company.sector} sector benchmark`,
      },
    },
  };
}
