import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET — retorna perfil do usuário logado
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { id: true, name: true, email: true, role: true, jobTitle: true, holdingName: true, mainSector: true, country: true, companiesCount: true, avatar: true, profileCompleted: true },
  });

  return NextResponse.json(user);
}

// POST — salva/atualiza perfil e marca como completo
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, jobTitle, holdingName, mainSector, country, companiesCount } = await req.json();

  const updated = await prisma.user.update({
    where: { id: (session.user as { id: string }).id },
    data: {
      ...(name        && { name }),
      ...(jobTitle    && { jobTitle }),
      ...(holdingName && { holdingName }),
      ...(mainSector  && { mainSector }),
      ...(country     && { country }),
      ...(companiesCount && { companiesCount: Number(companiesCount) }),
      profileCompleted: true,
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
