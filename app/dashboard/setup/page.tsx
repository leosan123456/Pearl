"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Building2, User, Globe, Briefcase, TrendingUp } from "lucide-react";

const SECTORS = [
  "Agronegócio", "Tecnologia", "Imobiliário", "Financeiro", "Saúde",
  "Energia", "Varejo", "Industrial", "Telecomunicações", "Educação",
  "Logística", "Mineração", "Alimentos & Bebidas", "Outro",
];

const JOB_TITLES = [
  "CEO / Presidente", "CFO / Diretor Financeiro", "COO / Diretor Operacional",
  "CIO / Diretor de Investimentos", "Gestor de Portfólio", "Analista Financeiro",
  "Sócio / Investidor", "Consultor", "Outro",
];

const COUNTRIES = [
  "Brasil", "Estados Unidos", "Portugal", "Argentina", "Chile",
  "Colômbia", "México", "Reino Unido", "França", "Alemanha", "Outro",
];

const STEPS = [
  { icon: User,      title: "Sobre você",         subtitle: "Seus dados pessoais e cargo"                },
  { icon: Building2, title: "Sua holding",          subtitle: "Informações sobre o portfólio"              },
  { icon: TrendingUp,title: "Seu portfólio",        subtitle: "Estrutura e escala da holding"              },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    name: "", jobTitle: "", holdingName: "",
    mainSector: "", country: "Brasil", companiesCount: "",
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.jobTitle;
    if (step === 1) return form.holdingName.trim() && form.mainSector;
    if (step === 2) return form.country && form.companiesCount;
    return true;
  };

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };

  const finish = async () => {
    setSaving(true);
    const res = await fetch("/api/profile/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, companiesCount: Number(form.companiesCount) }),
    });
    setSaving(false);
    if (res.ok) router.push("/dashboard");
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .step-content { animation: fadeUp .4s cubic-bezier(.22,.68,0,1.2) both; }
        .sel-btn { padding:10px 16px; border-radius:12px; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; text-align:left; border:1px solid rgba(255,255,255,.09); background:rgba(255,255,255,.04); color:rgba(255,255,255,.65); width:100%; }
        .sel-btn:hover { border-color:rgba(138,162,106,.5); background:rgba(85,107,47,.1); color:#fff; }
        .sel-btn.active { border-color:rgba(85,107,47,.6); background:rgba(85,107,47,.15); color:#8aa26a; font-weight:600; }
        .setup-input { width:100%; padding:14px 16px; border-radius:14px; font-size:14px; outline:none; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:#fff; transition:all .2s; caret-color:#8aa26a; }
        .setup-input:focus { border-color:rgba(138,162,106,.55); background:rgba(255,255,255,.08); box-shadow:0 0 0 3px rgba(85,107,47,.15); }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#050505", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative" }}>

        {/* Ambient glow */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse at 30% 40%,rgba(85,107,47,.12) 0%,transparent 55%)" }} />

        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:560 }}>

          {/* Logo + título */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:36 }}>
            <div style={{ width:68, height:68, borderRadius:20, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/pearl-logo.png" alt="Pearl.AI" width={48} height={48} style={{ objectFit:"contain" }} />
            </div>
            <h1 style={{ fontSize:26, fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:6 }}>
              Bem-vindo à Pearl<span style={{ color:"rgba(255,255,255,.4)" }}>.AI</span>
            </h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,.38)", textAlign:"center" }}>
              Vamos configurar seu perfil em 3 passos rápidos
            </p>
          </div>

          {/* Steps indicator */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, marginBottom:32 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{
                    width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                    background: i < step ? "rgba(85,107,47,.8)" : i === step ? "rgba(85,107,47,.25)" : "rgba(255,255,255,.06)",
                    border: `1.5px solid ${i <= step ? "rgba(85,107,47,.6)" : "rgba(255,255,255,.1)"}`,
                    transition:"all .3s",
                  }}>
                    {i < step
                      ? <Check size={16} color="#fff" strokeWidth={2.5} />
                      : <s.icon size={16} color={i === step ? "#8aa26a" : "rgba(255,255,255,.3)"} strokeWidth={1.8} />
                    }
                  </div>
                  <span style={{ fontSize:10, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase", color: i === step ? "#8aa26a" : "rgba(255,255,255,.25)", whiteSpace:"nowrap" }}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width:60, height:1, background:`linear-gradient(90deg,${i < step ? "rgba(85,107,47,.5)" : "rgba(255,255,255,.08)"},${i + 1 <= step ? "rgba(85,107,47,.5)" : "rgba(255,255,255,.08)"})`, margin:"0 6px", marginBottom:22 }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div style={{ background:"rgba(255,255,255,.04)", backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:28, padding:"36px 36px 28px", boxShadow:"0 24px 64px rgba(0,0,0,.65)" }}>

            {/* Step 0 — Sobre você */}
            {step === 0 && (
              <div className="step-content">
                <h2 style={{ fontSize:18, fontWeight:700, color:"#fff", marginBottom:6 }}>Sobre você</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.38)", marginBottom:24 }}>Como devemos te chamar e qual é sua função?</p>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:8 }}>Nome completo</label>
                    <input className="setup-input" placeholder="Seu nome" value={form.name} onChange={e => update("name", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:10 }}>Cargo</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {JOB_TITLES.map(j => (
                        <button key={j} className={`sel-btn${form.jobTitle === j ? " active" : ""}`} onClick={() => update("jobTitle", j)}>{j}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 — Sua holding */}
            {step === 1 && (
              <div className="step-content">
                <h2 style={{ fontSize:18, fontWeight:700, color:"#fff", marginBottom:6 }}>Sua holding</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.38)", marginBottom:24 }}>Nome e setor principal do grupo.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:8 }}>Nome da holding</label>
                    <input className="setup-input" placeholder="Ex: Grupo Santarelli" value={form.holdingName} onChange={e => update("holdingName", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:10 }}>Setor principal</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {SECTORS.map(s => (
                        <button key={s} className={`sel-btn${form.mainSector === s ? " active" : ""}`} onClick={() => update("mainSector", s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Portfólio */}
            {step === 2 && (
              <div className="step-content">
                <h2 style={{ fontSize:18, fontWeight:700, color:"#fff", marginBottom:6 }}>Seu portfólio</h2>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.38)", marginBottom:24 }}>Quantas empresas e onde estão localizadas?</p>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:8 }}>Número de empresas no portfólio</label>
                    <input className="setup-input" type="number" min="1" placeholder="Ex: 5" value={form.companiesCount} onChange={e => update("companiesCount", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:10 }}>País principal</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {COUNTRIES.map(c => (
                        <button key={c} className={`sel-btn${form.country === c ? " active" : ""}`} onClick={() => update("country", c)}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de navegação */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:28, paddingTop:20, borderTop:"1px solid rgba(255,255,255,.07)" }}>
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : undefined}
                style={{ fontSize:13, color:"rgba(255,255,255,.3)", background:"none", border:"none", cursor: step > 0 ? "pointer" : "default", padding:"8px 0", opacity: step > 0 ? 1 : 0 }}>
                ← Voltar
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  disabled={!canNext()}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 28px", borderRadius:50, fontWeight:700, fontSize:14, border:"none", cursor: canNext() ? "pointer" : "not-allowed", background: canNext() ? "#fff" : "rgba(255,255,255,.08)", color: canNext() ? "#000" : "rgba(255,255,255,.25)", transition:"all .2s", boxShadow: canNext() ? "0 4px 20px rgba(255,255,255,.18)" : "none" }}>
                  Próximo <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={!canNext() || saving}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 28px", borderRadius:50, fontWeight:700, fontSize:14, border:"none", cursor: canNext() && !saving ? "pointer" : "not-allowed", background: canNext() ? "linear-gradient(135deg,#556b2f,#4a5d23)" : "rgba(255,255,255,.08)", color: canNext() ? "#fff" : "rgba(255,255,255,.25)", transition:"all .2s", boxShadow: canNext() ? "0 4px 24px rgba(85,107,47,.4)" : "none" }}>
                  {saving ? "Salvando..." : <><Check size={15} strokeWidth={2.5} /> Concluir</>}
                </button>
              )}
            </div>
          </div>

          <p style={{ textAlign:"center", marginTop:20, fontSize:11, color:"rgba(255,255,255,.18)" }}>
            Você pode atualizar essas informações depois nas configurações
          </p>
        </div>
      </div>
    </>
  );
}
