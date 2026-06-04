import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveForecast } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { checkBalance, consumeToken, triggerAutoRechargeIfNeeded } from "@/lib/tokens";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { companyId } = await params;

  // Verificar saldo de tokens de forecast
  const { enough, balance } = await checkBalance(userId, "forecast");
  if (!enough) {
    return NextResponse.json(
      { error: "insufficient_tokens", tokenType: "forecast", balance },
      { status: 402 }
    );
  }

  try {
    const result = await saveForecast(companyId);

    await consumeToken(userId, "forecast", companyId, "Forecast de receita");
    triggerAutoRechargeIfNeeded(userId, "forecast").catch(console.error);

    return NextResponse.json(result, { status: 201 });
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
  const forecasts = await prisma.forecastRecord.findMany({
    where: { companyId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  return NextResponse.json(forecasts);
}
