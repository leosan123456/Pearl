import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TokenBalanceCard from "@/components/TokenBalanceCard";
import TokenAutoRechargeForm from "@/components/TokenAutoRechargeForm";
import { getBalances, TOKEN_LABELS, type TokenType, type PackageSize } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, Info, ArrowUpRight, Clock } from "lucide-react";

export default async function TokensPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; canceled?: string; type?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const params = await searchParams;

  const [balances, transactions] = await Promise.all([
    getBalances(userId),
    prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const TYPE_LABELS: Record<string, string> = {
    quota_grant:   "Cota mensal",
    usage:         "Uso",
    purchase:      "Compra",
    auto_recharge: "Recarga automática",
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex-1">
      <Navbar title="Tokens & Créditos" />

      <main className="px-6 py-6 max-w-5xl">

        {/* ── Banner de sucesso ───────────────────────────────────────────── */}
        {params.purchased && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px", borderRadius: 14, marginBottom: 24,
            background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.25)",
          }}>
            <CheckCircle2 size={18} color="#10b981" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>Créditos adicionados!</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>
                Seus {TOKEN_LABELS[params.type as TokenType]?.label ?? "tokens"} foram creditados na sua conta.
              </p>
            </div>
          </div>
        )}

        {params.canceled && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px", borderRadius: 14, marginBottom: 24,
            background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)",
          }}>
            <Info size={18} color="#f59e0b" />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.7)" }}>
              Compra cancelada. Nenhuma cobrança foi realizada.
            </p>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent-soft)", marginBottom: 6 }}>
            Saldo por funcionalidade
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>
            Cada operação consome créditos independentes. A cota mensal é reposta automaticamente na renovação da assinatura.
          </p>
        </div>

        {/* ── Cards de saldo ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
          {balances.map((b) => {
            const daysUntilReset = b.quotaResetAt
              ? Math.max(0, Math.ceil((b.quotaResetAt.getTime() - Date.now()) / 86_400_000))
              : null;
            const label = TOKEN_LABELS[b.tokenType as TokenType];
            const packages = [
              { size: "small",  qty: 0, priceBrl: 0, label: "Pequeno", hasPrice: false },
              { size: "medium", qty: 0, priceBrl: 0, label: "Médio",   hasPrice: false },
              { size: "large",  qty: 0, priceBrl: 0, label: "Grande",  hasPrice: false },
            ];

            return (
              <TokenBalanceCard
                key={b.tokenType}
                tokenType={b.tokenType}
                label={label?.label       ?? b.tokenType}
                description={label?.description ?? ""}
                icon={label?.icon         ?? "🔹"}
                balance={b.balance}
                monthlyQuota={b.monthlyQuota}
                totalUsed={b.totalUsed}
                daysUntilReset={daysUntilReset}
                autoRecharge={b.autoRecharge}
                autoRechargeThreshold={b.autoRechargeThreshold}
                packages={packages}
              />
            );
          })}
        </div>

        {/* ── Configuração de recarga automática ──────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent-soft)", marginBottom: 16 }}>
            Recarga automática
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {balances.map((b) => (
              <TokenAutoRechargeForm
                key={b.tokenType}
                tokenType={b.tokenType as TokenType}
                enabled={b.autoRecharge}
                threshold={b.autoRechargeThreshold}
                packageSize={b.autoRechargePackage as PackageSize}
              />
            ))}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)", marginTop: 12 }}>
            A recarga automática usa o cartão cadastrado na sua assinatura. Certifique-se de ter um método de pagamento ativo.
          </p>
        </div>

        {/* ── Histórico de transações ─────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent-soft)" }}>
              Histórico de transações
            </p>
            <a href="/api/tokens/transactions" target="_blank" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(255,255,255,.35)", textDecoration: "none" }}>
              Ver tudo <ArrowUpRight size={12} />
            </a>
          </div>

          <div style={{
            borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(255,255,255,.07)",
          }}>
            {transactions.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center" }}>
                <Clock size={28} color="rgba(255,255,255,.2)" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>Nenhuma transação ainda.</p>
              </div>
            ) : (
              transactions.map((t, i) => {
                const label = TOKEN_LABELS[t.tokenType as TokenType];
                const isCredit = t.amount > 0;
                return (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 18px", gap: 12,
                    background: i % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent",
                    borderBottom: i < transactions.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{label?.icon ?? "🔹"}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.description ?? TYPE_LABELS[t.type] ?? t.type}
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
                          {label?.label ?? t.tokenType} · {formatDate(t.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: isCredit ? "#10b981" : "#f87171" }}>
                        {isCredit ? "+" : ""}{t.amount}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>saldo: {t.balanceAfter}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
