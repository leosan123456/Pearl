import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveScore } from "@/lib/claude";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { companyId } = await params;

  try {
    const score = await saveScore(companyId);
    return NextResponse.json(score, { status: 201 });
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
  const score = await prisma.companyScore.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(score);
}
