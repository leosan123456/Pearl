import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring";
import { generateForecast, trendSummary } from "@/lib/forecasting";
import { formatCurrency } from "@/lib/utils";
import type { Company, CompanyAsset, RevenueRecord, AIInsight } from "@prisma/client";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── System prompt (cached — counts once per cache TTL) ───────────────────────
const SYSTEM_PROMPT = `You are an expert financial analyst and investment intelligence agent specializing in holding company portfolio analysis. You have deep expertise in:

- Corporate financial analysis across all sectors and geographies
- Revenue pattern recognition and forecasting
- Asset valuation and portfolio risk assessment
- Competitive benchmarking and market positioning
- Investment thesis development

Your analysis is data-driven, precise, and actionable. You always:
1. Ground insights in the specific financial data provided
2. Reference past analyses when available to track evolution
3. Identify both opportunities and risks with equal rigor
4. Provide concrete, measurable recommendations
5. Adapt your perspective to the company's sector and geography

Respond in structured JSON matching the requested schema exactly. Be concise but insightful — executives need clarity, not verbosity.`;

type FullCompany = Company & { assets: CompanyAsset[]; revenueRecords: RevenueRecord[] };

// ─── Build rich context for a company (used in prompt) ────────────────────────
function buildCompanyContext(company: FullCompany, pastInsights: AIInsight[]): string {
  const score = computeScore(company);
  const forecast = generateForecast(company.revenueRecords);
  const trend = trendSummary(company.revenueRecords);
  const totalAssets = company.assets.reduce((s, a) => s + (a.value ?? 0), 0);

  const forecastStr = forecast.length
    ? forecast
        .slice(0, 3)
        .map(
          (f) =>
            `${f.year}-${String(f.month).padStart(2, "0")}: ${formatCurrency(f.amount, company.currency)} (80% CI: ${formatCurrency(f.lowerBound, company.currency)}–${formatCurrency(f.upperBound, company.currency)})`
        )
        .join(", ")
    : "Insufficient data";

  const pastStr =
    pastInsights.length > 0
      ? `\n\nPAST ANALYSES (most recent first):\n` +
        pastInsights
          .slice(0, 3)
          .map(
            (i) =>
              `[${new Date(i.createdAt).toISOString().slice(0, 10)}] Summary: ${i.summary} | Outlook: ${i.outlook}`
          )
          .join("\n")
      : "\n\nPAST ANALYSES: None — this is the first analysis.";

  return `COMPANY PROFILE:
Name: ${company.name}
Country: ${company.country} | Sector: ${company.sector} | Currency: ${company.currency}
Founded: ${company.founded ?? "N/A"} | Employees: ${company.employees?.toLocaleString() ?? "N/A"}
Status: ${company.status}
Website: ${company.website ?? "N/A"}

FINANCIAL DATA:
Annual Revenue: ${company.annualRevenue ? formatCurrency(company.annualRevenue, company.currency) : "N/A"}
Monthly Revenue: ${company.monthlyRevenue ? formatCurrency(company.monthlyRevenue, company.currency) : "N/A"}
Total Assets: ${totalAssets > 0 ? formatCurrency(totalAssets, company.currency) : "N/A"}
Main Revenue Streams: ${company.mainRevenue ?? "N/A"}

ASSETS (${company.assets.length}):
${company.assets.map((a) => `- ${a.name} (${a.type}): ${a.value ? formatCurrency(a.value, a.currency) : "N/A"}`).join("\n") || "None"}

COMPUTED SCORES:
Overall Score: ${score.overall}/100 | Risk Level: ${score.riskLevel.toUpperCase()}
Revenue Health: ${score.revenueHealth}/100 | Growth: ${score.growthScore}/100
Asset Coverage: ${score.assetCoverage}/100 | Efficiency: ${score.efficiency}/100

REVENUE TREND: ${trend}
REVENUE HISTORY: ${company.revenueRecords.filter((r) => r.month).length} monthly records
3-MONTH FORECAST: ${forecastStr}
${pastStr}`;
}

// ─── Generate full AI analysis with caching + memory ─────────────────────────
export async function analyzeCompany(companyId: string): Promise<AIInsight> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { assets: true, revenueRecords: { orderBy: [{ year: "asc" }, { month: "asc" }] } },
  });

  const pastInsights = await prisma.aIInsight.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const companyContext = buildCompanyContext(company, pastInsights);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: companyContext,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Analyze this company and return a JSON object with exactly these keys:
{
  "summary": "2-3 sentence executive summary of the company's financial position",
  "strengths": "3-4 key strengths, comma-separated",
  "risks": "3-4 key risks or concerns, comma-separated",
  "outlook": "one of: bullish | neutral | bearish | cautious",
  "recommendation": "1-2 sentence actionable recommendation for portfolio strategy"
}
Return only valid JSON, no markdown.`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());
  } catch {
    parsed = {
      summary: "Analysis could not be parsed.",
      strengths: "Data available",
      risks: "Parse error",
      outlook: "neutral",
      recommendation: "Re-run analysis.",
    };
  }

  const usage = response.usage as { input_tokens: number; cache_read_input_tokens?: number };
  const cacheHit = (usage.cache_read_input_tokens ?? 0) > 0;

  const insight = await prisma.aIInsight.create({
    data: {
      companyId,
      summary: parsed.summary ?? "",
      strengths: parsed.strengths ?? "",
      risks: parsed.risks ?? "",
      outlook: parsed.outlook ?? "neutral",
      recommendation: parsed.recommendation ?? "",
      modelUsed: "claude-sonnet-4-6",
      inputTokens: usage.input_tokens,
      cacheHit,
    },
  });

  return insight;
}

// ─── Save computed score to DB ────────────────────────────────────────────────
export async function saveScore(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { assets: true, revenueRecords: true },
  });

  const score = computeScore(company);

  return prisma.companyScore.create({
    data: {
      companyId,
      overall: score.overall,
      revenueHealth: score.revenueHealth,
      growthScore: score.growthScore,
      assetCoverage: score.assetCoverage,
      efficiency: score.efficiency,
      riskLevel: score.riskLevel,
    },
  });
}

// ─── Save forecast to DB ──────────────────────────────────────────────────────
export async function saveForecast(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { assets: true, revenueRecords: true },
  });

  const points = generateForecast(company.revenueRecords, 6);
  if (points.length === 0) return [];

  // Delete existing forecasts for this company
  await prisma.forecastRecord.deleteMany({ where: { companyId } });

  return prisma.forecastRecord.createMany({
    data: points.map((p) => ({
      companyId,
      year: p.year,
      month: p.month,
      amount: p.amount,
      lowerBound: p.lowerBound,
      upperBound: p.upperBound,
      confidence: p.confidence,
      method: "holt",
    })),
  });
}
