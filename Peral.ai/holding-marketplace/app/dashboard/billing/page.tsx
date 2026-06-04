import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BILLING_PLANS, STATUS_LABELS } from "@/lib/stripe";
import Navbar from "@/components/Navbar";
import PlanCard from "@/components/PlanCard";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import BillingPortalButton from "@/components/BillingPortalButton";
import { CreditCard, Calendar, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; plan?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const params = await searchParams;

  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  const trialDaysLeft = subscription?.trialEnd
    ? Math.max(0, Math.ceil((subscription.trialEnd.getTime() - Date.now()) / 86_400_000))
    : null;

  const statusMeta = subscription
    ? (STATUS_LABELS[subscription.status] ?? { label: subscription.status, color: "#6b7280" })
    : null;

  const formatDate = (date: Date | null | undefined) =>
    date ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  return (
    <div className="flex-1">
      <Navbar title="Assinatura" />

      <main className="px-6 py-6 max-w-4xl">

        {/* ── Banner de sucesso ────────────────────────────────────────────── */}
        {params.success && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px", borderRadius: 14, marginBottom: 24,
            background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.25)",
          }}>
            <CheckCircle2 size={18} color="#10b981" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>Assinatura ativada com sucesso!</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>
                Seu trial de {BILLING_PLANS[params.plan as keyof typeof BILLING_PLANS]?.trialDays ?? 14} dias começou. Nenhuma cobrança até o término.
              </p>
            </div>
          </div>
        )}

        {/* ── Banner de cancelamento ───────────────────────────────────────── */}
        {params.canceled && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px", borderRadius: 14, marginBottom: 24,
            background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)",
          }}>
            <Info size={18} color="#f59e0b" />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.7)" }}>
              Checkout cancelado. Nenhuma cobrança foi realizada.
            </p>
          </div>
        )}

        {/* ── Status da assinatura atual ───────────────────────────────────── */}
        <div style={{
          borderRadius: 20, padding: "24px", marginBottom: 24,
          background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent-soft)", marginBottom: 16 }}>
            Plano atual
          </p>

          {subscription ? (
            <>
              <SubscriptionBadge
                plan={subscription.plan}
                status={subscription.status}
                trialDaysLeft={trialDaysLeft}
              />

              {/* Alertas */}
              {subscription.status === "past_due" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginTop: 14,
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                }}>
                  <AlertTriangle size={15} color="#ef4444" />
                  <p style={{ fontSize: 13, color: "#f87171" }}>
                    Pagamento em atraso. Atualize seu método de pagamento para continuar usando o Pearl.AI.
                  </p>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginTop: 14,
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",
                }}>
                  <AlertTriangle size={15} color="#f59e0b" />
                  <p style={{ fontSize: 13, color: "#fbbf24" }}>
                    Assinatura cancelada. Acesso até {formatDate(subscription.currentPeriodEnd)}.
                  </p>
                </div>
              )}

              {/* Detalhes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
                {[
                  {
                    icon: Calendar,
                    label: subscription.status === "trialing" ? "Trial termina em" : "Próxima cobrança",
                    value: formatDate(subscription.status === "trialing" ? subscription.trialEnd : subscription.currentPeriodEnd),
                    color: statusMeta?.color ?? "#6b7280",
                  },
                  {
                    icon: CreditCard,
                    label: "Status",
                    value: statusMeta?.label ?? subscription.status,
                    color: statusMeta?.color ?? "#6b7280",
                  },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <item.icon size={13} color="rgba(255,255,255,.35)" />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                        {item.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Botão de gerenciar */}
              <div style={{ marginTop: 18 }}>
                <BillingPortalButton />
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CreditCard size={36} color="rgba(255,255,255,.2)" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)" }}>
                Você ainda não tem uma assinatura ativa.
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 4 }}>
                Escolha um plano abaixo para começar com {BILLING_PLANS.personal.trialDays} dias grátis.
              </p>
            </div>
          )}
        </div>

        {/* ── Cards de planos ─────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent-soft)", marginBottom: 16 }}>
            {subscription && subscription.status !== "canceled" ? "Alterar plano" : "Escolha seu plano"}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {Object.values(BILLING_PLANS).map((plan) => (
              <PlanCard
                key={plan.id}
                planId={plan.id}
                name={plan.name}
                description={plan.description}
                brl={plan.brl}
                features={plan.features}
                trialDays={plan.trialDays}
                badge={"badge" in plan ? plan.badge : undefined}
                currentPlan={subscription?.plan ?? null}
                currentStatus={subscription?.status ?? null}
              />
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,.22)" }}>
            Pagamentos processados com segurança pelo Stripe · PIX e cartão · Cancele a qualquer momento
          </p>
        </div>

      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
