"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TreeDeciduous, Brain, FileText, Search, LogOut, CreditCard } from "lucide-react";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Visão Geral"           },
  { href: "/dashboard/companies", icon: TreeDeciduous,   label: "Estrutura da Holding"  },
  { href: "/dashboard/ai",        icon: Brain,           label: "Insights de IA"        },
  { href: "/dashboard/intel",     icon: Search,          label: "Pesquisa & Intel"      },
  { href: "/dashboard/billing",   icon: CreditCard,      label: "Assinatura"            },
  { href: "/dashboard/admin",     icon: FileText,        label: "Relatórios"            },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, bottom: 0,
      width: 240, zIndex: 30, display: "flex", flexDirection: "column",
      background: "rgba(0,0,0,.85)",
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      borderRight: "1px solid rgba(255,255,255,.06)",
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: "22px 20px 18px",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/pearl-logo.png"
            alt="Pearl.AI"
            width={28} height={28}
            style={{ objectFit: "contain", display: "block" }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1.2, letterSpacing: "-.01em" }}>
            Pearl<span style={{ color: "var(--accent-soft)" }}>.AI</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 2, letterSpacing: ".04em" }}>
            Portfolio Studio
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12,
              fontSize: 13, fontWeight: active ? 600 : 400,
              letterSpacing: "-.005em",
              textDecoration: "none",
              transition: "all .15s",
              background: active ? "rgba(85,107,47,.14)" : "transparent",
              color: active ? "var(--accent-soft)" : "rgba(255,255,255,.45)",
              borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`,
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background="rgba(255,255,255,.04)"; e.currentTarget.style.color="rgba(255,255,255,.75)"; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,.45)"; } }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider decorativo ── */}
      <div style={{ margin: "0 10px", height: 1, background: "linear-gradient(90deg,transparent,rgba(85,107,47,.3),transparent)" }} />

      {/* ── Sign out ── */}
      <div style={{ padding: "12px 10px" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "10px 12px", borderRadius: 12, border: "none",
            fontSize: 13, fontWeight: 400, cursor: "pointer",
            background: "transparent", color: "rgba(255,255,255,.35)",
            transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,95,95,.1)"; e.currentTarget.style.color = "#ff7070"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.35)"; }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sair
        </button>
      </div>
    </aside>
  );
}
