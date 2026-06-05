import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";
import ParallaxBg from "@/components/ParallaxBg";
import { AlertTriangle } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id: string }).id;

  // Ler o pathname atual (injetado pelo middleware)
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";
  const isSetupPath = pathname.startsWith("/dashboard/setup");

  // Buscar usuário e assinatura em paralelo
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { profileCompleted: true },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    }),
  ]);

  // Não redirecionar se já estiver no setup — evita loop infinito
  if (!user?.profileCompleted && !isSetupPath) {
    redirect("/dashboard/setup");
  }

  // Assinatura cancelada ou sem pagamento → mostrar banner, mas ainda permitir acesso ao billing
  const blockedStatuses = ["canceled", "unpaid"];
  const isBlocked = subscription && blockedStatuses.includes(subscription.status);

  return (
    <SessionProvider>
      <div className="flex min-h-screen dashboard-backdrop">
        <ParallaxBg />
        <Sidebar />

        <div
          className="flex-1 dashboard-content"
          style={{ marginLeft: 240, minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          {/* Banner de assinatura expirada */}
          {isBlocked && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "12px 24px",
              background: "rgba(239,68,68,.1)", borderBottom: "1px solid rgba(239,68,68,.2)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={16} color="#ef4444" />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>
                  {subscription.status === "canceled"
                    ? "Sua assinatura foi cancelada."
                    : "Pagamento não realizado. Sua conta está suspensa."}
                  {" "}Renove para continuar usando o Pearl.AI.
                </p>
              </div>
              <a
                href="/dashboard/billing"
                style={{
                  fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
                  background: "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.35)",
                  color: "#f87171", textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                Renovar agora
              </a>
            </div>
          )}

          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
