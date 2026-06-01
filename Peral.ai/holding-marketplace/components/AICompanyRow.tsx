"use client";

import Link from "next/link";
import ScoreGauge from "./ScoreGauge";

interface SubScore {
  label: string;
  value: number;
}

interface Props {
  slug: string;
  name: string;
  sector: string;
  country: string;
  trend: string;
  overall: number;
  riskLevel: string;
  riskColor: string;
  outlook: string | null;
  outlookIcon: string | null;
  outlookColor: string | null;
  summary: string | null;
  subScores: SubScore[];
}

export default function AICompanyRow({
  slug, name, sector, country, trend, overall,
  riskLevel, riskColor, outlook, outlookIcon, outlookColor,
  summary, subScores,
}: Props) {
  return (
    <Link href={`/dashboard/companies/${slug}`}>
      <div
        className="rounded-xl p-5 transition-all"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <div className="flex items-center gap-5">
          <ScoreGauge score={overall} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {name}
              </h4>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: riskColor + "20", color: riskColor }}
              >
                {riskLevel}
              </span>
              {outlookIcon && outlookColor && (
                <span className="text-xs font-bold" style={{ color: outlookColor }}>
                  {outlookIcon} {outlook}
                </span>
              )}
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
              {sector} · {country} · Revenue trend: {trend}
            </p>
            {summary ? (
              <p className="text-xs line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                {summary}
              </p>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--text-secondary)" }}>
                No AI analysis yet — open company to generate
              </p>
            )}
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-2 w-52 flex-shrink-0">
            {subScores.map((sub) => (
              <div key={sub.label} className="flex items-center gap-1.5">
                <span className="text-xs w-10 flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {sub.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${sub.value}%`,
                      background: sub.value >= 70 ? "var(--accent-green)" : sub.value >= 45 ? "var(--accent-yellow)" : "var(--accent-red)",
                    }}
                  />
                </div>
                <span
                  className="text-xs w-6 text-right font-medium"
                  style={{ color: sub.value >= 70 ? "var(--accent-green)" : sub.value >= 45 ? "var(--accent-yellow)" : "var(--accent-red)" }}
                >
                  {sub.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
