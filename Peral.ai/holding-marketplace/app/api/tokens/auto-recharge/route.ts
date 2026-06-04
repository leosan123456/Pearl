import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOKEN_TYPES, type TokenType, type PackageSize } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { tokenType, enabled, threshold, packageSize } = body as {
    tokenType: TokenType;
    enabled: boolean;
    threshold: number;
    packageSize: PackageSize;
  };

  if (!TOKEN_TYPES.includes(tokenType)) {
    return NextResponse.json({ error: "tokenType inválido" }, { status: 400 });
  }

  const record = await prisma.tokenBalance.upsert({
    where: { userId_tokenType: { userId, tokenType } },
    create: {
      userId, tokenType,
      autoRecharge: enabled,
      autoRechargeThreshold: threshold ?? 3,
      autoRechargePackage: packageSize ?? "small",
    },
    update: {
      autoRecharge: enabled,
      autoRechargeThreshold: threshold ?? 3,
      autoRechargePackage: packageSize ?? "small",
    },
  });

  return NextResponse.json({ success: true, record });
}
