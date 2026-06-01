import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET — lista todas as sessões
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.intelSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true, keywords: true } },
      keywords: { select: { keyword: true, category: true, weight: true }, orderBy: { weight: "desc" }, take: 8 },
    },
  });

  return NextResponse.json(sessions);
}

// POST — cria nova sessão
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();

  const intel = await prisma.intelSession.create({
    data: { title: title || "Nova Sessão de Pesquisa" },
  });

  return NextResponse.json(intel);
}

// PATCH — atualiza título ou status
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, status, summary } = await req.json();

  const updated = await prisma.intelSession.update({
    where: { id },
    data: { ...(title && { title }), ...(status && { status }), ...(summary && { summary }) },
  });

  return NextResponse.json(updated);
}

// DELETE — remove sessão
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.intelSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
