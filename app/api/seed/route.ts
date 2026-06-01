import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  const adminExists = await prisma.user.findUnique({
    where: { email: "admin@holding.com" },
  });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: "admin@holding.com",
        name: "Admin",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
      },
    });
  }

  const companiesCount = await prisma.company.count();
  if (companiesCount > 0) {
    return NextResponse.json({ message: "Already seeded" });
  }

  const companies = [
    {
      name: "Apple Inc.",
      slug: "apple-inc",
      description: "Multinational technology company designing consumer electronics, software, and online services.",
      country: "United States",
      currency: "USD",
      sector: "Technology",
      founded: 1976,
      employees: 164000,
      status: "active",
      annualRevenue: 394000000000,
      monthlyRevenue: 32833333333,
      mainRevenue: "iPhone sales, Services (App Store, iCloud, Apple Music), Mac, iPad, Wearables",
      website: "https://apple.com",
    },
    {
      name: "Petrobras",
      slug: "petrobras",
      description: "Brazilian multinational petroleum corporation. One of the largest companies in Latin America.",
      country: "Brazil",
      currency: "BRL",
      sector: "Energy",
      founded: 1953,
      employees: 45000,
      status: "active",
      annualRevenue: 580000000000,
      monthlyRevenue: 48333333333,
      mainRevenue: "Oil & Gas exploration, refining, distribution, and commercialization",
      website: "https://petrobras.com.br",
    },
    {
      name: "Alibaba Group",
      slug: "alibaba-group",
      description: "Chinese multinational technology company specializing in e-commerce, retail, internet and technology.",
      country: "China",
      currency: "USD",
      sector: "Technology",
      founded: 1999,
      employees: 235000,
      status: "active",
      annualRevenue: 130000000000,
      monthlyRevenue: 10833333333,
      mainRevenue: "E-commerce platforms (Taobao, Tmall), Cloud computing (Alibaba Cloud), Digital media",
      website: "https://alibaba.com",
    },
    {
      name: "SAP SE",
      slug: "sap-se",
      description: "German multinational software corporation that makes enterprise software to manage business operations.",
      country: "Germany",
      currency: "EUR",
      sector: "Technology",
      founded: 1972,
      employees: 107000,
      status: "active",
      annualRevenue: 34000000000,
      monthlyRevenue: 2833333333,
      mainRevenue: "Enterprise software (ERP, CRM, SCM), Cloud subscriptions, SaaS solutions",
      website: "https://sap.com",
    },
    {
      name: "Vale S.A.",
      slug: "vale-sa",
      description: "Brazilian multinational corporation engaged in metals and mining and one of the largest logistics operators in Brazil.",
      country: "Brazil",
      currency: "BRL",
      sector: "Materials",
      founded: 1942,
      employees: 125000,
      status: "active",
      annualRevenue: 250000000000,
      monthlyRevenue: 20833333333,
      mainRevenue: "Iron ore mining, nickel production, copper, manganese, coal logistics",
      website: "https://vale.com",
    },
  ];

  for (const companyData of companies) {
    const company = await prisma.company.create({ data: companyData });

    await prisma.companyAsset.createMany({
      data: [
        { companyId: company.id, name: "Headquarters", type: "Real Estate", value: 2000000000, currency: company.currency, description: "Main corporate campus" },
        { companyId: company.id, name: "Brand Value", type: "Brand", value: 50000000000, currency: company.currency, description: "Estimated brand valuation" },
        { companyId: company.id, name: "IP Portfolio", type: "Intellectual Property", value: 5000000000, currency: company.currency, description: "Patents and trademarks" },
      ],
    });

    const currentYear = 2024;
    const revenueData = [];
    for (let month = 1; month <= 12; month++) {
      const variation = 0.85 + Math.random() * 0.3;
      revenueData.push({
        companyId: company.id,
        year: currentYear,
        month,
        amount: Math.round((company.monthlyRevenue || 1000000) * variation),
        currency: company.currency,
        type: "revenue",
      });
    }
    await prisma.revenueRecord.createMany({ data: revenueData });
  }

  return NextResponse.json({ message: "Seeded successfully" });
}
