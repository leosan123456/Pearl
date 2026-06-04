"use client";

import { STATUS_LABELS, BILLING_PLANS, type PlanId } from "@/lib/stripe";
import { Zap } from "lucide-react";

interface Props {
  plan: string;
  status: string;
  trialDaysLeft?: number | null;
  compact?: boolean;
}

export default function SubscriptionBadge({ plan, status, trialDaysLeft, compact = false }: Props) {
  const planConfig = BILLING_PLANS[plan as PlanId];
  const statusMeta = STATUS_LABELS[status] ?? { label: status, color: "#6b7280" };

  if (compact) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 50,
        background: `${statusMeta.color}18`,
        border: `1px solid ${statusMeta.color}40`,
        fontSize: 11, fontWeight: 600, color: statusMeta.color,
      }}>
        <Zap size={10} fill={statusMeta.color} strokeWidth={0} />
        {planConfig?.name ?? plan}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 18px", borderRadius: 16,
      background: "rgba(255,255,255,.03)",
      border: "1px solid rgba(255,255,255,.08)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${statusMeta.color}18`,
        border: `1px solid ${statusMeta.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Zap size={16} color={statusMeta.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            {planConfig?.name ?? plan}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: "2px 8px", borderRadius: 50,
            background: `${statusMeta.color}18`,
            border: `1px solid ${statusMeta.color}35`,
            color: statusMeta.color,
          }}>
            {statusMeta.label}
          </span>
        </div>

        {status === "trialing" && trialDaysLeft !== null && trialDaysLeft !== undefined && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 3 }}>
            {trialDaysLeft > 0
              ? `${trialDaysLeft} dia${trialDaysLeft !== 1 ? "s" : ""} restante${trialDaysLeft !== 1 ? "s" : ""} de teste gratuito`
              : "Trial encerrado hoje"}
          </p>
        )}
      </div>
    </div>
  );
}
