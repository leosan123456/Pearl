"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, ChevronDown, Brain, BarChart3,
  TrendingUp, Shield, FileText, Building2,
  Check, Zap, Star,
} from "lucide-react";

/* ─── Vídeos ─────────────────────────────────────────────────────────────── */
const VIDEOS = [
  "/videos/login-bg.mp4",   // Futurista / espaço
  "/videos/v3.mp4",          // Drone alpino
  "/videos/login-bg2.mp4",   // Floresta / natureza
  "/videos/v4.mp4",          // Campos floridos
  "/videos/v5.mp4",          // Pet / movimento
  "/videos/v6.mp4",          // Casal / memórias
  "/videos/v7.mp4",          // Jardim japonês
];

/* ─── Partículas hero ────────────────────────────────────────────────────── */
const PARTICLES = [
  {l:5, t:10,s:2,d:6.1,dl:0  },{l:15,t:68,s:1,d:5.3,dl:.9 },
  {l:24,t:35,s:2,d:7.2,dl:1.4},{l:38,t:82,s:1,d:5.8,dl:.3 },
  {l:52,t:18,s:3,d:8.2,dl:2.0},{l:63,t:55,s:1,d:6.5,dl:.7 },
  {l:72,t:12,s:2,d:5.6,dl:1.6},{l:81,t:44,s:1,d:7.4,dl:1.1},
  {l:89,t:78,s:2,d:6.2,dl:.4 },{l:94,t:28,s:1,d:5.9,dl:2.3},
  {l:10,t:50,s:1,d:7.7,dl:.8 },{l:46,t:90,s:2,d:6.6,dl:1.8},
  {l:57,t:6, s:1,d:5.4,dl:2.7},{l:76,t:62,s:2,d:7.0,dl:.5 },
];

