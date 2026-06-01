import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const companyId = formData.get("companyId") as string | null;

  if (!file || !companyId) {
    return NextResponse.json({ error: "file e companyId são obrigatórios" }, { status: 400 });
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Salvar em public/uploads/logos/
  const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
  await mkdir(uploadDir, { recursive: true });

  const ext      = file.name.split(".").pop() ?? "png";
  const fileName = `${companyId}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  const logoUrl = `/uploads/logos/${fileName}`;

  await prisma.company.update({
    where: { id: companyId },
    data:  { logo: logoUrl },
  });

  return NextResponse.json({ ok: true, logo: logoUrl });
}
