"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const VIDEOS = [
  "/videos/login-bg.mp4",   // Futurista / espaço
  "/videos/v3.mp4",          // Drone alpino
  "/videos/login-bg2.mp4",   // Floresta / natureza
  "/videos/v4.mp4",          // Campos floridos
  "/videos/v5.mp4",          // Pet / movimento
  "/videos/v6.mp4",          // Casal / memórias
  "/videos/v7.mp4",          // Jardim japonês
];

export default function ParallaxBg() {
  const b1 = useRef<HTMLDivElement>(null);
  const b2 = useRef<HTMLDivElement>(null);
  const b3 = useRef<HTMLDivElement>(null);

  const [vidIdx,     setVidIdx]     = useState(0);
  const [vidOpacity, setVidOpacity] = useState(1);

  // ── Parallax blobs ────────────────────────────────────────────────────────
  useEffect(() => {
    let raf: number;
    let t1x=0,t1y=0,c1x=0,c1y=0;
    let t2x=0,t2y=0,c2x=0,c2y=0;
    let t3x=0,t3y=0,c3x=0,c3y=0;

    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth  - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      t1x = nx * 55;  t1y = ny * 40;
      t2x = nx * -38; t2y = ny * -28;
      t3x = nx * 22;  t3y = ny * 18;
    };

    const tick = () => {
      c1x += (t1x-c1x)*.035; c1y += (t1y-c1y)*.035;
      c2x += (t2x-c2x)*.045; c2y += (t2y-c2y)*.045;
      c3x += (t3x-c3x)*.025; c3y += (t3y-c3y)*.025;
      if (b1.current) b1.current.style.transform = `translate(${c1x}px,${c1y}px)`;
      if (b2.current) b2.current.style.transform = `translate(${c2x}px,${c2y}px)`;
      if (b3.current) b3.current.style.transform = `translate(${c3x}px,${c3y}px)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  // ── Crossfade ao fim do vídeo ─────────────────────────────────────────────
  const onEnded = useCallback(() => {
    setVidOpacity(0);
    setTimeout(() => {
      setVidIdx(i => (i + 1) % VIDEOS.length);
      setVidOpacity(1);
    }, 800);
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>

      {/* ── Vídeo em looping ─────────────────────────────────────────────── */}
      <video
        key={VIDEOS[vidIdx]}
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
        style={{
          position:"absolute", inset:0,
          width:"100%", height:"100%",
          objectFit:"cover",
          opacity: vidOpacity * 0.18,   // muito sutil no dashboard
          transition:"opacity .8s ease",
          willChange:"transform",
          zIndex:0,
        }}
      >
        <source src={VIDEOS[vidIdx]} type="video/mp4" />
      </video>

      {/* ── Overlay escuro — mantém legibilidade do dashboard ────────────── */}
      <div style={{
        position:"absolute", inset:0, zIndex:1,
        background:"linear-gradient(135deg,rgba(5,5,5,.92) 0%,rgba(5,5,5,.85) 100%)",
      }} />

      {/* ── Blobs verdes parallax ─────────────────────────────────────────── */}
      <div ref={b1} style={{
        position:"absolute", width:700, height:700, borderRadius:"50%", zIndex:2,
        background:"radial-gradient(circle, rgba(85,107,47,.13) 0%, transparent 65%)",
        filter:"blur(70px)", top:-200, left:-180, willChange:"transform",
      }} />
      <div ref={b2} style={{
        position:"absolute", width:550, height:550, borderRadius:"50%", zIndex:2,
        background:"radial-gradient(circle, rgba(74,93,35,.09) 0%, transparent 65%)",
        filter:"blur(80px)", bottom:-150, right:-100, willChange:"transform",
      }} />
      <div ref={b3} style={{
        position:"absolute", width:400, height:400, borderRadius:"50%", zIndex:2,
        background:"radial-gradient(circle, rgba(255,255,255,.022) 0%, transparent 70%)",
        filter:"blur(60px)", top:"35%", left:"40%", willChange:"transform",
      }} />
    </div>
  );
}
