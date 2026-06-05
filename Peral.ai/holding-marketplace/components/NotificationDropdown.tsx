"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, Info, TrendingUp, CheckCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "alert" | "warning" | "info" | "success";
  title: string;
  message: string;
  companySlug?: string;
  companyName?: string;
  relativeTime: string;
}

const TYPE_CONFIG = {
  alert:   { icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,.1)",    border: "rgba(239,68,68,.2)"    },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,.1)",   border: "rgba(245,158,11,.2)"   },
  info:    { icon: Info,          color: "#60a5fa", bg: "rgba(96,165,250,.1)",    border: "rgba(96,165,250,.2)"   },
  success: { icon: CheckCircle,   color: "#10b981", bg: "rgba(16,185,129,.1)",   border: "rgba(16,185,129,.2)"   },
};

export default function NotificationDropdown() {
  const [open, setOpen]                 = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [loading, setLoading]           = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount     ?? 0);
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: "relative",
          width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
          background: open ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background .15s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
      >
        <Bell size={15} color="rgba(255,255,255,.55)" strokeWidth={1.8} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 5, right: 5,
            width: 7, height: 7, borderRadius: "50%",
            background: "#ef4444",
            boxShadow: "0 0 0 2px rgba(5,5,5,.85)",
          }} />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 380, maxHeight: 520,
          borderRadius: 18,
          background: "rgba(12,12,12,.97)",
          border: "1px solid rgba(255,255,255,.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,.6)",
          backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          zIndex: 200,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px 12px",
            borderBottom: "1px solid rgba(255,255,255,.07)",
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Notificações</p>
              {unreadCount > 0 && (
                <p style={{ fontSize: 11, color: "var(--accent-soft)", margin: "2px 0 0" }}>
                  {unreadCount} novo{unreadCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <X size={14} color="rgba(255,255,255,.35)" />
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>Carregando…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center" }}>
                <Bell size={28} color="rgba(255,255,255,.15)" style={{ margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>Nenhuma notificação.</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.2)", marginTop: 4 }}>
                  Analise empresas para gerar insights.
                </p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                const content = (
                  <div key={n.id} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "12px 18px",
                    borderBottom: i < notifications.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none",
                    transition: "background .1s",
                    cursor: n.companySlug ? "pointer" : "default",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={14} color={cfg.color} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <p style={{
                          fontSize: 12, fontWeight: 600, color: "#fff", margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {n.title}
                        </p>
                        {n.companySlug && (
                          <ArrowUpRight size={12} color="rgba(255,255,255,.25)" style={{ flexShrink: 0, marginTop: 2 }} />
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.45)", margin: "3px 0 0", lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,.25)", margin: "5px 0 0" }}>
                        {n.relativeTime}
                      </p>
                    </div>
                  </div>
                );

                return n.companySlug ? (
                  <Link key={n.id} href={`/dashboard/companies/${n.companySlug}`} style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : content;
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <Link
              href="/dashboard/ai"
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 12, color: "var(--accent-soft)", textDecoration: "none",
                padding: "8px 0",
                transition: "color .15s",
              }}
            >
              <TrendingUp size={13} />
              Ver todas as análises de IA
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
