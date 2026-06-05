import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ai/forecast/export/[companyId]
// Exporta dados históricos e forecasts existentes de uma empresa para o notebook Python
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { companyId } = await params;

  const [company, revenueRecords, currentForecasts, latestScore] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true, name: true, slug: true, sector: true,
        country: true, currency: true, annualRevenue: true, monthlyRevenue: true,
      },
    }),
    prisma.revenueRecord.findMany({
      where: { companyId, month: { not: null } },
      orderBy: [{ year: "asc" }, { month: "asc" }],
      select: { id: true, year: true, month: true, amount: true, currency: true, type: true },
    }),
    prisma.forecastRecord.findMany({
      where: { companyId },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),
    prisma.companyScore.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { overall: true, riskLevel: true, growthScore: true },
    }),
  ]);

  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    company,
    revenueRecords,
    currentForecasts,
    latestScore,
    meta: {
      totalMonths:    revenueRecords.length,
      dateRange: {
        from: revenueRecords[0]
          ? `${revenueRecords[0].year}-${String(revenueRecords[0].month).padStart(2, "0")}`
          : null,
        to: revenueRecords[revenueRecords.length - 1]
          ? `${revenueRecords[revenueRecords.length - 1].year}-${String(revenueRecords[revenueRecords.length - 1].month).padStart(2, "0")}`
          : null,
      },
      hasExistingForecasts: currentForecasts.length > 0,
      forecastMethod:       currentForecasts[0]?.method ?? null,
    },
  });
}
