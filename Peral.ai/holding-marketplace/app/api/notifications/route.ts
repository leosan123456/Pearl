import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [insights, companies, scores] = await Promise.all([
    prisma.aIInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { company: { select: { name: true, slug: true, sector: true } } },
    }),
    prisma.company.findMany({
      include: {
        insights: { orderBy: { createdAt: "desc" }, take: 1 },
        scores:   { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.companyScore.findMany({
      where: { riskLevel: { in: ["high", "critical"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { company: { select: { name: true, slug: true } } },
    }),
  ]);

  const notifications: {
    id: string;
    type: "alert" | "warning" | "info" | "success";
    title: string;
    message: string;
    companySlug?: string;
    companyName?: string;
    time: string;
    relativeTime: string;
  }[] = [];

  // Insights da IA como notificações
  for (const insight of insights) {
    const type =
      insight.outlook === "bearish"   ? "alert" :
      insight.outlook === "cautious"  ? "warning" :
      insight.outlook === "bullish"   ? "success" : "info";

    const outlookLabel: Record<string, string> = {
      bearish:  "Perspectiva negativa detectada",
      cautious: "Atenção necessária",
      bullish:  "Perspectiva positiva",
      neutral:  "Análise concluída",
    };

    notifications.push({
      id:          `insight-${insight.id}`,
      type,
      title:       `${insight.company?.name ?? "Empresa"} — ${outlookLabel[insight.outlook] ?? "Análise"}`,
      message:     insight.summary.length > 120 ? insight.summary.slice(0, 120) + "…" : insight.summary,
      companySlug: insight.company?.slug,
      companyName: insight.company?.name,
      time:        insight.createdAt.toISOString(),
      relativeTime: relativeTime(insight.createdAt),
    });
  }

  // Empresas sem análise recente (>30 dias ou nunca)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const staleCompanies = companies.filter((c) => {
    const lastInsight = c.insights[0];
    return !lastInsight || lastInsight.createdAt < thirtyDaysAgo;
  });

  for (const company of staleCompanies.slice(0, 3)) {
    const lastInsight = company.insights[0];
    notifications.push({
      id:          `stale-${company.id}`,
      type:        "warning",
      title:       `${company.name} — Análise desatualizada`,
      message:     lastInsight
        ? `Última análise foi há ${relativeTime(lastInsight.createdAt)}. Recomendamos atualizar.`
        : "Esta empresa ainda não foi analisada pela IA. Clique para analisar.",
      companySlug: company.slug,
      companyName: company.name,
      time:        (lastInsight?.createdAt ?? company.createdAt).toISOString(),
      relativeTime: lastInsight ? relativeTime(lastInsight.createdAt) : "nunca",
    });
  }

  // Empresas com risco alto
  for (const score of scores.slice(0, 3)) {
    notifications.push({
      id:          `risk-${score.id}`,
      type:        "alert",
      title:       `${score.company?.name ?? "Empresa"} — Risco ${score.riskLevel === "critical" ? "crítico" : "alto"}`,
      message:     `Score: ${Math.round(score.overall)}/100. Revise imediatamente os indicadores desta empresa.`,
      companySlug: score.company?.slug,
      companyName: score.company?.name,
      time:        score.createdAt.toISOString(),
      relativeTime: relativeTime(score.createdAt),
    });
  }

  // Ordenar por data
  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const unreadCount = Math.min(notifications.length, 5);

  return NextResponse.json({ notifications: notifications.slice(0, 12), unreadCount });
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "agora";
  if (mins  < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}
