"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  Plus, Send, Trash2, CheckCircle2, Clock,
  Tag, Sparkles, ChevronRight, Loader2, FileText,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface IntelSession {
  id: string;
  title: string;
  status: "active" | "completed";
  summary: string | null;
  createdAt: string;
  _count?: { entries: number; keywords: number };
  keywords?: IntelKeyword[];
}

interface IntelEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface IntelKeyword {
  id: string;
  keyword: string;
  category: string;
  weight: number;
  mentions: number;
}

// ─── Cores por categoria ──────────────────────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  setor:       { bg: "rgba(85,107,47,.18)",    text: "#8aa26a",  border: "rgba(85,107,47,.35)"   },
  mercado:     { bg: "rgba(37,99,235,.15)",    text: "#60a5fa",  border: "rgba(37,99,235,.3)"    },
  ativo:       { bg: "rgba(124,58,237,.15)",   text: "#a78bfa",  border: "rgba(124,58,237,.3)"   },
  risco:       { bg: "rgba(220,38,38,.15)",    text: "#f87171",  border: "rgba(220,38,38,.3)"    },
  oportunidade:{ bg: "rgba(5,150,105,.15)",    text: "#34d399",  border: "rgba(5,150,105,.3)"    },
  empresa:     { bg: "rgba(217,119,6,.15)",    text: "#fbbf24",  border: "rgba(217,119,6,.3)"    },
  financeiro:  { bg: "rgba(8,145,178,.15)",    text: "#22d3ee",  border: "rgba(8,145,178,.3)"    },
  estrategia:  { bg: "rgba(79,70,229,.15)",    text: "#818cf8",  border: "rgba(79,70,229,.3)"    },
  pessoa:      { bg: "rgba(219,39,119,.15)",   text: "#f472b6",  border: "rgba(219,39,119,.3)"   },
};

const CAT_LABELS: Record<string, string> = {
  setor: "Setor", mercado: "Mercado", ativo: "Ativo",
  risco: "Risco", oportunidade: "Oportunidade", empresa: "Empresa",
  financeiro: "Financeiro", estrategia: "Estratégia", pessoa: "Pessoa",
};

const WELCOME_MSG = `Olá! Sou o assistente de inteligência estratégica da Pearl.AI.

Vou ajudá-lo a mapear e documentar sua holding de forma estruturada. Ao longo da conversa, vou extrair automaticamente **palavras-chave e vínculos** que formarão a base de conhecimento do seu portfólio.

Para começar: **Qual é o setor principal de atuação da sua holding?** Descreva brevemente as áreas de negócio.`;

