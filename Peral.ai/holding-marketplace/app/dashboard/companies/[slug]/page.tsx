import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import RevenueChart from "@/components/RevenueChart";
import AIInsightPanel from "@/components/AIInsightPanel";
import {
  Globe, Users, Calendar, TrendingUp, Building2,
  Briefcase, DollarSign, ExternalLink, ArrowLeft,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const company = await prisma.company.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      assets: true,
      revenueRecords: { orderBy: [{ year: "asc" }, { month: "asc" }] },
    },
  });

  if (!company) notFound();

  // Load AI data
  const [latestInsight, latestScore, forecasts] = await Promise.all([
    prisma.aIInsight.findFirst({ where: { companyId: company.id }, orderBy: { createdAt: "desc" } }),
    prisma.companyScore.findFirst({ where: { companyId: company.id }, orderBy: { createdAt: "desc" } }),
    prisma.forecastRecord.findMany({ where: { companyId: company.id }, orderBy: [{ year: "asc" }, { month: "asc" }] }),
  ]);

  const monthlyRecords = company.revenueRecords.filter((r) => r.month !== null);
  const assetTotal = company.assets.reduce((sum, a) => sum + (a.value || 0), 0);

  const infoItems = [
    { label: "Country",   value: company.country,                          icon: Globe },
    { label: "Sector",    value: company.sector,                           icon: Briefcase },
    { label: "Currency",  value: company.currency,                         icon: DollarSign },
    { label: "Founded",   value: company.founded?.toString() || "N/A",     icon: Calendar },
    { label: "Employees", value: company.employees ? formatNumber(company.employees) : "N/A", icon: Users },
    { label: "Status",    value: company.status,                           icon: Building2 },
  ];

  return (
    <div className="flex-1">
      <Navbar title={company.name} />

      <main className="px-6 py-6">
        <Link href="/dashboard/companies"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={15} /> Back to Companies
        </Link>

        {/* Company header */}
        <div className="rounded-xl p-6 mb-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: "var(--accent)20", color: "var(--accent)" }}>
                {company.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{company.name}</h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {company.country} · {company.sector}
                </p>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs mt-1"
                    style={{ color: "var(--accent)" }}>
                    {company.website}<ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: company.status === "active" ? "var(--accent-green)20" : "var(--accent-red)20",
                color: company.status === "active" ? "var(--accent-green)" : "var(--accent-red)",
              }}>
              {company.status.toUpperCase()}
            </span>
          </div>

          {company.description && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {company.description}
            </p>
          )}

          <div className="grid grid-cols-6 gap-3 mt-5">
            {infoItems.map((item) => (
              <div key={item.label} className="rounded-lg p-3"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon size={12} style={{ color: "var(--text-secondary)" }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "Annual Revenue",  value: company.annualRevenue,  color: "var(--accent-green)", icon: TrendingUp },
            { label: "Monthly Revenue", value: company.monthlyRevenue, color: "var(--accent)", icon: TrendingUp },
            { label: "Total Assets",    value: assetTotal > 0 ? assetTotal : null, color: "var(--text-primary)", icon: Building2 },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={16} style={{ color: kpi.color }} />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{kpi.label}</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: kpi.color }}>
                {kpi.value ? formatCurrency(kpi.value, company.currency) : "—"}
              </div>
            </div>
          ))}
        </div>

        {/* AI Intelligence Panel */}
        <div className="mb-5">
          <AIInsightPanel
            companyId={company.id}
            companyName={company.name}
            currency={company.currency}
            initialInsight={latestInsight}
            initialScore={latestScore}
            initialForecast={forecasts}
            revenueHistory={company.revenueRecords}
          />
        </div>

        {/* Main revenue streams */}
        {company.mainRevenue && (
          <div className="rounded-xl p-5 mb-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Main Revenue Streams
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{company.mainRevenue}</p>
          </div>
        )}

        {/* Historical monthly chart */}
        {monthlyRecords.length > 0 && (
          <div className="rounded-xl p-5 mb-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Monthly Revenue History (2024)
            </h3>
            <RevenueChart records={monthlyRecords} currency={company.currency} />
          </div>
        )}

        {/* Assets */}
        {company.assets.length > 0 && (
          <div className="rounded-xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Assets ({company.assets.length})
            </h3>
            <div className="space-y-3">
              {company.assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{asset.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {asset.type}{asset.description ? ` · ${asset.description}` : ""}
                    </div>
                  </div>
                  {asset.value && (
                    <div className="text-sm font-semibold" style={{ color: "#10b981" }}>
                      {formatCurrency(asset.value, asset.currency)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
