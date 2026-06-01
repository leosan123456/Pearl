import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized", message: "Você precisa estar autenticado" }, { status: 401 });
  }

  try {
    const {
      name,
      jobTitle,
      holdingName,
      mainSector,
      mainSubSector,
      country,
      companiesCount,
      phone,
      bio,
      investmentStage,
      fundSize,
      focusSectors,
    } = await req.json();

    const userId = (session.user as { id: string }).id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(jobTitle && { jobTitle }),
        ...(holdingName && { holdingName }),
        ...(mainSector && { mainSector }),
        ...(mainSubSector && { mainSubSector }),
        ...(country && { country }),
        ...(companiesCount !== undefined && companiesCount !== null && { companiesCount: Number(companiesCount) }),
        ...(phone && { phone }),
        ...(bio && { bio }),
        ...(investmentStage && { investmentStage }),
        ...(fundSize !== undefined && fundSize !== null && { fundSize: Number(fundSize) }),
        ...(focusSectors && { focusSectors }),
        profileCompleted: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        holdingName: true,
        mainSector: true,
        mainSubSector: true,
        country: true,
        companiesCount: true,
        phone: true,
        bio: true,
        investmentStage: true,
        fundSize: true,
        focusSectors: true,
        avatar: true,
        profileCompleted: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Perfil atualizado com sucesso",
      user: updated,
    });
  } catch (error) {
    console.error("Error completing profile:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