/* ─── Features ───────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Brain,
    title: "IA em Tempo Real",
    desc: "Análise profunda de cada empresa com Claude Sonnet. Geração automática de insights, riscos, perspectivas e recomendações estratégicas.",
    accent: true,
  },
  {
    icon: BarChart3,
    title: "Score de Empresas",
    desc: "Sistema proprietário de pontuação: saúde de receita, crescimento, cobertura de ativos, eficiência operacional e nível de risco consolidado.",
    accent: false,
  },
  {
    icon: TrendingUp,
    title: "Previsão de Receita",
    desc: "Forecasting com método de Holt para os próximos 12 meses, com intervalo de confiança e limite superior/inferior por empresa.",
    accent: false,
  },
  {
    icon: Building2,
    title: "Gestão de Portfolio",
    desc: "Visão consolidada de toda a estrutura da holding — múltiplas empresas, ativos, receitas e métricas em um único painel unificado.",
    accent: false,
  },
  {
    icon: Shield,
    title: "Compliance Automatizado",
    desc: "Relatórios de conformidade gerados automaticamente. Matriz de risco atualizada em tempo real com alertas sobre mudanças críticas.",
    accent: false,
  },
  {
    icon: FileText,
    title: "Relatórios & Exportação",
    desc: "Relatórios executivos prontos para apresentação. Histórico completo de análises de IA com rastreamento de tokens e cache hits.",
    accent: false,
  },
];

/* ─── Planos ─────────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Personal",
    badge: null,
    price: "R$ 197",
    period: "/mês",
    desc: "Para gestores individuais e family offices que buscam visibilidade total do seu portfólio.",
    features: [
      "1 usuário administrador",
      "Até 5 empresas no portfólio",
      "20 análises de IA por mês",
      "Score de risco básico",
      "Dashboard de visão geral",
      "Relatórios mensais em PDF",
      "Suporte por e-mail",
    ],
    cta: "Começar agora",
    href: "/register",
    featured: false,
  },
  {
    name: "Business",
    badge: "Mais popular",
    price: "R$ 697",
    period: "/mês",
    desc: "Para holdings corporativas que precisam de análise avançada, múltiplos usuários e automação completa.",
    features: [
      "Até 10 usuários",
      "Empresas ilimitadas",
      "Análises de IA ilimitadas",
      "Score avançado + Forecasting 12 meses",
      "Compliance e matriz de risco",
      "Alertas automáticos em tempo real",
      "Acesso à API",
      "Suporte prioritário 24h",
    ],
    cta: "Começar Business",
    href: "/register",
    featured: true,
  },
];

/* ─── Hook IntersectionObserver ─────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [vidIdx,      setVidIdx]      = useState(0);
  const [vidOpacity,  setVidOpacity]  = useState(1);
  const [heroVisible, setHeroVisible] = useState(false);
  const [mouseX,      setMouseX]      = useState(0);
  const [mouseY,      setMouseY]      = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [featRef,  featInView]  = useInView();
  const [plansRef, plansInView] = useInView();
  const [ctaRef,   ctaInView]   = useInView();

  /* Entrada hero */
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  /* Parallax vídeo + hero move */
  useEffect(() => {
    let raf: number, tx=0,ty=0,cx=0,cy=0;
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX/window.innerWidth  -.5)*22;
      ty = (e.clientY/window.innerHeight -.5)*14;
      setMouseX((e.clientX/window.innerWidth  -.5)*12);
      setMouseY((e.clientY/window.innerHeight -.5)*8);
    };
    const tick = () => {
      const v = videoRef.current;
      if (v) { cx+=(tx-cx)*.045; cy+=(ty-cy)*.045; v.style.transform=`scale(1.14) translate(${cx}px,${cy}px)`; }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove",onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove",onMove); cancelAnimationFrame(raf); };
  }, []);

  /* Crossfade vídeo */
  const onVideoEnded = useCallback(() => {
    setVidOpacity(0);
    setTimeout(() => { setVidIdx(i=>(i+1)%VIDEOS.length); setVidOpacity(1); }, 700);
  }, []);

  return (
    <>
      <style>{`
        @keyframes floatDot  { 0%,100%{transform:translateY(0) scale(1);opacity:.25} 50%{transform:translateY(-12px) scale(1.6);opacity:.7} }
        @keyframes heroFadeUp{ from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes logoBreathe{ 0%,100%{filter:drop-shadow(0 0 18px rgba(255,255,255,.16))} 50%{filter:drop-shadow(0 0 32px rgba(255,255,255,.32))} }
        @keyframes scrollBounce{ 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(8px);opacity:.9} }
        @keyframes spin{ to{transform:rotate(360deg)} }

        .hero-visible .h-l1{ animation:heroFadeUp .9s cubic-bezier(.22,.68,0,1.2) .0s both }
        .hero-visible .h-l2{ animation:heroFadeUp .9s cubic-bezier(.22,.68,0,1.2) .15s both }
        .hero-visible .h-l3{ animation:heroFadeUp .9s cubic-bezier(.22,.68,0,1.2) .3s both }
        .hero-visible .h-l4{ animation:heroFadeUp .9s cubic-bezier(.22,.68,0,1.2) .45s both }
        .logo-breathe       { animation:logoBreathe 4s ease-in-out infinite }
        .scroll-bounce      { animation:scrollBounce 2s ease-in-out infinite }

        .reveal { opacity:0; transform:translateY(32px); transition:opacity .7s ease, transform .7s ease; }
        .reveal.in { opacity:1; transform:translateY(0); }
        .reveal-d1 { transition-delay:.05s }
        .reveal-d2 { transition-delay:.12s }
        .reveal-d3 { transition-delay:.19s }
        .reveal-d4 { transition-delay:.26s }
        .reveal-d5 { transition-delay:.33s }
        .reveal-d6 { transition-delay:.40s }

        .btn-white {
          display:inline-flex; align-items:center; gap:9px;
          background:#fff; color:#000; font-weight:700; font-size:15px;
          padding:14px 30px; border-radius:50px; border:none; cursor:pointer;
          letter-spacing:.01em; transition:all .2s; text-decoration:none;
          box-shadow:0 4px 24px rgba(255,255,255,.18),inset 0 1px 0 rgba(255,255,255,.9);
        }
        .btn-white:hover { background:#ebebeb; transform:translateY(-2px); box-shadow:0 8px 36px rgba(255,255,255,.28),inset 0 1px 0 rgba(255,255,255,.9); }
        .btn-white:active { transform:scale(.98); }

        .btn-glass {
          display:inline-flex; align-items:center; gap:9px;
          background:rgba(255,255,255,.07); color:#fff; font-weight:600; font-size:15px;
          padding:14px 30px; border-radius:50px; cursor:pointer;
          border:1px solid rgba(255,255,255,.17); transition:all .2s; text-decoration:none;
          backdrop-filter:blur(8px);
        }
        .btn-glass:hover { background:rgba(255,255,255,.13); border-color:rgba(255,255,255,.3); transform:translateY(-2px); }
        .btn-glass:active { transform:scale(.98); }

        .btn-green {
          display:inline-flex; align-items:center; justify-content:center; gap:9px;
          background:linear-gradient(135deg,#556b2f,#4a5d23); color:#fff; font-weight:700; font-size:15px;
          padding:14px 32px; border-radius:50px; border:none; cursor:pointer;
          width:100%; letter-spacing:.01em; transition:all .2s; text-decoration:none;
          box-shadow:0 4px 24px rgba(85,107,47,.4),inset 0 1px 0 rgba(255,255,255,.12);
        }
        .btn-green:hover { background:linear-gradient(135deg,#637d35,#556b2f); transform:translateY(-1px); box-shadow:0 8px 32px rgba(85,107,47,.5); }

        .feat-card {
          padding:28px; border-radius:20px;
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.07);
          transition:border-color .25s, background .25s, transform .25s;
        }
        .feat-card:hover { border-color:rgba(85,107,47,.3); background:rgba(85,107,47,.06); transform:translateY(-4px); }
        .feat-card.accent { background:rgba(85,107,47,.08); border-color:rgba(85,107,47,.22); }
        .feat-card.accent:hover { border-color:rgba(85,107,47,.4); background:rgba(85,107,47,.12); }
      `}</style>

      <div style={{ background:"#050505", color:"#fff", fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,sans-serif", WebkitFontSmoothing:"antialiased" }}>

        {/* ══════════ HERO ══════════════════════════════════════════════════ */}
        <section style={{ position:"relative", height:"100vh", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>

          {/* Vídeo */}
          <video ref={videoRef} key={VIDEOS[vidIdx]} autoPlay muted playsInline onEnded={onVideoEnded}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0, willChange:"transform", opacity:vidOpacity, transition:"opacity .7s ease" }}>
            <source src={VIDEOS[vidIdx]} type="video/mp4" />
          </video>

          {/* Overlays */}
          <div style={{ position:"absolute", inset:0, zIndex:1, background:"linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,.35) 45%,rgba(0,0,0,.75) 100%)" }} />
          <div style={{ position:"absolute", inset:0, zIndex:1, background:"radial-gradient(ellipse at 50% 50%,transparent 25%,rgba(0,0,0,.55) 100%)" }} />

          {/* Partículas */}
          {PARTICLES.map((p,i)=>(
            <div key={i} style={{ position:"absolute", zIndex:2, pointerEvents:"none", left:`${p.l}%`, top:`${p.t}%`, width:p.s, height:p.s, borderRadius:"50%", background:"rgba(255,255,255,.6)", animation:`floatDot ${p.d}s ease-in-out ${p.dl}s infinite` }} />
          ))}

          {/* Indicadores de vídeo */}
          <div style={{ position:"absolute", top:28, right:28, zIndex:10, display:"flex", gap:6 }}>
            {VIDEOS.map((_,i)=>(
              <button key={i} onClick={()=>{ setVidOpacity(0); setTimeout(()=>{ setVidIdx(i); setVidOpacity(1); },700); }}
                style={{ width:i===vidIdx?24:7, height:7, borderRadius:4, border:"none", cursor:"pointer", padding:0, transition:"all .3s", background:i===vidIdx?"rgba(255,255,255,.9)":"rgba(255,255,255,.28)" }} />
            ))}
          </div>

          {/* Hero content */}
          <div className={heroVisible?"hero-visible":""} style={{ position:"relative", zIndex:10, textAlign:"center", padding:"0 24px", maxWidth:700, transform:`translate(${mouseX}px,${mouseY}px)`, transition:"transform .1s ease-out" }}>

            <div className="h-l1" style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
              <div className="logo-breathe">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/pearl-logo.png" alt="Pearl.AI" width={130} height={130}
                  style={{ objectFit:"contain", display:"block" }} />
              </div>
            </div>

            <h1 className="h-l2" style={{ fontSize:"clamp(50px,7.5vw,90px)", fontWeight:800, letterSpacing:"-.04em", color:"#fff", lineHeight:.93, margin:0 }}>
              Pearl<span style={{ color:"rgba(255,255,255,.38)" }}>.AI</span>
            </h1>

            <p className="h-l3" style={{ fontSize:"clamp(14px,1.8vw,18px)", color:"rgba(255,255,255,.52)", marginTop:20, lineHeight:1.65, maxWidth:460, marginLeft:"auto", marginRight:"auto" }}>
              Plataforma de gestão e análise inteligente de holdings.<br/>
              IA em tempo real para decisões estratégicas.
            </p>

            <div className="h-l4" style={{ marginTop:36, display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <Link href="/login"    className="btn-white">Entrar <ArrowRight size={15} strokeWidth={2.5}/></Link>
              <Link href="/register" className="btn-glass">Criar conta</Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-bounce" style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(255,255,255,.25)" }}>Rolar</span>
            <ChevronDown size={15} color="rgba(255,255,255,.3)" />
          </div>

          {/* Copyright */}
          <div style={{ position:"absolute", bottom:24, right:28, zIndex:10 }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,.18)", letterSpacing:".06em" }}>PEARL.AI © 2026</span>
          </div>
        </section>

        {/* ══════════ FEATURES ══════════════════════════════════════════════ */}
        <section style={{ padding:"100px 24px", maxWidth:1160, margin:"0 auto" }}>
          <div ref={featRef}>
            {/* Header */}
            <div className={`reveal ${featInView?"in":""}`} style={{ textAlign:"center", marginBottom:64 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"var(--accent-soft,#8aa26a)", marginBottom:16, display:"block" }}>
                Por que Pearl.AI
              </span>
              <h2 style={{ fontSize:"clamp(32px,5vw,52px)", fontWeight:800, letterSpacing:"-.03em", color:"#fff", lineHeight:1.05, margin:0 }}>
                Tudo que sua holding precisa<br/>
                <span style={{ color:"rgba(255,255,255,.35)" }}>em um só lugar</span>
              </h2>
              <p style={{ fontSize:16, color:"rgba(255,255,255,.42)", marginTop:20, maxWidth:520, marginLeft:"auto", marginRight:"auto", lineHeight:1.7 }}>
                Desenvolvida para gestores exigentes que precisam de clareza, velocidade e inteligência na tomada de decisão.
              </p>
            </div>

            {/* Grid de features */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:16 }}>
              {FEATURES.map((f,i)=>(
                <div key={f.title} className={`feat-card reveal reveal-d${i+1} ${f.accent?"accent":""} ${featInView?"in":""}`}>
                  <div style={{ width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18, background:f.accent?"rgba(85,107,47,.25)":"rgba(255,255,255,.06)", border:`1px solid ${f.accent?"rgba(85,107,47,.4)":"rgba(255,255,255,.08)"}` }}>
                    <f.icon size={20} color={f.accent?"#8aa26a":"rgba(255,255,255,.7)"} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:"#fff", margin:"0 0 10px", letterSpacing:"-.01em" }}>{f.title}</h3>
                  <p style={{ fontSize:13.5, color:"rgba(255,255,255,.45)", lineHeight:1.7, margin:0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ DIVISOR ═══════════════════════════════════════════════ */}
        <div style={{ maxWidth:1160, margin:"0 auto 0", padding:"0 24px" }}>
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(85,107,47,.35),rgba(255,255,255,.12),rgba(85,107,47,.35),transparent)" }} />
        </div>

        {/* ══════════ PLANOS ════════════════════════════════════════════════ */}
        <section style={{ padding:"100px 24px 120px", maxWidth:960, margin:"0 auto" }}>
          <div ref={plansRef}>
            {/* Header */}
            <div className={`reveal ${plansInView?"in":""}`} style={{ textAlign:"center", marginBottom:60 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"var(--accent-soft,#8aa26a)", marginBottom:16, display:"block" }}>
                Planos
              </span>
              <h2 style={{ fontSize:"clamp(30px,5vw,48px)", fontWeight:800, letterSpacing:"-.03em", color:"#fff", lineHeight:1.1, margin:0 }}>
                Escolha o plano ideal
              </h2>
              <p style={{ fontSize:15, color:"rgba(255,255,255,.4)", marginTop:16, lineHeight:1.6 }}>
                Sem surpresas. Cancele a qualquer momento.
              </p>
            </div>

            {/* Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20, alignItems:"start" }}>
              {PLANS.map((plan,i)=>(
                <div key={plan.name} className={`reveal reveal-d${i*2+1} ${plansInView?"in":""}`} style={{
                  borderRadius:24, padding:"36px 32px",
                  background: plan.featured ? "rgba(85,107,47,.08)" : "rgba(255,255,255,.03)",
                  border: plan.featured ? "1px solid rgba(85,107,47,.35)" : "1px solid rgba(255,255,255,.08)",
                  position:"relative", overflow:"hidden",
                  boxShadow: plan.featured ? "0 0 60px rgba(85,107,47,.15)" : "none",
                }}>

                  {/* Badge */}
                  {plan.badge && (
                    <div style={{ position:"absolute", top:20, right:20, display:"flex", alignItems:"center", gap:5, background:"rgba(85,107,47,.2)", border:"1px solid rgba(85,107,47,.4)", borderRadius:50, padding:"4px 12px 4px 8px" }}>
                      <Star size={11} color="#8aa26a" fill="#8aa26a" />
                      <span style={{ fontSize:11, fontWeight:700, color:"#8aa26a", letterSpacing:".05em" }}>{plan.badge}</span>
                    </div>
                  )}

                  {/* Plano nome */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:plan.featured?"rgba(85,107,47,.25)":"rgba(255,255,255,.06)", border:`1px solid ${plan.featured?"rgba(85,107,47,.4)":"rgba(255,255,255,.1)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Zap size={16} color={plan.featured?"#8aa26a":"rgba(255,255,255,.6)"} fill={plan.featured?"rgba(85,107,47,.3)":"none"} strokeWidth={2}/>
                    </div>
                    <span style={{ fontSize:17, fontWeight:700, color:"#fff", letterSpacing:"-.01em" }}>{plan.name}</span>
                  </div>

                  {/* Preço */}
                  <div style={{ marginBottom:8 }}>
                    <span style={{ fontSize:42, fontWeight:800, color:"#fff", letterSpacing:"-.04em", lineHeight:1 }}>{plan.price}</span>
                    <span style={{ fontSize:14, color:"rgba(255,255,255,.35)", marginLeft:4 }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize:13.5, color:"rgba(255,255,255,.42)", lineHeight:1.6, marginBottom:28, marginTop:10 }}>{plan.desc}</p>

                  {/* Divisor */}
                  <div style={{ height:1, background: plan.featured ? "rgba(85,107,47,.25)" : "rgba(255,255,255,.07)", marginBottom:24 }} />

                  {/* Features lista */}
                  <ul style={{ listStyle:"none", padding:0, margin:"0 0 32px", display:"flex", flexDirection:"column", gap:10 }}>
                    {plan.features.map(feat=>(
                      <li key={feat} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13.5, color:"rgba(255,255,255,.7)" }}>
                        <span style={{ width:20, height:20, borderRadius:6, background:plan.featured?"rgba(85,107,47,.25)":"rgba(255,255,255,.07)", border:`1px solid ${plan.featured?"rgba(85,107,47,.4)":"rgba(255,255,255,.1)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Check size={11} color={plan.featured?"#8aa26a":"rgba(255,255,255,.6)"} strokeWidth={2.5}/>
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={plan.href} className={plan.featured?"btn-green":"btn-glass"} style={{ justifyContent:"center" }}>
                    {plan.cta} <ArrowRight size={15} strokeWidth={2.5}/>
                  </Link>
                </div>
              ))}
            </div>

            {/* Nota */}
            <p className={`reveal ${plansInView?"in":""}`} style={{ textAlign:"center", marginTop:32, fontSize:13, color:"rgba(255,255,255,.25)", lineHeight:1.6 }}>
              Todos os planos incluem período de teste de 14 dias. Sem cartão de crédito necessário para começar.
            </p>
          </div>
        </section>

        {/* ══════════ CTA FINAL ═════════════════════════════════════════════ */}
        <section style={{ padding:"80px 24px 100px", textAlign:"center" }}>
          <div ref={ctaRef}>
            <div className={`reveal ${ctaInView?"in":""}`} style={{ maxWidth:580, margin:"0 auto", padding:"56px 40px", borderRadius:28, background:"rgba(85,107,47,.07)", border:"1px solid rgba(85,107,47,.22)", boxShadow:"0 0 80px rgba(85,107,47,.1)" }}>
              <div style={{ marginBottom:20, display:"flex", justifyContent:"center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/pearl-logo.png" alt="Pearl.AI" width={64} height={64}
                  style={{ objectFit:"contain", display:"block" }} />
              </div>
              <h2 style={{ fontSize:"clamp(26px,4vw,38px)", fontWeight:800, letterSpacing:"-.03em", color:"#fff", margin:"0 0 14px" }}>
                Comece a usar hoje
              </h2>
              <p style={{ fontSize:15, color:"rgba(255,255,255,.44)", lineHeight:1.7, margin:"0 0 36px" }}>
                Crie sua conta e tenha visibilidade total da sua holding em menos de 5 minutos.
              </p>
              <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                <Link href="/register" className="btn-white">Criar conta grátis <ArrowRight size={15} strokeWidth={2.5}/></Link>
                <Link href="/login"    className="btn-glass">Já tenho conta</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ FOOTER ════════════════════════════════════════════════ */}
        <footer style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"40px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, maxWidth:1160, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/pearl-logo.png" alt="Pearl.AI" width={28} height={28}
              style={{ objectFit:"contain", display:"block" }} />
            <span style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,.6)", letterSpacing:"-.01em" }}>
              Pearl<span style={{ color:"rgba(85,107,47,.9)" }}>.AI</span>
            </span>
          </div>
          <div style={{ display:"flex", gap:24 }}>
            {[["Entrar","/login"],["Criar conta","/register"]].map(([label,href])=>(
              <Link key={href} href={href} style={{ fontSize:13, color:"rgba(255,255,255,.3)", textDecoration:"none", transition:"color .15s" }}
                onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,.7)")}
                onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,.3)")}>
                {label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.18)", letterSpacing:".05em" }}>PEARL.AI © 2026</span>
        </footer>

      </div>
    </>
  );
}
