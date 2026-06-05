"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import TokenBalanceMini from "@/components/TokenBalanceMini";
import NotificationDropdown from "@/components/NotificationDropdown";

interface NavbarProps { title: string }

export default function Navbar({ title }: NavbarProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Usuário";
  const userRole = (session?.user as { role?: string })?.role || "viewer";
  const initials = userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 60,
      background: "rgba(5,5,5,.85)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,.06)",
    }}>

      {/* Título da página */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: "var(--accent)" }} />
        <h1 style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-.01em", margin: 0 }}>
          {title}
        </h1>
      </div>

      {/* Ações direita */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        {/* Widget de saldo de tokens */}
        <TokenBalanceMini />

        {/* Notificações em tempo real */}
        <NotificationDropdown />

        {/* Divisor */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.07)" }} />

        {/* User pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "6px 12px 6px 8px", borderRadius: 12,
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.07)",
          cursor: "default",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".02em",
          }}>
            {initials || <User size={14} color="#fff" />}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
              {userName}
            </div>
            <div style={{ fontSize: 10, color: "var(--accent-soft)", letterSpacing: ".04em", textTransform: "uppercase" }}>
              {userRole}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
