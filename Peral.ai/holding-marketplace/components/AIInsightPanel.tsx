"use client";

import { useState } from "react";
import {
  Brain, RefreshCw, TrendingUp, AlertTriangle,
  Lightbulb, ChevronDown, ChevronUp, Cpu, Clock,
} from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import ForecastChart from "./ForecastChart";
import type { AIInsight, CompanyScore, ForecastRecord, RevenueRecord } from "@prisma/client";

interface Props {
  companyId: string;
  companyName: string;
  currency: string;
  initialInsight: AIInsight | null;
  initialScore: CompanyScore | null;
  initialForecast: ForecastRecord[];
  revenueHistory: RevenueRecord[];
}

const OUTLOOK_CONFIG = {
  bullish:  { color: "#10b981", label: "Bullish",  bg: "#10b98120" },
  neutral:  { color: "#f59e0b", label: "Neutral",  bg: "#f59e0b20" },
  bearish:  { color: "#ef4444", label: "Bearish",  bg: "#ef444420" },
  cautious: { color: "#8b5cf6", label: "Cautious", bg: "#8b5cf620" },
};

const RISK_CONFIG = {
  low:      { color: "#10b981", label: "Low Risk"      },
  medium:   { color: "#f59e0b", label: "Medium Risk"   },
  high:     { color: "#ef4444", label: "High Risk"     },
  critical: { color: "#7f1d1d", label: "Critical Risk" },
};

export default function AIInsightPanel({
  companyId, currency,
  initialInsight, initialScore, initialForecast, revenueHistory,
}: Props) {
  const [insight, setInsight]   = useState<AIInsight | null>(initialInsight);
  const [score, setScore]       = useState<CompanyScore | null>(initialScore);
  const [forecast, setForecast] = useState<ForecastRecord[]>(initialForecast);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [histExpanded, setHistExpanded] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const [insRes, scRes] = await Promise.all([
        fetch(`/api/ai/analyze/${companyId}`, { method: "POST" }),
        fetch(`/api/ai/score/${companyId}`,   { method: "POST" }),
        fetch(`/api/ai/forecast/${companyId}`, { method: "POST" }),
      ]);

      if (!insRes.ok) {
        const e = await insRes.json();
        throw new Error(e.error ?? "Analysis failed");
      }

      const [ins, sc] = await Promise.all([insRes.json(), scRes.json()]);

      setInsight(ins);
      setScore(sc);

      const fcGet = await fetch(`/api/ai/forecast/${companyId}`);
      if (fcGet.ok) setForecast(await fcGet.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setLoading(false);
  }

  const outlook = insight?.outlook as keyof typeof OUTLOOK_CONFIG | undefined;
  const outlookCfg = outlook ? OUTLOOK_CONFIG[outlook] ?? OUTLOOK_CONFIG.neutral : null;
  const riskCfg = score ? RISK_CONFIG[score.riskLevel as keyof typeof RISK_CONFIG] : null;

  const scoreItems = score
    ? [
        { label: "Revenue Health", value: score.revenueHealth },
        { label: "Growth Trend",   value: score.growthScore },
        { label: "Asset Coverage", value: score.assetCoverage },
        { label: "Efficiency",     value: score.efficiency },
      ]
    : [];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)20" }}>
            <Brain size={16} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              AI Intelligence Agent
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {insight
                ? `Last analysis: ${new Date(insight.createdAt).toLocaleDateString()}`
                : "No analysis yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {insight?.cacheHit && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }}>
              <Cpu size={10} className="inline mr-1" />cache hit
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: loading ? "var(--bg-card)" : "var(--accent)",
              color: loading ? "var(--text-secondary)" : "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Analyzing…" : insight ? "Re-analyze" : "Run Analysis"}
          </button>
          {expanded ? <ChevronUp size={16} style={{ color: "var(--text-secondary)" }} />
                    : <ChevronDown size={16} style={{ color: "var(--text-secondary)" }} />}
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: "#ef444415", border: "1px solid #ef444430", color: "#ef4444" }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Score + breakdown */}
          {score ? (
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-1 flex flex-col items-center gap-1">
                <ScoreGauge score={score.overall} size="lg" />
                {riskCfg && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                    style={{ color: riskCfg.color, background: riskCfg.color + "20" }}>
                    {riskCfg.label}
                  </span>
                )}
              </div>
              <div className="col-span-4 grid grid-cols-2 gap-3">
                {scoreItems.map((item) => (
                  <div key={item.label} className="rounded-lg p-3"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                      <span className="text-xs font-bold"
                        style={{ color: item.value >= 70 ? "#10b981" : item.value >= 45 ? "#f59e0b" : "#ef4444" }}>
                        {item.value}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${item.value}%`,
                          background: item.value >= 70 ? "#10b981" : item.value >= 45 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 rounded-lg"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Run analysis to generate financial score
              </p>
            </div>
          )}

          {/* AI Insight */}
          {insight && (
            <div className="space-y-3">
              {/* Summary + outlook */}
              <div className="flex items-start gap-3 p-4 rounded-lg"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <Lightbulb size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      Executive Summary
                    </span>
                    {outlookCfg && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: outlookCfg.bg, color: outlookCfg.color }}>
                        {outlookCfg.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {insight.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg"
                  style={{ background: "#10b98108", border: "1px solid #10b98125" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={13} color="#10b981" />
                    <span className="text-xs font-semibold" style={{ color: "#10b981" }}>Strengths</span>
                  </div>
                  <ul className="space-y-1">
                    {insight.strengths.split(",").map((s, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"
                        style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "#10b981" }}>·</span>{s.trim()}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg"
                  style={{ background: "#ef444408", border: "1px solid #ef444425" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={13} color="#ef4444" />
                    <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>Risks</span>
                  </div>
                  <ul className="space-y-1">
                    {insight.risks.split(",").map((r, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"
                        style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "#ef4444" }}>·</span>{r.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: "var(--accent)08", border: "1px solid var(--accent)25" }}>
                <Brain size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  <span className="font-semibold" style={{ color: "var(--accent)" }}>Recommendation: </span>
                  {insight.recommendation}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Clock size={11} style={{ color: "var(--text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Generated {new Date(insight.createdAt).toLocaleString()} · {insight.modelUsed}
                  {insight.inputTokens ? ` · ${insight.inputTokens} tokens` : ""}
                </span>
              </div>
            </div>
          )}

          {/* Forecast chart */}
          {(forecast.length > 0 || revenueHistory.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Revenue Forecast (6-month · Holt&apos;s smoothing · 80% CI)
                </h4>
                <button
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={() => setHistExpanded((v) => !v)}
                >
                  {histExpanded ? "Hide history" : "Show history"}
                </button>
              </div>
              <ForecastChart
                historical={revenueHistory}
                forecast={forecast}
                currency={currency}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
