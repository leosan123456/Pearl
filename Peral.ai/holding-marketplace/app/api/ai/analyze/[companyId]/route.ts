import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { analyzeCompany } from "@/lib/claude";
import { checkBalance, consumeToken, triggerAutoRechargeIfNeeded } from "@/lib/tokens";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { companyId } = await params;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  // Verificar saldo de tokens
  const { enough, balance } = await checkBalance(userId, "ai_analysis");
  if (!enough) {
    return NextResponse.json(
      { error: "insufficient_tokens", tokenType: "ai_analysis", balance },
      { status: 402 }
    );
  }

  try {
    const insight = await analyzeCompany(companyId);

    // Debitar token após sucesso
    await consumeToken(userId, "ai_analysis", companyId, "Análise de empresa");

    // Verificar recarga automática em background (não bloqueia a resposta)
    triggerAutoRechargeIfNeeded(userId, "ai_analysis").catch(console.error);

    return NextResponse.json(insight, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { companyId } = await params;
  const { prisma } = await import("@/lib/prisma");

  const insights = await prisma.aIInsight.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(insights);
}
