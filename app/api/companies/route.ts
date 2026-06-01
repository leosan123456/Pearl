import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const sector = searchParams.get("sector") || "";
  const country = searchParams.get("country") || "";

  const companies = await prisma.company.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { sector: { contains: search } },
          ],
        } : {},
        sector ? { sector } : {},
        country ? { country } : {},
      ],
    },
    include: { assets: true, revenueRecords: { orderBy: { year: "desc" }, take: 12 } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const slug = slugify(body.name);

  const existing = await prisma.company.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const company = await prisma.company.create({
    data: {
      name: body.name,
      slug: finalSlug,
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
  });

  return NextResponse.json(company, { status: 201 });
}
