"use client";

import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Globe, Users, Calendar, ArrowUpRight } from "lucide-react";
import { Company } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#10b981",
  Finance: "#22c55e",
  Healthcare: "#0f766e",
  Energy: "#16a34a",
  "Consumer Goods": "#22c55e",
  "Real Estate": "#14b8a6",
  Industrial: "#15803d",
  Telecommunications: "#0f766e",
  Materials: "#4d7c0f",
  Utilities: "#2f855a",
  Agriculture: "#22c55e",
  Retail: "#15803d",
  Automotive: "#166534",
  "Media & Entertainment": "#2f855a",
  Other: "#64748b",
};

export default function CompanyCard({ company }: { company: Company }) {
  const sectorColor = SECTOR_COLORS[company.sector] || "#64748b";

  return (
    <Link href={`/dashboard/companies/${company.slug}`}>
      <div
        className="rounded-xl p-5 transition-all cursor-pointer h-full"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = sectorColor + "60";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {company.logo ? (
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 bg-white/5">
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={44}
                  height={44}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ background: sectorColor + "20", color: sectorColor }}
              >
                {company.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
                {company.name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {company.country}
              </p>
            </div>
          </div>
          <ArrowUpRight size={15} style={{ color: "var(--text-secondary)" }} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: sectorColor + "20", color: sectorColor }}
          >
            {company.sector}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: company.status === "active" ? "var(--accent-green)20" : "var(--accent-red)20",
              color: company.status === "active" ? "var(--accent-green)" : "var(--accent-red)",
            }}
          >
            {company.status}
          </span>
        </div>

        {company.description && (
          <p className="text-xs mb-4 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {company.description}
          </p>
        )}

        <div className="space-y-2">
          {company.annualRevenue && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} style={{ color: "var(--accent-green)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Annual Revenue</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--accent-green)" }}>
                {formatCurrency(company.annualRevenue, company.currency)}
              </span>
            </div>
          )}
          {company.monthlyRevenue && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Monthly Revenue</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                {formatCurrency(company.monthlyRevenue, company.currency)}
              </span>
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-4 mt-4 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {company.employees && (
            <div className="flex items-center gap-1">
              <Users size={12} style={{ color: "var(--text-secondary)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {formatNumber(company.employees)}
              </span>
            </div>
          )}
          {company.founded && (
            <div className="flex items-center gap-1">
              <Calendar size={12} style={{ color: "var(--text-secondary)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {company.founded}
              </span>
            </div>
          )}
          {company.currency && (
            <div className="flex items-center gap-1">
              <Globe size={12} style={{ color: "var(--text-secondary)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {company.currency}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
