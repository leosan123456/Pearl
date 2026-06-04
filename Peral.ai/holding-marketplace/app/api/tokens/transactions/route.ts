import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOKEN_LABELS, type TokenType } from "@/lib/tokens";

const TYPE_LABELS: Record<string, string> = {
  quota_grant:   "Cota mensal",
  usage:         "Uso",
  purchase:      "Compra",
  auto_recharge: "Recarga automática",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const tokenType  = searchParams.get("tokenType") ?? undefined;
  const limit      = Math.min(Number(searchParams.get("limit")  ?? 20), 100);
  const offset     = Number(searchParams.get("offset") ?? 0);

  const [transactions, total] = await Promise.all([
    prisma.tokenTransaction.findMany({
      where: { userId, ...(tokenType ? { tokenType } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.tokenTransaction.count({
      where: { userId, ...(tokenType ? { tokenType } : {}) },
    }),
  ]);

  const enriched = transactions.map((t) => ({
    ...t,
    tokenLabel:  TOKEN_LABELS[t.tokenType as TokenType]?.label ?? t.tokenType,
    tokenIcon:   TOKEN_LABELS[t.tokenType as TokenType]?.icon  ?? "🔹",
    typeLabel:   TYPE_LABELS[t.type]  ?? t.type,
    isCredit:    t.amount > 0,
  }));

  return NextResponse.json({ transactions: enriched, total, limit, offset });
}
