import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string }).role !== "admin") {
    redirect("/dashboard");
  }

  const companies = await prisma.company.findMany({
    include: { assets: true, revenueRecords: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1">
      <Navbar title="Admin Panel" />
      <AdminPanel initialCompanies={companies} />
    </div>
  );
}
