import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";
import ParallaxBg from "@/components/ParallaxBg";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

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