// ─── Componente ───────────────────────────────────────────────────────────────
export default function IntelPage() {
  const [sessions,       setSessions]       = useState<IntelSession[]>([]);
  const [activeSession,  setActiveSession]  = useState<IntelSession | null>(null);
  const [entries,        setEntries]        = useState<IntelEntry[]>([]);
  const [keywords,       setKeywords]       = useState<IntelKeyword[]>([]);
  const [input,          setInput]          = useState("");
  const [sending,        setSending]        = useState(false);
  const [creating,       setCreating]       = useState(false);
  const [newTitle,       setNewTitle]       = useState("");
  const [showNewForm,    setShowNewForm]    = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // ── Carregar sessões ────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/intel/sessions");
    if (res.ok) setSessions(await res.json());
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Selecionar sessão ───────────────────────────────────────────────────────
  const selectSession = useCallback(async (s: IntelSession) => {
    setActiveSession(s);
    const res = await fetch(`/api/intel/chat?sessionId=${s.id}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
      setKeywords(data.keywords);
    }
    setActiveCategory(null);
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  // ── Criar nova sessão ───────────────────────────────────────────────────────
  const createSession = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/intel/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) {
      const s = await res.json();
      await loadSessions();
      setShowNewForm(false);
      setNewTitle("");
      // Abre com mensagem de boas-vindas
      setActiveSession(s);
      setEntries([{ id: "welcome", role: "assistant", content: WELCOME_MSG, createdAt: new Date().toISOString() }]);
      setKeywords([]);
    }
    setCreating(false);
  };

  // ── Enviar mensagem ─────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !activeSession || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    // Mostra mensagem do usuário imediatamente
    const tempEntry: IntelEntry = { id: `tmp-${Date.now()}`, role: "user", content: userMsg, createdAt: new Date().toISOString() };
    setEntries(prev => [...prev, tempEntry]);

    const res = await fetch("/api/intel/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSession.id, userMessage: userMsg }),
    });

    if (res.ok) {
      const data = await res.json();
      setEntries(prev => [
        ...prev.filter(e => e.id !== tempEntry.id),
        { id: `u-${Date.now()}`,   role: "user",      content: userMsg,                 createdAt: new Date().toISOString() },
        { id: `a-${Date.now()}`,   role: "assistant",  content: data.assistantMessage,   createdAt: new Date().toISOString() },
      ]);
      setKeywords(data.keywords || []);
      if (data.isDone) {
        setActiveSession(prev => prev ? { ...prev, status: "completed" } : prev);
        loadSessions();
      }
    }

    setSending(false);
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Excluir sessão ──────────────────────────────────────────────────────────
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/api/intel/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (activeSession?.id === id) { setActiveSession(null); setEntries([]); setKeywords([]); }
    loadSessions();
  };

  // ── Keywords filtradas por categoria ───────────────────────────────────────
  const filteredKeywords = activeCategory ? keywords.filter(k => k.category === activeCategory) : keywords;
  const categoryGroups = keywords.reduce((acc, kw) => {
    acc[kw.category] = (acc[kw.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar title="Pesquisa & Inteligência" />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Painel esquerdo — sessões ────────────────────────────────────── */}
        <aside style={{
          width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,.06)",
          background: "rgba(0,0,0,.3)", overflow: "hidden",
        }}>
          <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <button
              onClick={() => setShowNewForm(v => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "9px 14px", borderRadius: 12, border: "1px solid rgba(85,107,47,.35)",
                background: "rgba(85,107,47,.1)", color: "#8aa26a", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(85,107,47,.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(85,107,47,.1)"; }}
            >
              <Plus size={15} strokeWidth={2.5} /> Nova Sessão
            </button>

            {showNewForm && (
              <div style={{ marginTop: 10 }}>
                <input
                  value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createSession()}
                  placeholder="Título da sessão..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13, outline: "none", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", marginBottom: 6 }}
                  autoFocus
                />
                <button
                  onClick={createSession} disabled={creating || !newTitle.trim()}
                  style={{ width: "100%", padding: "8px", borderRadius: 10, background: "#fff", color: "#000", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  {creating ? "Criando..." : "Criar"}
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            {sessions.length === 0 && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
                Nenhuma sessão ainda.<br/>Crie sua primeira pesquisa.
              </p>
            )}
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => selectSession(s)}
                style={{
                  padding: "10px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer",
                  background: activeSession?.id === s.id ? "rgba(85,107,47,.14)" : "transparent",
                  border: `1px solid ${activeSession?.id === s.id ? "rgba(85,107,47,.28)" : "transparent"}`,
                  transition: "all .15s",
                }}
                onMouseEnter={e => { if (activeSession?.id !== s.id) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                onMouseLeave={e => { if (activeSession?.id !== s.id) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "-.01em", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title}
                  </span>
                  <button
                    onClick={e => deleteSession(s.id, e)}
                    style={{ padding: 4, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,.2)", flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.2)")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {s.status === "completed"
                    ? <CheckCircle2 size={11} color="#34d399" />
                    : <Clock size={11} color="rgba(255,255,255,.3)" />}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>
                    {s.status === "completed" ? "Concluída" : "Em andamento"} · {s._count?.keywords ?? 0} keywords
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Centro — chat ────────────────────────────────────────────────── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {!activeSession ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(85,107,47,.1)", border: "1px solid rgba(85,107,47,.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Sparkles size={28} color="#8aa26a" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-.02em" }}>
                Inteligência Estratégica
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.4)", maxWidth: 400, lineHeight: 1.7 }}>
                Selecione uma sessão existente ou crie uma nova para começar a mapear as informações da sua holding com IA.
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 50, background: "rgba(85,107,47,.15)", border: "1px solid rgba(85,107,47,.3)", color: "#8aa26a", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={16} /> Criar primeira sessão
              </button>
            </div>
          ) : (
            <>
              {/* Header da sessão */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,.2)" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>{activeSession.title}</h3>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>
                    {activeSession.status === "completed" ? "✓ Concluída" : "Em andamento"} · {keywords.length} palavras-chave capturadas
                  </span>
                </div>
                {activeSession.status === "completed" && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 50, background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.25)", color: "#34d399" }}>
                    Análise completa
                  </span>
                )}
              </div>

              {/* Mensagens */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {entries.map((entry, i) => (
                  <div key={entry.id || i} style={{ display: "flex", justifyContent: entry.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 10 }}>
                    {entry.role === "assistant" && (
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(85,107,47,.2)", border: "1px solid rgba(85,107,47,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <Sparkles size={14} color="#8aa26a" strokeWidth={2} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: "72%", padding: "12px 16px", borderRadius: entry.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: entry.role === "user" ? "#fff" : "rgba(255,255,255,.05)",
                      border: entry.role === "user" ? "none" : "1px solid rgba(255,255,255,.08)",
                      color: entry.role === "user" ? "#000" : "rgba(255,255,255,.85)",
                      fontSize: 14, lineHeight: 1.65,
                    }}>
                      {entry.content.split("\n").map((line, j) => (
                        <span key={j}>
                          {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                          {j < entry.content.split("\n").length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(85,107,47,.2)", border: "1px solid rgba(85,107,47,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles size={14} color="#8aa26a" strokeWidth={2} />
                    </div>
                    <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 8 }}>
                      <Loader2 size={14} color="rgba(255,255,255,.5)" style={{ animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Analisando e extraindo informações...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeSession.status !== "completed" && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,.06)", background: "rgba(0,0,0,.2)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Digite sua resposta... (Enter para enviar, Shift+Enter para nova linha)"
                      rows={2}
                      style={{
                        flex: 1, padding: "12px 16px", borderRadius: 16, fontSize: 14, outline: "none", resize: "none",
                        background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#fff",
                        transition: "border-color .2s", lineHeight: 1.5, caretColor: "#8aa26a",
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(138,162,106,.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,.1)")}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      style={{
                        width: 44, height: 44, borderRadius: 14, border: "none", cursor: !input.trim() || sending ? "not-allowed" : "pointer",
                        background: !input.trim() || sending ? "rgba(255,255,255,.08)" : "linear-gradient(135deg,#556b2f,#4a5d23)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        boxShadow: !input.trim() || sending ? "none" : "0 4px 16px rgba(85,107,47,.4)",
                        transition: "all .15s",
                      }}
                    >
                      <Send size={16} color={!input.trim() || sending ? "rgba(255,255,255,.3)" : "#fff"} strokeWidth={2} />
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,.2)", marginTop: 6, marginLeft: 2 }}>
                    A IA extrai keywords automaticamente a cada resposta
                  </p>
                </div>
              )}

              {/* Resumo final */}
              {activeSession.status === "completed" && activeSession.summary && (
                <div style={{ margin: "0 20px 16px", padding: 16, borderRadius: 16, background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <FileText size={15} color="#34d399" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>Briefing executivo gerado</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", margin: 0 }}>Disponível no painel de keywords →</p>
                </div>
              )}
            </>
          )}
        </main>

        {/* ── Painel direito — keywords ────────────────────────────────────── */}
        <aside style={{
          width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
          borderLeft: "1px solid rgba(255,255,255,.06)",
          background: "rgba(0,0,0,.25)", overflow: "hidden",
        }}>
          <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag size={14} color="#8aa26a" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Palavras-chave capturadas</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginTop: 4 }}>
              {keywords.length} termos · {Object.keys(categoryGroups).length} categorias
            </p>
          </div>

          {/* Filtros de categoria */}
          {Object.keys(categoryGroups).length > 0 && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", flexWrap: "wrap", gap: 4 }}>
              <button
                onClick={() => setActiveCategory(null)}
                style={{ padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all .12s", background: !activeCategory ? "rgba(255,255,255,.12)" : "transparent", color: !activeCategory ? "#fff" : "rgba(255,255,255,.35)", borderColor: !activeCategory ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.08)" }}>
                Todas
              </button>
              {Object.entries(categoryGroups).map(([cat, count]) => {
                const c = CAT_COLORS[cat] || CAT_COLORS.setor;
                const isActive = activeCategory === cat;
                return (
                  <button key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    style={{ padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${isActive ? c.border : "rgba(255,255,255,.08)"}`, background: isActive ? c.bg : "transparent", color: isActive ? c.text : "rgba(255,255,255,.35)", transition: "all .12s" }}>
                    {CAT_LABELS[cat] || cat} {count}
                  </button>
                );
              })}
            </div>
          )}

          {/* Lista de keywords */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {filteredKeywords.length === 0 && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.22)", textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
                {keywords.length === 0
                  ? "Keywords aparecerão aqui conforme você responde às perguntas."
                  : "Nenhuma keyword nessa categoria."}
              </p>
            )}
            {filteredKeywords.map(kw => {
              const c = CAT_COLORS[kw.category] || CAT_COLORS.setor;
              return (
                <div key={kw.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 10, marginBottom: 4, background: c.bg, border: `1px solid ${c.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.keyword}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.text, background: `${c.bg}`, padding: "1px 6px", borderRadius: 50 }}>{CAT_LABELS[kw.category] || kw.category}</span>
                    {kw.mentions > 1 && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", background: "rgba(255,255,255,.06)", borderRadius: 50, padding: "1px 6px" }}>×{kw.mentions}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dica */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 12, background: "rgba(85,107,47,.07)", border: "1px solid rgba(85,107,47,.15)" }}>
              <ChevronRight size={13} color="#8aa26a" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", margin: 0, lineHeight: 1.6 }}>
                As keywords capturadas alimentam automaticamente os insights de IA das suas empresas.
              </p>
            </div>
          </div>
        </aside>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
