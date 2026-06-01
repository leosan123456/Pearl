import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import AICompanyRow from "@/components/AICompanyRow";
import { computeScore } from "@/lib/scoring";
import { trendSummary } from "@/lib/forecasting";
import { Brain, TrendingUp, AlertTriangle, Zap } from "lucide-react";

const RISK_COLOR = {
  low:      "#10b981",
  medium:   "#f59e0b",
  high:     "#ef4444",
  critical: "#7f1d1d",
};

const OUTLOOK_ICON = {
  bullish:  { icon: "↑", color: "#10b981" },
  neutral:  { icon: "→", color: "#f59e0b" },
  bearish:  { icon: "↓", color: "#ef4444" },
  cautious: { icon: "⚠", color: "#8b5cf6" },
};

export default async function AIPage() {
  const companies = await prisma.company.findMany({
    include: {
      assets: true,
      revenueRecords: { orderBy: [{ year: "asc" }, { month: "asc" }] },
      insights: { orderBy: { createdAt: "desc" }, take: 1 },
      scores:   { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const scored = companies.map((c) => ({
    ...c,
    computed: computeScore(c),
    trend:    trendSummary(c.revenueRecords),
    insight:  c.insights[0] ?? null,
    score:    c.scores[0] ?? null,
  }));

  const avgScore = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.computed.overall, 0) / scored.length)
    : 0;

  const withInsights  = scored.filter((c) => c.insight).length;
  const highRisk      = scored.filter((c) => ["high","critical"].includes(c.computed.riskLevel)).length;
  const growing       = scored.filter((c) => c.trend.startsWith("growing")).length;

  return (
    <div className="flex-1">
      <Navbar title="AI Intelligence" />

      <main className="px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent)20" }}>
            <Brain size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Pearl.AI Intelligence
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              AI-powered insights across your portfolio of {companies.length} companies
            </p>
          </div>
        </div>

        {/* Portfolio KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Portfolio Avg Score", value: `${avgScore}/100`, icon: Brain, color: "var(--accent)" },
            { label: "Companies Analyzed",  value: `${withInsights}/${companies.length}`, icon: Zap, color: "var(--accent-green)" },
            { label: "High Risk Companies", value: highRisk.toString(), icon: AlertTriangle, color: "var(--accent-red)" },
            { label: "Growing Revenue",     value: `${growing} co.`, icon: TrendingUp, color: "var(--accent-yellow)" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{kpi.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: kpi.color + "20" }}>
                  <kpi.icon size={15} style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Company cards */}
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Company Scores &amp; AI Insights
        </h3>

        <div className="space-y-3">
          {scored.map((company) => {
            const outlookCfg = company.insight
              ? OUTLOOK_ICON[company.insight.outlook as keyof typeof OUTLOOK_ICON] ?? OUTLOOK_ICON.neutral
              : null;
            const riskColor = RISK_COLOR[company.computed.riskLevel as keyof typeof RISK_COLOR];

            return (
              <AICompanyRow
                key={company.id}
                slug={company.slug}
                name={company.name}
                sector={company.sector}
                country={company.country}
                trend={company.trend}
                overall={company.computed.overall}
                riskLevel={company.computed.riskLevel}
                riskColor={riskColor}
                outlook={company.insight?.outlook ?? null}
                outlookIcon={outlookCfg?.icon ?? null}
                outlookColor={outlookCfg?.color ?? null}
                summary={company.insight?.summary ?? null}
                subScores={[
                  { label: "Revenue", value: company.computed.revenueHealth },
                  { label: "Growth",  value: company.computed.growthScore },
                  { label: "Assets",  value: company.computed.assetCoverage },
                  { label: "Effic.",  value: company.computed.efficiency },
                ]}
              />
            );
          })}
        </div>

        <p className="text-xs mt-6 text-center" style={{ color: "var(--text-secondary)" }}>
          Scores computed from revenue health, growth trend, asset coverage and operational efficiency.
          Claude AI insights require ANTHROPIC_API_KEY.
        </p>
      </main>
    </div>
  );
}
