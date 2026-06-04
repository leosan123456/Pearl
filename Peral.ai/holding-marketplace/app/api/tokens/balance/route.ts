import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBalances, TOKEN_LABELS, TOKEN_PACKAGES } from "@/lib/tokens";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const balances = await getBalances(userId);

  const enriched = balances.map((b) => {
    const label = TOKEN_LABELS[b.tokenType as keyof typeof TOKEN_LABELS];
    const daysUntilReset = b.quotaResetAt
      ? Math.max(0, Math.ceil((b.quotaResetAt.getTime() - Date.now()) / 86_400_000))
      : null;

    const packages = TOKEN_PACKAGES[b.tokenType as keyof typeof TOKEN_PACKAGES];

    return {
      tokenType:    b.tokenType,
      label:        label?.label       ?? b.tokenType,
      description:  label?.description ?? "",
      icon:         label?.icon        ?? "🔹",
      balance:      b.balance,
      totalGranted: b.totalGranted,
      totalUsed:    b.totalUsed,
      monthlyQuota: b.monthlyQuota,
      quotaResetAt: b.quotaResetAt,
      daysUntilReset,
      autoRecharge:          b.autoRecharge,
      autoRechargeThreshold: b.autoRechargeThreshold,
      autoRechargePackage:   b.autoRechargePackage,
      packages: Object.entries(packages ?? {}).map(([size, pkg]) => ({
        size, qty: pkg.qty, priceBrl: pkg.priceBrl, label: pkg.label,
        hasPrice: !!pkg.priceId && pkg.priceId !== "price_...",
      })),
    };
  });

  return NextResponse.json({ balances: enriched });
}
