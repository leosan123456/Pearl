"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

// ─── Particle positions (stable, computed once) ──────────────────────────────
const PARTICLES = [
  { left: 8,  top: 12, size: 2, dur: 6.2, delay: 0    },
  { left: 18, top: 72, size: 1, dur: 5.1, delay: 0.8  },
  { left: 27, top: 38, size: 2, dur: 7.4, delay: 1.5  },
  { left: 36, top: 85, size: 1, dur: 5.8, delay: 0.3  },
  { left: 45, top: 22, size: 3, dur: 8.1, delay: 2.1  },
  { left: 55, top: 60, size: 1, dur: 6.7, delay: 0.6  },
  { left: 63, top: 14, size: 2, dur: 5.5, delay: 1.2  },
  { left: 72, top: 48, size: 1, dur: 7.0, delay: 1.8  },
  { left: 80, top: 82, size: 2, dur: 6.3, delay: 0.4  },
  { left: 89, top: 32, size: 1, dur: 5.9, delay: 2.4  },
  { left: 12, top: 54, size: 1, dur: 7.6, delay: 0.9  },
  { left: 92, top: 66, size: 2, dur: 6.8, delay: 1.4  },
  { left: 50, top: 90, size: 1, dur: 5.3, delay: 0.7  },
  { left: 3,  top: 42, size: 2, dur: 7.2, delay: 1.9  },
  { left: 75, top: 8,  size: 1, dur: 6.0, delay: 2.6  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [emailFocus, setEmailFocus]       = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [tilt, setTilt]         = useState({ x: 0, y: 0 });
  const [spot, setSpot]         = useState({ x: 50, y: 50, visible: false });

  const searchParams = useSearchParams();
  const registered   = searchParams.get("registered");
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);

  // ── Parallax video ──────────────────────────────────────────────────────────
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

  // ── Card 3D tilt + spotlight ────────────────────────────────────────────────
  const onCardMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const nx = (e.clientX - left) / width;   // 0–1
    const ny = (e.clientY - top)  / height;  // 0–1
    setTilt({ x: -(ny - 0.5) * 9, y: (nx - 0.5) * 9 });
    setSpot({ x: nx * 100, y: ny * 100, visible: true });
  }, []);

  const onCardLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setSpot(s => ({ ...s, visible: false }));
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("E-mail ou senha inválidos.");
    else { router.push("/dashboard"); router.refresh(); }
  }

  const emailActive    = emailFocus    || email    !== "";
  const passwordActive = passwordFocus || password !== "";

  return (
    <>
      {/* ── Global styles ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes loginSlideUp {
          from { transform: translateY(24px); }
          to   { transform: translateY(0); }
        }
        @keyframes floatDot {
          0%,100% { transform: translateY(0) scale(1); opacity:.3; }
          50%     { transform: translateY(-14px) scale(1.5); opacity:.8; }
        }
        @keyframes logoPulse {
          0%,100% { opacity:.9; }
          50%     { opacity:1; filter:drop-shadow(0 0 12px rgba(255,255,255,.35)); }
        }
        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-logo { animation: loginSlideUp .7s cubic-bezier(.22,.68,0,1.2) both; }
        .login-card { animation: loginSlideUp .8s cubic-bezier(.22,.68,0,1.2) .06s both; }
        .float-label {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          font-size: 14px; color: rgba(255,255,255,.35);
          pointer-events: none; transition: all .18s ease;
        }
        .float-label.active {
          top: 10px; transform: translateY(0); font-size: 10px;
          font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: rgba(255,255,255,.55);
        }
        .login-input {
          width: 100%; padding: 22px 14px 8px; border-radius: 14px; font-size: 14px;
          outline: none; background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          color: #fff; transition: border-color .2s, box-shadow .2s, background .2s;
          caret-color: #fff;
        }
        .login-input:focus {
          border-color: rgba(255,255,255,.45);
          background: rgba(255,255,255,.07);
          box-shadow: 0 0 0 3px rgba(255,255,255,.07);
        }
        .login-btn {
          width: 100%; padding: 15px; border-radius: 16px; font-weight: 600;
          font-size: 14px; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          background: #fff; color: #000; cursor: pointer;
          border: none; transition: all .2s; letter-spacing: .01em;
          box-shadow: 0 4px 20px rgba(255,255,255,.15), inset 0 1px 0 rgba(255,255,255,.8);
        }
        .login-btn:hover:not(:disabled) {
          background: #f0f0f0;
          box-shadow: 0 8px 32px rgba(255,255,255,.25), inset 0 1px 0 rgba(255,255,255,.9);
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0) scale(.99); }
        .login-btn:disabled { background: rgba(255,255,255,.12); color: rgba(255,255,255,.3); cursor: not-allowed; box-shadow: none; }
        ::placeholder { color: transparent !important; }
      `}</style>

      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#050505" }}>

        {/* ── Video BG ──────────────────────────────────────────────────────── */}
        <video ref={videoRef} autoPlay loop muted playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, willChange: "transform", opacity: .55 }}>
          <source src="/videos/login-bg.mp4" type="video/mp4" />
        </video>

        {/* ── Overlays ──────────────────────────────────────────────────────── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(160deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.5) 50%,rgba(0,0,0,.85) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(0,0,0,.65) 100%)" }} />

        {/* ── Particles ─────────────────────────────────────────────────────── */}
        {PARTICLES.map((p, i) => (
          <div key={i} style={{
            position: "absolute", zIndex: 2, pointerEvents: "none",
            left: `${p.left}%`, top: `${p.top}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: "rgba(255,255,255,.55)",
            animation: `floatDot ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }} />
        ))}

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420 }}>

          {/* Logo section */}
          <div className="login-logo" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
            {/* Logo */}
            <div style={{
              width: 120, height: 120, borderRadius: 32, marginBottom: 20,
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 1px rgba(255,255,255,.04), 0 16px 48px rgba(0,0,0,.6)",
              animation: "logoPulse 4s ease-in-out infinite",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/pearl-logo.png" alt="Pearl.AI" width={92} height={92}
                style={{ objectFit:"contain", display:"block" }} />
            </div>

            <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1, marginBottom: 10 }}>
              Pearl<span style={{ color: "rgba(255,255,255,.45)" }}>.AI</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,.38)", fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>
              Gestão inteligente de holdings com análise em tempo real
            </p>
          </div>

          {/* Card */}
          <div
            ref={cardRef}
            className="login-card"
            onMouseMove={onCardMove}
            onMouseLeave={onCardLeave}
            style={{
              position: "relative", overflow: "hidden",
              background: "rgba(255,255,255,.04)",
              backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 28,
              padding: "36px 34px 28px",
              boxShadow: "0 32px 80px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.07)",
              transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform .12s ease-out",
              willChange: "transform",
            }}
          >
            {/* Cursor spotlight */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
              background: `radial-gradient(240px circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,.055) 0%, transparent 70%)`,
              opacity: spot.visible ? 1 : 0, transition: "opacity .3s",
            }} />

            {/* Subtle scan line */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 1, zIndex: 1, pointerEvents: "none",
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)",
              animation: "scanLine 6s linear infinite",
            }} />

            {/* Card content */}
            <div style={{ position: "relative", zIndex: 2 }}>

              {registered === "1" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, marginBottom: 20, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)" }}>
                  <span style={{ color: "#fff", fontSize: 13 }}>✓ Conta criada! Faça login abaixo.</span>
                </div>
              )}

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, marginBottom: 20, background: "rgba(255,80,80,.1)", border: "1px solid rgba(255,80,80,.2)" }}>
                  <AlertCircle size={15} color="rgba(255,120,120,1)" />
                  <span style={{ color: "rgba(255,160,160,1)", fontSize: 13 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Email */}
                <div style={{ position: "relative" }}>
                  <span className={`float-label${emailActive ? " active" : ""}`}>E-mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    required
                    className="login-input"
                  />
                </div>

                {/* Password */}
                <div style={{ position: "relative" }}>
                  <span className={`float-label${passwordActive ? " active" : ""}`}>Senha</span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    required
                    className="login-input"
                  />
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="login-btn" style={{ marginTop: 6 }}>
                  {loading ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Autenticando...
                    </>
                  ) : (
                    <>Entrar <ArrowRight size={15} strokeWidth={2.5} /></>
                  )}
                </button>
              </form>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.07)", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.28)" }}>
                  Não tem conta?{" "}
                  <Link href="/register" style={{ color: "rgba(255,255,255,.75)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(255,255,255,.2)" }}>
                    Criar conta
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: 22, fontSize: 11, color: "rgba(255,255,255,.15)", letterSpacing: "0.07em" }}>
            PEARL.AI © 2026
          </p>
        </div>
      </div>
    </>
  );
}
