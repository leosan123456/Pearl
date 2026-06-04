"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Loader2 } from "lucide-react";

export default function BillingPortalButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao abrir portal");
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
    <div>
      <button
        onClick={openPortal}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "11px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)",
          background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.75)",
          fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer",
          transition: "all .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
      >
        {loading
          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          : <Settings size={14} />
        }
        Gerenciar assinatura
      </button>

      {error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{error}</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
