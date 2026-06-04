"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Balance {
  tokenType: string;
  icon: string;
  balance: number;
  autoRechargeThreshold: number;
}

export default function TokenBalanceMini() {
  const [balances, setBalances] = useState<Balance[]>([]);

  useEffect(() => {
    fetch("/api/tokens/balance")
      .then(r => r.json())
      .then(d => setBalances(d.balances ?? []))
      .catch(() => {});
  }, []);

  if (balances.length === 0) return null;

  return (
    <Link href="/dashboard/tokens" style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 10px", borderRadius: 10,
        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
        transition: "all .15s", cursor: "pointer",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
      >
        {balances.map((b) => {
          const isLow = b.balance <= b.autoRechargeThreshold;
          return (
            <span key={b.tokenType} style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 11, fontWeight: 600,
              color: isLow ? "#f87171" : "rgba(255,255,255,.55)",
            }}>
              <span>{b.icon}</span>
              <span>{b.balance}</span>
            </span>
          );
        }).reduce<React.ReactNode[]>((acc, el, i) => {
          if (i > 0) acc.push(<span key={`sep-${i}`} style={{ color: "rgba(255,255,255,.15)", fontSize: 10 }}>·</span>);
          acc.push(el);
          return acc;
        }, [])}
      </div>
    </Link>
  );
}
