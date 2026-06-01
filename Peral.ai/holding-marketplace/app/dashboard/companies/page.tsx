import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CompanyCard from "@/components/CompanyCard";
import CompanyFilters from "@/components/CompanyFilters";
import { Building2 } from "lucide-react";
import { SECTORS, COUNTRIES } from "@/types";
import Link from "next/link";

interface SearchParams {
  search?: string;
  sector?: string;
  country?: string;
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { search = "", sector = "", country = "" } = params;

  const companies = await prisma.company.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
                { mainRevenue: { contains: search } },
              ],
            }
          : {},
        sector ? { sector } : {},
        country ? { country } : {},
      ],
    },
    include: {
      assets: true,
      revenueRecords: { orderBy: { year: "desc" }, take: 12 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1">
      <Navbar title="Companies" />

      <main className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Company Portfolio
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {companies.length} {companies.length === 1 ? "company" : "companies"} found
            </p>
          </div>
        </div>

        <CompanyFilters
          sectors={SECTORS}
          countries={COUNTRIES}
          currentSearch={search}
          currentSector={sector}
          currentCountry={country}
        />

        {companies.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl mt-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <Building2 size={40} className="mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>No companies found</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Try adjusting your search or filters, or{" "}
              <Link href="/dashboard/admin" style={{ color: "var(--accent)" }}>
                add a company
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
