"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, RefreshCw } from "lucide-react";

interface PackageInfo {
  size: string;
  qty: number;
  priceBrl: number;
  label: string;
  hasPrice: boolean;
}

interface Props {
  tokenType: string;
  label: string;
  description: string;
  icon: string;
  balance: number;
  monthlyQuota: number;
  totalUsed: number;
  daysUntilReset: number | null;
  autoRecharge: boolean;
  autoRechargeThreshold: number;
  packages: PackageInfo[];
}

export default function TokenBalanceCard({
  tokenType, label, description, icon,
  balance, monthlyQuota, totalUsed, daysUntilReset,
  autoRecharge, autoRechargeThreshold, packages,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usedPercent = monthlyQuota > 0 ? Math.min(100, Math.round((totalUsed / monthlyQuota) * 100)) : 0;
  const isLow = balance <= autoRechargeThreshold && balance >= 0;
  const accentColor = isLow ? "#ef4444" : "#8aa26a";

  const handleBuy = async (size: string) => {
    setLoading(size);
    setError(null);
    try {
      const res = await fetch("/api/tokens/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenType, packageSize: size }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao comprar"); return; }
      if (data.url) router.push(data.url);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{
      borderRadius: 20, padding: "24px",
      background: "rgba(255,255,255,.03)",
      border: `1px solid ${isLow ? "rgba(239,68,68,.25)" : "rgba(255,255,255,.08)"}`,
      display: "flex", flexDirection: "column", gap: 18,
      boxShadow: isLow ? "0 0 24px rgba(239,68,68,.08)" : "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, fontSize: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${accentColor}18`, border: `1px solid ${accentColor}30`,
          }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{label}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{description}</p>
          </div>
        </div>

        {/* Saldo destaque */}
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{balance}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>disponíveis</p>
        </div>
      </div>

      {/* Barra de uso */}
      {monthlyQuota > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
              {totalUsed} de {monthlyQuota} usados este mês
            </span>
            {daysUntilReset !== null && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", display: "flex", alignItems: "center", gap: 4 }}>
                <RefreshCw size={10} /> reset em {daysUntilReset}d
              </span>
            )}
          </div>
          <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${usedPercent}%`,
              background: usedPercent >= 90 ? "rgba(239,68,68,.7)" : "rgba(138,162,106,.6)",
              transition: "width .4s ease",
            }} />
          </div>
        </div>
      )}

      {/* Alerta saldo baixo */}
      {isLow && (
        <div style={{
          padding: "10px 12px", borderRadius: 10,
          background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
          fontSize: 12, color: "#f87171",
        }}>
          ⚠ Saldo baixo. {autoRecharge ? "Recarga automática será acionada." : "Compre mais créditos abaixo."}
        </div>
      )}

      {/* Pacotes */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 10 }}>
          Comprar pacote
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {packages.map((pkg) => (
            <button
              key={pkg.size}
              onClick={() => handleBuy(pkg.size)}
              disabled={!!loading || !pkg.hasPrice}
              style={{
                flex: 1, minWidth: 90, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.04)", color: pkg.hasPrice ? "#fff" : "rgba(255,255,255,.3)",
                fontSize: 12, fontWeight: 600, cursor: pkg.hasPrice && !loading ? "pointer" : "not-allowed",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .15s",
              }}
              onMouseEnter={e => { if (pkg.hasPrice && !loading) e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
            >
              {loading === pkg.size
                ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                : <ShoppingCart size={14} />
              }
              <span>{pkg.label}</span>
              <span style={{ color: "#8aa26a", fontWeight: 700 }}>R$ {pkg.priceBrl}</span>
            </button>
          ))}
        </div>
        {error && <p style={{ fontSize: 11, color: "#f87171", marginTop: 8 }}>{error}</p>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
