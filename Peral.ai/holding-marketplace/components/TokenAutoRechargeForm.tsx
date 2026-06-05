"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { TOKEN_LABELS, type TokenType, type PackageSize } from "@/lib/token-types";

interface Props {
  tokenType: TokenType;
  enabled: boolean;
  threshold: number;
  packageSize: PackageSize;
  onSaved?: () => void;
}

const PACKAGE_OPTIONS: { value: PackageSize; label: string }[] = [
  { value: "small",  label: "Pequeno" },
  { value: "medium", label: "Médio"   },
  { value: "large",  label: "Grande"  },
];

export default function TokenAutoRechargeForm({
  tokenType, enabled: initialEnabled, threshold: initialThreshold,
  packageSize: initialPackage, onSaved,
}: Props) {
  const [enabled,  setEnabled]  = useState(initialEnabled);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [pkg,      setPkg]      = useState<PackageSize>(initialPackage);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const tokenLabel = TOKEN_LABELS[tokenType]?.label ?? tokenType;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/tokens/auto-recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenType, enabled, threshold, packageSize: pkg }),
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      padding: "18px 20px", borderRadius: 16,
      background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={14} color="#8aa26a" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
            Recarga automática — {tokenLabel}
          </span>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setEnabled(v => !v)}
          style={{
            width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
            background: enabled ? "rgba(85,107,47,.5)" : "rgba(255,255,255,.1)",
            position: "relative", transition: "background .2s",
          }}
        >
          <div style={{
            position: "absolute", top: 3, borderRadius: "50%", width: 18, height: 18,
            background: enabled ? "#8aa26a" : "rgba(255,255,255,.4)",
            left: enabled ? 23 : 3,
            transition: "left .2s, background .2s",
          }} />
        </button>
      </div>

      {enabled && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,.4)", display: "block", marginBottom: 6 }}>
              Recarregar quando saldo ≤
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="number" min={1} max={50} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{
                  width: 70, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)",
                  background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 14, fontWeight: 600, outline: "none",
                }}
              />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>créditos</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,.4)", display: "block", marginBottom: 6 }}>
              Pacote a comprar
            </label>
            <select
              value={pkg} onChange={e => setPkg(e.target.value as PackageSize)}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 13, outline: "none",
              }}
            >
              {PACKAGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave} disabled={saving}
            style={{
              padding: "9px 18px", borderRadius: 10, cursor: saving ? "wait" : "pointer",
              background: saved ? "rgba(16,185,129,.2)" : "rgba(85,107,47,.2)",
              border: `1px solid ${saved ? "rgba(16,185,129,.3)" : "rgba(85,107,47,.3)"}`,
              color: saved ? "#34d399" : "#8aa26a",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all .15s",
            } as React.CSSProperties}
          >
            {saving
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Salvando</>
              : saved ? "✓ Salvo" : "Salvar"
            }
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
