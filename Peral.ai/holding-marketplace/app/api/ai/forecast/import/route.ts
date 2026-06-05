import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ForecastPoint {
  year:        number;
  month:       number;
  amount:      number;
  lowerBound:  number;
  upperBound:  number;
  confidence?: number;
  method?:     string;
}

// POST /api/ai/forecast/import
// Recebe forecasts gerados por notebook Python e os salva no banco
// Substitui os forecasts existentes da empresa
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { companyId: string; forecasts: ForecastPoint[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, forecasts } = body;

  if (!companyId || !Array.isArray(forecasts) || forecasts.length === 0) {
    return NextResponse.json(
      { error: "companyId e forecasts[] são obrigatórios" },
      { status: 400 }
    );
  }

  // Verificar que a empresa existe
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  // Validar campos obrigatórios
  const valid = forecasts.every(
    (f) =>
      typeof f.year === "number" &&
      typeof f.month === "number" &&
      typeof f.amount === "number" &&
      f.month >= 1 && f.month <= 12
  );
  if (!valid) {
    return NextResponse.json(
      { error: "Cada forecast precisa de: year, month (1-12), amount" },
      { status: 422 }
    );
  }

  const method = forecasts[0]?.method ?? "ml_import";

  // Substituir forecasts existentes
  await prisma.forecastRecord.deleteMany({ where: { companyId } });

  const created = await prisma.forecastRecord.createMany({
    data: forecasts.map((f) => ({
      companyId,
      year:       f.year,
      month:      f.month,
      amount:     Math.max(0, f.amount),
      lowerBound: Math.max(0, f.lowerBound ?? f.amount * 0.85),
      upperBound: Math.max(0, f.upperBound ?? f.amount * 1.15),
      confidence: f.confidence ?? 0.80,
      method:     f.method ?? "ml_import",
    })),
  });

  return NextResponse.json({
    success:  true,
    imported: created.count,
    company:  company.name,
    method,
    message:  `${created.count} forecasts importados para ${company.name}`,
  }, { status: 201 });
}
