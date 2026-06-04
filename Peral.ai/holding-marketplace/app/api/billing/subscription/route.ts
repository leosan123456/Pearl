import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }

  const statusMeta = STATUS_LABELS[subscription.status] ?? { label: subscription.status, color: "#6b7280" };

  // Dias restantes de trial
  const trialDaysLeft = subscription.trialEnd
    ? Math.max(0, Math.ceil((subscription.trialEnd.getTime() - Date.now()) / 86_400_000))
    : null;

  return NextResponse.json({
    subscription: {
      id:                   subscription.id,
      plan:                 subscription.plan,
      status:               subscription.status,
      statusLabel:          statusMeta.label,
      statusColor:          statusMeta.color,
      currentPeriodEnd:     subscription.currentPeriodEnd,
      trialEnd:             subscription.trialEnd,
      trialDaysLeft,
      cancelAtPeriodEnd:    subscription.cancelAtPeriodEnd,
    },
  });
}
