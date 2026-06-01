import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";
import ParallaxBg from "@/components/ParallaxBg";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Verificar se o perfil está completo
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { profileCompleted: true },
  });

  // Se o perfil não está completo e não está na página de setup, redirecionar
  if (!user?.profileCompleted) {
    redirect("/dashboard/setup");
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen dashboard-backdrop">
        {/* Blobs parallax — fixos no fundo */}
        <ParallaxBg />

        <Sidebar />

        <div className="flex-1 dashboard-content" style={{ marginLeft: 240, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
