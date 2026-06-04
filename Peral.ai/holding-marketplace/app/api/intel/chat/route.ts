import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkBalance, consumeToken, triggerAutoRechargeIfNeeded } from "@/lib/tokens";

const client = new Anthropic();

// ─── Perguntas iniciais por categoria ────────────────────────────────────────
const INITIAL_FLOW = [
  "Qual é o setor principal de atuação da sua holding? Descreva brevemente as áreas de negócio.",
  "Quantas empresas fazem parte do seu portfólio hoje e quais são as principais?",
  "Qual é a receita anual aproximada consolidada da holding? (pode ser uma faixa)",
  "Quais são os principais mercados geográficos onde sua holding opera?",
  "Quais são os principais ativos da holding? (imóveis, participações, equipamentos, propriedade intelectual...)",
  "Quais são os maiores riscos que você identifica para o portfólio atualmente?",
  "Quais oportunidades de crescimento você enxerga para os próximos 12-24 meses?",
  "Como está a estrutura de governança e quem são os principais tomadores de decisão?",
];

// ─── Prompt do sistema ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o assistente de inteligência estratégica da Pearl.AI, plataforma de gestão de holdings.
Sua missão é captar informações detalhadas sobre a holding do usuário através de uma conversa natural e inteligente.

REGRAS:
1. Analise a resposta do usuário e extraia TODOS os termos relevantes como keywords
2. Gere a próxima pergunta mais relevante com base no que foi dito (não siga um roteiro fixo — seja adaptativo)
3. Se o usuário mencionar riscos, aprofunde em riscos. Se mencionar crescimento, aprofunde nisso
4. Após 6+ trocas com informações substanciais, gere um resumo executivo detalhado
5. Seja conciso nas perguntas — máximo 2 frases

CATEGORIAS de keywords:
- "setor": indústria, vertical, área de negócio
- "mercado": regiões, países, cidades, nichos geográficos
- "ativo": imóveis, participações, equipamentos, patentes, marcas
- "risco": ameaças, vulnerabilidades, dependências críticas
- "oportunidade": potencial de crescimento, novos mercados, M&A
- "empresa": nomes de empresas, subsidiárias, parceiras
- "financeiro": métricas, receitas, margens, indicadores
- "estrategia": planos, iniciativas, metas
- "pessoa": executivos, sócios, stakeholders

RESPONDA SEMPRE em JSON válido no formato:
{
  "keywords": [
    { "keyword": "string", "category": "string", "weight": 0.0-1.0 }
  ],
  "nextQuestion": "string",
  "isDone": false,
  "summary": null
}

Quando isDone = true, preencha "summary" com um briefing executivo em markdown (mín. 300 palavras).
isDone só deve ser true após 7+ trocas com informações ricas.`;

// ─── Merges keywords — acumula mentions ──────────────────────────────────────
async function upsertKeywords(
  sessionId: string,
  newKeywords: { keyword: string; category: string; weight: number }[]
) {
  for (const kw of newKeywords) {
    const existing = await prisma.intelKeyword.findFirst({
      where: { sessionId, keyword: { equals: kw.keyword } },
    });
    if (existing) {
      await prisma.intelKeyword.update({
        where: { id: existing.id },
        data: { mentions: existing.mentions + 1, weight: Math.min(1, existing.weight + 0.1) },
      });
    } else {
      await prisma.intelKeyword.create({
        data: { sessionId, keyword: kw.keyword, category: kw.category, weight: kw.weight },
      });
    }
  }
}

// ─── POST /api/intel/chat ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { sessionId, userMessage } = await req.json();
  if (!sessionId || !userMessage?.trim()) {
    return NextResponse.json({ error: "sessionId e userMessage são obrigatórios" }, { status: 400 });
  }

  // Carregar sessão + histórico
  const intelSession = await prisma.intelSession.findUnique({
    where: { id: sessionId },
    include: { entries: { orderBy: { createdAt: "asc" } } },
  });
  if (!intelSession) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });

  // Salvar mensagem do usuário
  await prisma.intelEntry.create({
    data: { sessionId, role: "user", content: userMessage },
  });

  // Construir histórico de mensagens para Claude
  const history = intelSession.entries.map(e => ({
    role: e.role as "user" | "assistant",
    content: e.content,
  }));
  history.push({ role: "user", content: userMessage });

  const exchangeCount = history.filter(h => h.role === "user").length;

  // Verificar token de intel_session apenas na 1ª mensagem da sessão
  if (exchangeCount === 1) {
    const { enough, balance } = await checkBalance(userId, "intel_session");
    if (!enough) {
      return NextResponse.json(
        { error: "insufficient_tokens", tokenType: "intel_session", balance },
        { status: 402 }
      );
    }
    await consumeToken(userId, "intel_session", sessionId, "Sessão Intel iniciada");
    triggerAutoRechargeIfNeeded(userId, "intel_session").catch(console.error);
  }

  // Se for primeira mensagem, incluir contexto da pergunta inicial
  const contextualUser = exchangeCount === 1
    ? `[PRIMEIRA MENSAGEM — use a pergunta de contexto inicial para começar a conversa]\n\nResposta do usuário: ${userMessage}`
    : userMessage;

  const messagesForClaude = history.slice(0, -1);
  messagesForClaude.push({ role: "user", content: contextualUser });

  // Chamar Claude
  const aiResp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messagesForClaude,
  });

  const rawText = aiResp.content[0].type === "text" ? aiResp.content[0].text : "{}";

  // Parse JSON da resposta
  let parsed: {
    keywords: { keyword: string; category: string; weight: number }[];
    nextQuestion: string;
    isDone: boolean;
    summary: string | null;
  };

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch {
    parsed = { keywords: [], nextQuestion: INITIAL_FLOW[Math.min(exchangeCount, INITIAL_FLOW.length - 1)], isDone: false, summary: null };
  }

  // Fallback se nextQuestion vier vazio
  if (!parsed.nextQuestion && !parsed.isDone) {
    parsed.nextQuestion = INITIAL_FLOW[Math.min(exchangeCount, INITIAL_FLOW.length - 1)];
  }

  // Salvar resposta do assistente
  const assistantContent = parsed.isDone && parsed.summary ? parsed.summary : parsed.nextQuestion;
  await prisma.intelEntry.create({
    data: { sessionId, role: "assistant", content: assistantContent },
  });

  // Upsert keywords
  if (parsed.keywords?.length) {
    await upsertKeywords(sessionId, parsed.keywords);
  }

  // Marcar como concluída se isDone
  if (parsed.isDone && parsed.summary) {
    await prisma.intelSession.update({
      where: { id: sessionId },
      data: { status: "completed", summary: parsed.summary },
    });
  }

  // Retornar keywords atualizadas da sessão
  const allKeywords = await prisma.intelKeyword.findMany({
    where: { sessionId },
    orderBy: [{ mentions: "desc" }, { weight: "desc" }],
  });

  return NextResponse.json({
    assistantMessage: assistantContent,
    keywords: allKeywords,
    isDone: parsed.isDone,
    summary: parsed.summary,
    exchangeCount,
  });
}

// ─── GET — carrega histórico + keywords de uma sessão ────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId obrigatório" }, { status: 400 });

  const [entries, keywords] = await Promise.all([
    prisma.intelEntry.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } }),
    prisma.intelKeyword.findMany({ where: { sessionId }, orderBy: [{ mentions: "desc" }, { weight: "desc" }] }),
  ]);

  return NextResponse.json({ entries, keywords });
}
