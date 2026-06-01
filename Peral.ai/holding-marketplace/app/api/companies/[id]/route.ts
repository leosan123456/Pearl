import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      assets: true,
      revenueRecords: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(company);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const company = await prisma.company.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      logo: body.logo || null,
      website: body.website || null,
      country: body.country,
      currency: body.currency || "USD",
      sector: body.sector,
      founded: body.founded ? Number(body.founded) : null,
      employees: body.employees ? Number(body.employees) : null,
      status: body.status || "active",
      annualRevenue: body.annualRevenue ? Number(body.annualRevenue) : null,
      monthlyRevenue: body.monthlyRevenue ? Number(body.monthlyRevenue) : null,
      mainRevenue: body.mainRevenue || null,
    },
    include: { assets: true, revenueRecords: true },
  });

  return NextResponse.json(company);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.company.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
