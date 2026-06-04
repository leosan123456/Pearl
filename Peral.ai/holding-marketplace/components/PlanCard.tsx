"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Star, Zap, Loader2 } from "lucide-react";
import type { PlanId } from "@/lib/stripe";

interface Props {
  planId: PlanId;
  name: string;
  description: string;
  brl: number;
  features: readonly string[];
  trialDays: number;
  badge?: string;
  currentPlan?: string | null;
  currentStatus?: string | null;
}

export default function PlanCard({
  planId, name, description, brl, features, trialDays, badge,
  currentPlan, currentStatus,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrent = currentPlan === planId && currentStatus && currentStatus !== "canceled";
  const isFeatured = planId === "business";

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao iniciar checkout");
        return;
      }
      if (data.url) router.push(data.url);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      borderRadius: 24, padding: "36px 32px", position: "relative", overflow: "hidden",
      background: isFeatured ? "rgba(85,107,47,.08)" : "rgba(255,255,255,.03)",
      border: isFeatured
        ? "1px solid rgba(85,107,47,.35)"
        : "1px solid rgba(255,255,255,.08)",
      boxShadow: isFeatured ? "0 0 60px rgba(85,107,47,.12)" : "none",
      transition: "border-color .2s",
    }}>
      {/* Badge */}
      {badge && (
        <div style={{
          position: "absolute", top: 20, right: 20,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(85,107,47,.2)", border: "1px solid rgba(85,107,47,.4)",
          borderRadius: 50, padding: "4px 12px 4px 8px",
        }}>
          <Star size={11} color="#8aa26a" fill="#8aa26a" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8aa26a" }}>{badge}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          background: isFeatured ? "rgba(85,107,47,.25)" : "rgba(255,255,255,.06)",
          border: `1px solid ${isFeatured ? "rgba(85,107,47,.4)" : "rgba(255,255,255,.1)"}`,
        }}>
          <Zap size={16} color={isFeatured ? "#8aa26a" : "rgba(255,255,255,.6)"}
            fill={isFeatured ? "rgba(85,107,47,.3)" : "none"} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{name}</span>
      </div>

      {/* Preço */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: "-.04em", lineHeight: 1 }}>
          R$ {brl}
        </span>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,.35)", marginLeft: 4 }}>/mês</span>
      </div>
      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.42)", lineHeight: 1.6, marginBottom: 8, marginTop: 10 }}>
        {description}
      </p>
      <p style={{ fontSize: 12, color: "rgba(138,162,106,.7)", marginBottom: 28 }}>
        {trialDays} dias grátis · Cancele a qualquer momento
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: isFeatured ? "rgba(85,107,47,.25)" : "rgba(255,255,255,.07)", marginBottom: 24 }} />

      {/* Features */}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((feat) => (
          <li key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "rgba(255,255,255,.75)" }}>
            <span style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: isFeatured ? "rgba(85,107,47,.25)" : "rgba(255,255,255,.07)",
              border: `1px solid ${isFeatured ? "rgba(85,107,47,.4)" : "rgba(255,255,255,.1)"}`,
            }}>
              <Check size={11} color={isFeatured ? "#8aa26a" : "rgba(255,255,255,.6)"} strokeWidth={2.5} />
            </span>
            {feat}
          </li>
        ))}
      </ul>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, textAlign: "center" }}>{error}</p>
      )}

      {/* CTA */}
      {isCurrent ? (
        <div style={{
          width: "100%", padding: "14px", borderRadius: 50, textAlign: "center",
          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
          fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.5)",
        }}>
          Plano atual
        </div>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: "100%", padding: "14px 32px", borderRadius: 50, border: "none", cursor: loading ? "wait" : "pointer",
            background: isFeatured
              ? "linear-gradient(135deg,#556b2f,#4a5d23)"
              : "rgba(255,255,255,.07)",
            color: "#fff", fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: isFeatured ? "0 4px 24px rgba(85,107,47,.4)" : "none",
            transition: "all .2s",
          }}
        >
          {loading
            ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : <>
                {currentPlan && currentStatus !== "canceled" ? "Fazer upgrade" : "Assinar agora"}
                <ArrowRight size={15} strokeWidth={2.5} />
              </>
          }
        </button>
      )}
    </div>
  );
}
