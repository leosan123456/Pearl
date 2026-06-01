"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

const PARTICLES = [
  { left: 6,  top: 18, size: 2, dur: 6.4, delay: 0.2 },
  { left: 20, top: 75, size: 1, dur: 5.2, delay: 1.0 },
  { left: 30, top: 40, size: 2, dur: 7.1, delay: 0.5 },
  { left: 42, top: 88, size: 1, dur: 5.9, delay: 1.7 },
  { left: 53, top: 20, size: 3, dur: 8.0, delay: 0.0 },
  { left: 61, top: 58, size: 1, dur: 6.6, delay: 2.3 },
  { left: 70, top: 10, size: 2, dur: 5.4, delay: 0.8 },
  { left: 78, top: 46, size: 1, dur: 7.3, delay: 1.4 },
  { left: 86, top: 80, size: 2, dur: 6.1, delay: 0.3 },
  { left: 93, top: 30, size: 1, dur: 5.7, delay: 2.0 },
  { left: 14, top: 62, size: 1, dur: 7.8, delay: 0.7 },
  { left: 47, top: 92, size: 2, dur: 6.5, delay: 1.6 },
  { left: 3,  top: 50, size: 1, dur: 7.0, delay: 2.5 },
  { left: 35, top: 6,  size: 2, dur: 5.8, delay: 1.1 },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [nameFocus,    setNameFocus]    = useState(false);
  const [emailFocus,   setEmailFocus]   = useState(false);
  const [passFocus,    setPassFocus]    = useState(false);
  const [confirmFocus, setConfirmFocus] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spot, setSpot] = useState({ x: 50, y: 50, visible: false });

  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);

  // Parallax video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf: number, tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      tx = -(e.clientX / window.innerWidth  - 0.5) * 32;
      ty = -(e.clientY / window.innerHeight - 0.5) * 20;
    };
    const tick = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      video.style.transform = `scale(1.15) translate(${cx}px,${cy}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const onCardMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const nx = (e.clientX - left) / width;
    const ny = (e.clientY - top)  / height;
    setTilt({ x: -(ny - 0.5) * 9, y: (nx - 0.5) * 9 });
    setSpot({ x: nx * 100, y: ny * 100, visible: true });
  }, []);

  const onCardLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setSpot(s => ({ ...s, visible: false }));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword: confirm }),
    });
    setLoading(false);
    const body = await res.json();
    if (!res.ok) { setError(body.error || "Falha ao criar a conta."); return; }
    setSuccess("Conta criada! Redirecionando...");
    setTimeout(() => router.push("/login?registered=1"), 1200);
  }

  const nameActive    = nameFocus    || name    !== "";
  const emailActive   = emailFocus   || email   !== "";
  const passActive    = passFocus    || password !== "";
  const confirmActive = confirmFocus || confirm  !== "";

  return (
    <>
      <style>{`
        @keyframes registerSlideUp { from{transform:translateY(24px)} to{transform:translateY(0)} }
        @keyframes floatDot { 0%,100%{transform:translateY(0) scale(1);opacity:.3} 50%{transform:translateY(-14px) scale(1.5);opacity:.8} }
        @keyframes logoPulse { 0%,100%{opacity:.9} 50%{opacity:1;filter:drop-shadow(0 0 10px rgba(255,255,255,.3))} }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .reg-logo { animation:registerSlideUp .7s cubic-bezier(.22,.68,0,1.2) both; }
        .reg-card { animation:registerSlideUp .8s cubic-bezier(.22,.68,0,1.2) .06s both; }
        .float-label {
          position:absolute; left:14px; top:50%; transform:translateY(-50%);
          font-size:14px; color:rgba(255,255,255,.35); pointer-events:none; transition:all .18s ease;
        }
        .float-label.active {
          top:10px; transform:translateY(0); font-size:10px;
          font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:rgba(255,255,255,.55);
        }
        .reg-input {
          width:100%; padding:22px 14px 8px; border-radius:14px; font-size:14px;
          outline:none; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1);
          color:#fff; transition:border-color .2s,box-shadow .2s,background .2s; caret-color:#fff;
        }
        .reg-input:focus { border-color:rgba(255,255,255,.45); background:rgba(255,255,255,.07); box-shadow:0 0 0 3px rgba(255,255,255,.07); }
        .reg-btn {
          width:100%; padding:15px; border-radius:16px; font-weight:600; font-size:14px;
          display:flex; align-items:center; justify-content:center; gap:8px;
          background:#fff; color:#000; cursor:pointer; border:none; transition:all .2s;
          box-shadow:0 4px 20px rgba(255,255,255,.15),inset 0 1px 0 rgba(255,255,255,.8);
        }
        .reg-btn:hover:not(:disabled) { background:#f0f0f0; box-shadow:0 8px 32px rgba(255,255,255,.25),inset 0 1px 0 rgba(255,255,255,.9); transform:translateY(-1px); }
        .reg-btn:active:not(:disabled) { transform:translateY(0) scale(.99); }
        .reg-btn:disabled { background:rgba(255,255,255,.12); color:rgba(255,255,255,.3); cursor:not-allowed; box-shadow:none; }
        ::placeholder { color:transparent !important; }
      `}</style>

      <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"#050505" }}>

        <video ref={videoRef} autoPlay loop muted playsInline
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0, willChange:"transform", opacity:.55 }}>
          <source src="/videos/login-bg.mp4" type="video/mp4" />
        </video>

        <div style={{ position:"absolute", inset:0, zIndex:1, background:"linear-gradient(160deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.5) 50%,rgba(0,0,0,.85) 100%)" }} />
        <div style={{ position:"absolute", inset:0, zIndex:1, background:"radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(0,0,0,.65) 100%)" }} />

        {PARTICLES.map((p, i) => (
          <div key={i} style={{ position:"absolute", zIndex:2, pointerEvents:"none", left:`${p.left}%`, top:`${p.top}%`, width:p.size, height:p.size, borderRadius:"50%", background:"rgba(255,255,255,.55)", animation:`floatDot ${p.dur}s ease-in-out ${p.delay}s infinite` }} />
        ))}

        <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:440 }}>

          {/* Logo */}
          <div className="reg-logo" style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
            <div style={{ width:120, height:120, borderRadius:32, marginBottom:16, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 1px rgba(255,255,255,.04),0 12px 40px rgba(0,0,0,.6)", animation:"logoPulse 4s ease-in-out infinite" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/pearl-logo.png" alt="Pearl.AI" width={92} height={92}
                style={{ objectFit:"contain", display:"block" }} />
            </div>
            <h1 style={{ fontSize:36, fontWeight:700, letterSpacing:"-0.03em", color:"#fff", lineHeight:1, marginBottom:8 }}>
              Pearl<span style={{ color:"rgba(255,255,255,.45)" }}>.AI</span>
            </h1>
            <p style={{ color:"rgba(255,255,255,.38)", fontSize:13, textAlign:"center", maxWidth:260 }}>
              Crie sua conta e acesse a plataforma de análise
            </p>
          </div>

          {/* Card */}
          <div ref={cardRef} className="reg-card" onMouseMove={onCardMove} onMouseLeave={onCardLeave}
            style={{ position:"relative", overflow:"hidden", background:"rgba(255,255,255,.04)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:28, padding:"32px 34px 28px", boxShadow:"0 32px 80px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.07)", transform:`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition:"transform .12s ease-out", willChange:"transform" }}>

            <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", background:`radial-gradient(240px circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,.055) 0%, transparent 70%)`, opacity:spot.visible?1:0, transition:"opacity .3s" }} />
            <div style={{ position:"absolute", left:0, right:0, height:1, zIndex:1, pointerEvents:"none", background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)", animation:"scanLine 6s linear infinite" }} />

            <div style={{ position:"relative", zIndex:2 }}>
              {error && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, marginBottom:18, background:"rgba(255,80,80,.1)", border:"1px solid rgba(255,80,80,.2)" }}>
                  <AlertCircle size={15} color="rgba(255,120,120,1)" />
                  <span style={{ color:"rgba(255,160,160,1)", fontSize:13 }}>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, marginBottom:18, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.15)" }}>
                  <CheckCircle2 size={15} color="rgba(200,255,200,1)" />
                  <span style={{ color:"rgba(200,255,200,1)", fontSize:13 }}>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ position:"relative" }}>
                  <span className={`float-label${nameActive?" active":""}`}>Nome completo</span>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} onFocus={()=>setNameFocus(true)} onBlur={()=>setNameFocus(false)} required className="reg-input" />
                </div>
                <div style={{ position:"relative" }}>
                  <span className={`float-label${emailActive?" active":""}`}>E-mail</span>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setEmailFocus(true)} onBlur={()=>setEmailFocus(false)} required className="reg-input" />
                </div>
                <div style={{ position:"relative" }}>
                  <span className={`float-label${passActive?" active":""}`}>Senha</span>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onFocus={()=>setPassFocus(true)} onBlur={()=>setPassFocus(false)} required className="reg-input" />
                </div>
                <div style={{ position:"relative" }}>
                  <span className={`float-label${confirmActive?" active":""}`}>Confirmar senha</span>
                  <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} onFocus={()=>setConfirmFocus(true)} onBlur={()=>setConfirmFocus(false)} required className="reg-input"
                    style={{ borderColor: confirm && confirm !== password ? "rgba(255,100,100,.5)" : undefined }} />
                </div>
                <button type="submit" disabled={loading} className="reg-btn" style={{ marginTop:6 }}>
                  {loading ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"spin 1s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Criando conta...
                    </>
                  ) : (
                    <>Criar conta <ArrowRight size={15} strokeWidth={2.5}/></>
                  )}
                </button>
              </form>

              <div style={{ marginTop:20, paddingTop:18, borderTop:"1px solid rgba(255,255,255,.07)", textAlign:"center" }}>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.28)" }}>
                  Já tem conta?{" "}
                  <Link href="/login" style={{ color:"rgba(255,255,255,.75)", fontWeight:600, textDecoration:"underline", textDecorationColor:"rgba(255,255,255,.2)" }}>Entrar</Link>
                </p>
              </div>
            </div>
          </div>

          <p style={{ textAlign:"center", marginTop:20, fontSize:11, color:"rgba(255,255,255,.15)", letterSpacing:"0.07em" }}>PEARL.AI © 2026</p>
        </div>
      </div>
    </>
  );
}
