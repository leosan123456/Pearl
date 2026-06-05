import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import RevenueChart from "@/components/RevenueChart";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles, ArrowUpRight, AlertTriangle, TrendingUp,
  Brain, Building2, RefreshCw, CheckCircle2, Clock,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? "Administrador";

  const [companies, totalCompanies, revenueRecords, latestInsights, recentScores] = await Promise.all([
    prisma.company.findMany({
      include: {
        assets: true,
        revenueRecords: { orderBy: [{ year: "asc" }, { month: "asc" }], take: 12 },
        insights: { orderBy: { createdAt: "desc" }, take: 1 },
        scores:   { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { annualRevenue: "desc" },
      take: 8,
    }),
    prisma.company.count(),
    prisma.revenueRecord.findMany({ orderBy: [{ year: "asc" }, { month: "asc" }] }),
    prisma.aIInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { company: { select: { name: true, slug: true } } },
    }),
    prisma.companyScore.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { company: { select: { name: true, slug: true, sector: true } } },
    }),
  ]);

  const totalRevenue = companies.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
  const totalAssets  = companies.reduce(
    (sum, c) => sum + c.assets.reduce((inner, a) => inner + (a.value || 0), 0), 0
  );
  const totalMonthlyRevenue = companies.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  const liquidityRatio      = totalRevenue ? Math.round((totalMonthlyRevenue / totalRevenue) * 100) : 0;
  const highRiskCount       = recentScores.filter(s => ["high", "critical"].includes(s.riskLevel)).length;
  const netWorth            = totalAssets > 0 ? totalAssets : totalRevenue;

  // Portfólio consolidado de receita
  const portfolioRecords = Object.values(
    revenueRecords.reduce((acc, record) => {
      const key = `${record.year}-${record.month ?? 0}`;
      if (!acc[key]) acc[key] = { ...record };
      else acc[key].amount += record.amount;
      return acc;
    }, {} as Record<string, { id: string; year: number; month: number | null; amount: number; currency: string }>)
  ).sort((a, b) => a.year - b.year || Number((a.month ?? 0) - (b.month ?? 0)));

  // KPIs
  const kpis = [
    { label: "Patrimônio Líquido",     value: formatCurrency(netWorth, "USD"),      detail: "Ativos consolidados",           color: "var(--accent)"        },
    { label: "Liquidez do Portfólio",  value: `${liquidityRatio}%`,                 detail: "Fluxo mensal / receita anual",  color: "var(--accent-strong)" },
    { label: "Empresas Monitoradas",   value: totalCompanies.toString(),             detail: `${latestInsights.length} com análise recente`, color: "var(--text-primary)" },
    { label: "Alertas de Risco",       value: highRiskCount > 0 ? `${highRiskCount}` : "—",
      detail: highRiskCount > 0 ? "Empresas em risco alto" : "Portfólio estável",
      color: highRiskCount > 0 ? "var(--danger)" : "var(--accent)" },
  ];

  // Insights recentes para o painel lateral
  const insightAlerts = latestInsights.map((insight) => ({
    id:      insight.id,
    title:   insight.company?.name ? `${insight.company.name}` : "Empresa",
    message: insight.summary.length > 100 ? insight.summary.slice(0, 100) + "…" : insight.summary,
    slug:    insight.company?.slug,
    outlook: insight.outlook,
    time:    relativeTime(insight.createdAt),
  }));

  // Sugestões de empresa: sem análise ou análise desatualizada
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const suggestions = companies
    .map((c) => {
      const lastInsight = c.insights[0];
      const lastScore   = c.scores[0];
      const needsAnalysis = !lastInsight || lastInsight.createdAt < thirtyDaysAgo;
      const riskLevel     = lastScore?.riskLevel ?? null;
      return { ...c, lastInsight, lastScore, needsAnalysis, riskLevel };
    })
    .filter((c) => c.needsAnalysis || ["high", "critical"].includes(c.riskLevel ?? ""))
    .slice(0, 4);

  // Data do último insight para "Compliance AI"
  const lastInsightTime = latestInsights[0]?.createdAt;
  const lastInsightLabel = lastInsightTime ? relativeTime(lastInsightTime) : "nunca";
  const analyzedCount = companies.filter((c) => c.insights.length > 0).length;

  return (
    <div className="flex-1">
      <Navbar title="Visão Geral" />

      <main className="dashboard-content px-6 py-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] mb-3" style={{ color: "var(--accent-soft)" }}>
              Painel Pearl.AI
            </p>
            <h1 className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Olá, {userName.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              {totalCompanies > 0
                ? `${totalCompanies} empresa${totalCompanies > 1 ? "s" : ""} monitorada${totalCompanies > 1 ? "s" : ""} · ${analyzedCount} com análise de IA · Dados em tempo real`
                : "Nenhuma empresa cadastrada ainda. Adicione empresas para começar."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/companies"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: "rgba(85,107,47,0.12)", color: "var(--accent)", textDecoration: "none" }}
            >
              <Building2 size={15} />
              Ver empresas
            </Link>
            <Link
              href="/dashboard/ai"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,.05)", color: "var(--text-primary)", textDecoration: "none" }}
            >
              <Brain size={15} />
              IA Intelligence
            </Link>
          </div>
        </section>

        {/* ── KPIs ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {kpis.map((card, index) => (
            <div
              key={card.label}
              className="rounded-[28px] p-5 border fade-in-up"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
                animationDelay: `${index * 0.08}s`,
              }}
            >
              <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--text-secondary)" }}>
                {card.label}
              </p>
              <p className="text-3xl font-semibold" style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                {card.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_0.95fr] gap-6">
          {/* ── Coluna principal ──────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Gráfico */}
            <div
              className="rounded-[32px] p-6 border fade-in-up"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] mb-2" style={{ color: "var(--accent-soft)" }}>
                    Desempenho do Portfólio
                  </p>
                  <h2 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    Receita consolidada
                  </h2>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    Soma de todos os registros de receita do portfólio
                  </p>
                </div>
                <Link
                  href="/dashboard/companies"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
                  style={{ background: "rgba(85,107,47,0.12)", color: "var(--accent)", textDecoration: "none" }}
                >
                  <RefreshCw size={14} />
                  Gerenciar
                </Link>
              </div>

              <div className="rounded-[28px] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                {portfolioRecords.length > 0 ? (
                  <RevenueChart records={portfolioRecords} currency="USD" />
                ) : (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <TrendingUp size={32} color="rgba(255,255,255,.15)" style={{ margin: "0 auto 12px", display: "block" }} />
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>
                      Nenhum registro de receita. Adicione empresas com dados financeiros.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sugestões de empresa */}
            {suggestions.length > 0 && (
              <div
                className="rounded-[32px] p-6 border fade-in-up"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(245,158,11,.15)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] mb-1" style={{ color: "#f59e0b" }}>
                      Sugestões da IA
                    </p>
                    <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                      Empresas que precisam de atenção
                    </h3>
                  </div>
                  <AlertTriangle size={20} color="#f59e0b" />
                </div>

                <div className="space-y-3">
                  {suggestions.map((c) => {
                    const isHighRisk = ["high", "critical"].includes(c.riskLevel ?? "");
                    return (
                      <Link
                        key={c.id}
                        href={`/dashboard/companies/${c.slug}`}
                        style={{ textDecoration: "none", display: "block" }}
                      >
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px", borderRadius: 16,
                          background: isHighRisk ? "rgba(239,68,68,.05)" : "rgba(255,255,255,.02)",
                          border: `1px solid ${isHighRisk ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.06)"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: isHighRisk ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.06)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {isHighRisk
                                ? <AlertTriangle size={16} color="#ef4444" />
                                : <Clock size={16} color="rgba(255,255,255,.4)" />}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{c.name}</p>
                              <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
                                {c.sector} ·{" "}
                                {isHighRisk
                                  ? `Risco ${c.riskLevel} detectado`
                                  : c.lastInsight
                                    ? `Última análise: ${relativeTime(c.lastInsight.createdAt)}`
                                    : "Nunca analisada"}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                              background: isHighRisk ? "rgba(239,68,68,.15)" : "rgba(245,158,11,.1)",
                              color: isHighRisk ? "#f87171" : "#f59e0b",
                            }}>
                              {isHighRisk ? "Revisar" : "Analisar"}
                            </span>
                            <ArrowUpRight size={13} color="rgba(255,255,255,.25)" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Coluna lateral ────────────────────────────────────────────── */}
          <aside className="space-y-6">

            {/* IA em Tempo Real */}
            <div
              className="rounded-[32px] p-6 border fade-in-up"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "var(--accent-soft)" }}>
                    IA em Tempo Real
                  </p>
                  <h3 className="text-lg font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                    Últimos insights
                  </h3>
                </div>
                <Sparkles size={20} style={{ color: "var(--accent)" }} />
              </div>

              <div className="space-y-3">
                {insightAlerts.length > 0 ? (
                  insightAlerts.map((alert) => {
                    const outlookColor =
                      alert.outlook === "bearish"  ? "#ef4444" :
                      alert.outlook === "bullish"  ? "#10b981" :
                      alert.outlook === "cautious" ? "#8b5cf6" : "#f59e0b";
                    return (
                      <Link
                        key={alert.id}
                        href={alert.slug ? `/dashboard/companies/${alert.slug}` : "/dashboard/ai"}
                        style={{ textDecoration: "none", display: "block" }}
                      >
                        <div className="rounded-3xl p-4 border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                              {alert.title}
                            </p>
                            <span className="text-xs uppercase" style={{ color: outlookColor, fontWeight: 700, flexShrink: 0 }}>
                              {alert.outlook}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {alert.message}
                          </p>
                          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,.25)" }}>
                            {alert.time}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div style={{ padding: "24px 0", textAlign: "center" }}>
                    <Brain size={28} color="rgba(255,255,255,.15)" style={{ margin: "0 auto 10px", display: "block" }} />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Nenhum insight ainda.
                    </p>
                    <Link
                      href="/dashboard/ai"
                      style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "block", marginTop: 8 }}
                    >
                      Analisar empresas →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Relatórios dinâmicos */}
            <div
              className="rounded-[32px] p-6 border fade-in-up"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm uppercase tracking-[0.24em] mb-4" style={{ color: "var(--accent-soft)" }}>
                Status do portfólio
              </p>
              <div className="space-y-3">

                <div className="flex items-center justify-between rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      Análises de IA
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      {lastInsightLabel !== "nunca"
                        ? `Última: ${lastInsightLabel}`
                        : "Nenhuma análise realizada"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {analyzedCount > 0
                      ? <CheckCircle2 size={14} color="#10b981" />
                      : <Clock size={14} color="#f59e0b" />}
                    <span className="text-xs font-semibold" style={{ color: analyzedCount > 0 ? "var(--accent)" : "#f59e0b" }}>
                      {analyzedCount}/{totalCompanies}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      Visão de Risco
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      {highRiskCount > 0
                        ? `${highRiskCount} empresa${highRiskCount > 1 ? "s" : ""} em alerta`
                        : "Nenhum risco elevado detectado"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: highRiskCount > 0 ? "var(--danger)" : "var(--accent)" }}>
                    {highRiskCount > 0 ? "Alto" : "Estável"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      Receita do portfólio
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      {portfolioRecords.length} registros mensais
                    </p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    {portfolioRecords.length > 0 ? "Ativo" : "Vazio"}
                  </span>
                </div>

              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}

function relativeTime(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "agora";
  if (mins  < 60) return `${mins} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}
