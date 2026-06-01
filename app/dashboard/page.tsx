import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import RevenueChart from "@/components/RevenueChart";
import { Search, Bell, UserCircle2, Sparkles, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [companies, totalCompanies, revenueRecords, latestInsights] = await Promise.all([
    prisma.company.findMany({
      include: {
        assets: true,
        revenueRecords: { orderBy: [{ year: "asc" }, { month: "asc" }], take: 12 },
      },
      orderBy: { annualRevenue: "desc" },
      take: 6,
    }),
    prisma.company.count(),
    prisma.revenueRecord.findMany({ orderBy: [{ year: "asc" }, { month: "asc" }] }),
    prisma.aIInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { company: true },
    }),
  ]);

  const totalRevenue = companies.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
  const totalAssets = companies.reduce(
    (sum, c) => sum + c.assets.reduce((inner, asset) => inner + (asset.value || 0), 0),
    0
  );
  const totalMonthlyRevenue = companies.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  const liquidityRatio = totalRevenue ? Math.round((totalMonthlyRevenue / totalRevenue) * 100) : 0;
  const highRiskCount = latestInsights.filter((insight) => insight.outlook === "bearish").length;
  const netWorth = totalAssets > 0 ? totalAssets : totalRevenue;

  const portfolioRecords = Object.values(
    revenueRecords.reduce((acc, record) => {
      const key = `${record.year}-${record.month ?? 0}`;
      if (!acc[key]) {
        acc[key] = { ...record };
      } else {
        acc[key].amount += record.amount;
      }
      return acc;
    }, {} as Record<string, { id: string; year: number; month: number | null; amount: number; currency: string }>)
  ).sort((a, b) => a.year - b.year || Number((a.month ?? 0) - (b.month ?? 0)));

  const kpis = [
    {
      label: "Patrimônio Líquido Total",
      value: formatCurrency(netWorth, "USD"),
      detail: "Ativos consolidados",
      color: "var(--accent)",
    },
    {
      label: "Liquidez",
      value: `${liquidityRatio}%`,
      detail: "Fluxo mensal / receita anual",
      color: "var(--accent-strong)",
    },
    {
      label: "Empresas Monitoradas",
      value: totalCompanies.toString(),
      detail: "Estrutura de holdings",
      color: "var(--text-primary)",
    },
    {
      label: "Risco Atual",
      value: highRiskCount > 0 ? `${highRiskCount} alto` : "Estável",
      detail: "Análise de IA em tempo real",
      color: highRiskCount > 0 ? "var(--danger)" : "var(--accent)",
    },
  ];

  const insightAlerts = latestInsights.map((insight) => ({
    id: insight.id,
    title: insight.company?.name
      ? `Anomalia detectada em ${insight.company.name}`
      : "Sinal de mercado detectado",
    message: insight.summary,
    time: insight.createdAt.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <div className="flex-1">
      <Navbar title="Visão Geral" />

      <main className="dashboard-content px-6 py-6">
        <section className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] mb-3" style={{ color: "var(--accent-soft)" }}>
              Painel Pearl.AI
            </p>
            <h1 className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Controle consolidado da holding
            </h1>
            <p className="mt-2 text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Acompanhe o desempenho, riscos e insights da IA em uma única visão material.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-[320px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
              <input
                type="search"
                placeholder="Buscar empresas, ativos ou insights"
                className="w-full rounded-full border py-3 pl-12 pr-4 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <button
              className="relative rounded-full p-3 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Bell size={18} style={{ color: "var(--text-primary)" }} />
              <span
                className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 0 4px rgba(85,107,47,0.15)" }}
              />
            </button>

            <div
              className="flex items-center gap-3 rounded-full border px-4 py-2"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)" }}
            >
              <div className="rounded-full bg-white/10 p-2">
                <UserCircle2 size={20} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Administrador
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Conta ativa
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_0.95fr] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                    Tendência consolidada de receita
                  </h2>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
                  style={{ background: "rgba(85,107,47,0.12)", color: "var(--accent)" }}
                >
                  Atualizar dados
                  <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="rounded-[28px] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <RevenueChart records={portfolioRecords} currency="USD" />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div
              className="rounded-[32px] p-6 border fade-in-up"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "var(--accent-soft)" }}>
                    IA em Tempo Real
                  </p>
                  <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    Status das últimas ações
                  </h3>
                </div>
                <Sparkles size={22} style={{ color: "var(--accent)" }} />
              </div>
              <div className="space-y-4">
                {insightAlerts.length > 0 ? (
                  insightAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-3xl p-4 border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {alert.title}
                        </p>
                        <span className="text-xs uppercase" style={{ color: "var(--accent)" }}>
                          {alert.time}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {alert.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Nenhum alerta recente. A IA está monitorando o desempenho da holding.
                  </p>
                )}
              </div>
            </div>

            <div
              className="rounded-[32px] p-6 border fade-in-up"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm uppercase tracking-[0.24em] mb-3" style={{ color: "var(--accent-soft)" }}>
                Relatórios rápidos
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-3xl border p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      Compliance AI
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Última análise feita há 12 min.
                    </p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    Em dia
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-3xl border p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      Visão de Risco
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Atualização automática de matriz.
                    </p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: highRiskCount ? "var(--danger)" : "var(--accent)" }}>
                    {highRiskCount ? "Alto" : "Estável"}
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
