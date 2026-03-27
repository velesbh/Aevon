"use client";

import React, { useEffect, useRef, memo } from "react";

/* ═══════════════════════════════════════════════════════
   Writing-themed sketch system for the Aevon landing page.
   - All SVGs are inline (no fixed overlays).
   - Uses currentColor / var(--primary) for theme compat.
   - Intentional edge placement, not random scatter.
   - Desktop-only decorations (hidden sm, visible md+).
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   1. CURSOR STROKE — canvas ink trail
   ═══════════════════════════════════════════════ */

export const CursorStroke = memo(function CursorStroke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const points = useRef<{ x: number; y: number; age: number }[]>([]);
  const raf = useRef(0);
  const lastMove = useRef(0);
  const isIdle = useRef(true);
  const strokeColor = useRef("24,128,56");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let w = 0, h = 0;

    const readColor = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--primary-rgb").trim();
      if (raw) strokeColor.current = raw;
    };
    readColor();
    const obs = new MutationObserver(readColor);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      lastMove.current = performance.now();
      isIdle.current = false;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const MAX_POINTS = 28;
    const MAX_AGE = 800;

    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      const now = performance.now();
      if (now - lastMove.current > 120) isIdle.current = true;

      if (!isIdle.current) {
        const pts = points.current;
        const last = pts[pts.length - 1];
        const mx = mouse.current.x;
        const my = mouse.current.y;
        if (!last || Math.abs(mx - last.x) + Math.abs(my - last.y) > 3) {
          pts.push({ x: mx, y: my, age: 0 });
          if (pts.length > MAX_POINTS) pts.shift();
        }
      }

      const dt = 16;
      const pts = points.current;
      for (let i = pts.length - 1; i >= 0; i--) {
        pts[i].age += dt;
        if (pts[i].age > MAX_AGE) pts.splice(i, 1);
      }

      ctx.clearRect(0, 0, w, h);
      if (pts.length < 2) return;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const life = 1 - p1.age / MAX_AGE;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${strokeColor.current}, ${life * 0.5})`;
        ctx.lineWidth = life * 3 + 0.8;
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      obs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none hidden md:block"
      style={{ contain: "strict" }}
      aria-hidden="true"
    />
  );
});

/* ═══════════════════════════════════════════════
   2. SECTION BACKGROUND SKETCHES
   Writing-themed, edge-anchored, desktop-only.
   ═══════════════════════════════════════════════ */

export function SketchBackground({ variant = "hero" }: { variant?: "hero" | "features" | "bento" | "cta" }) {
  const layouts: Record<string, React.ReactNode> = {
    hero: (
      <>
        {/* Flowing ink line — left edge, runs top to middle */}
        <svg className="absolute top-[10%] left-0 w-[120px] h-[400px] hidden md:block" viewBox="0 0 120 400" fill="none" aria-hidden="true">
          <path
            d="M80 0C75 40 20 60 30 120C40 180 10 200 25 260C40 320 15 360 35 400"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.08"
          />
          <path
            d="M90 0C85 50 30 80 40 140C50 200 20 230 35 290"
            stroke="var(--primary)"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.05"
          />
        </svg>

        {/* Quill pen — top right corner */}
        <svg className="absolute top-[6%] right-[4%] w-[80px] h-[80px] hidden lg:block" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <path
            d="M60 8C55 12 35 35 28 48C24 55 22 60 20 65L18 72L25 68C30 64 38 56 50 38C58 26 64 14 60 8Z"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.1"
          />
          <path d="M18 72L14 76" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" opacity="0.1" />
          <path d="M28 48C32 50 34 54 30 60" stroke="var(--primary)" strokeWidth="0.8" strokeLinecap="round" opacity="0.07" />
        </svg>

        {/* Notebook ruled lines — right edge, faint */}
        <svg className="absolute top-[35%] right-0 w-[100px] h-[200px] hidden lg:block" viewBox="0 0 100 200" fill="none" aria-hidden="true">
          <line x1="10" y1="20" x2="90" y2="22" stroke="currentColor" strokeWidth="0.6" opacity="0.06" />
          <line x1="10" y1="50" x2="85" y2="51" stroke="currentColor" strokeWidth="0.6" opacity="0.05" />
          <line x1="10" y1="80" x2="92" y2="81" stroke="currentColor" strokeWidth="0.6" opacity="0.06" />
          <line x1="10" y1="110" x2="80" y2="112" stroke="currentColor" strokeWidth="0.6" opacity="0.04" />
          <line x1="10" y1="140" x2="88" y2="141" stroke="currentColor" strokeWidth="0.6" opacity="0.05" />
          <line x1="10" y1="170" x2="82" y2="171" stroke="currentColor" strokeWidth="0.6" opacity="0.06" />
        </svg>
      </>
    ),

    features: (
      <>
        {/* Open book outline — left edge */}
        <svg className="absolute top-[8%] left-[2%] w-[90px] h-[70px] hidden lg:block" viewBox="0 0 90 70" fill="none" aria-hidden="true">
          <path
            d="M45 12C35 8 18 6 4 10V62C18 58 35 60 45 65C55 60 72 58 86 62V10C72 6 55 8 45 12Z"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.07"
          />
          <line x1="45" y1="12" x2="45" y2="65" stroke="currentColor" strokeWidth="0.8" opacity="0.05" />
        </svg>

        {/* Ink splatter — right side, subtle */}
        <svg className="absolute bottom-[12%] right-[3%] w-[60px] h-[60px] hidden md:block" viewBox="0 0 60 60" fill="none" aria-hidden="true">
          <circle cx="30" cy="30" r="8" fill="currentColor" opacity="0.04" />
          <circle cx="18" cy="22" r="3" fill="currentColor" opacity="0.03" />
          <circle cx="40" cy="20" r="2.5" fill="currentColor" opacity="0.03" />
          <circle cx="22" cy="42" r="2" fill="currentColor" opacity="0.025" />
          <circle cx="42" cy="38" r="3.5" fill="currentColor" opacity="0.03" />
          <circle cx="35" cy="48" r="1.5" fill="currentColor" opacity="0.02" />
        </svg>
      </>
    ),

    bento: (
      <>
        {/* Pencil sketch — bottom left corner */}
        <svg className="absolute bottom-[5%] left-[3%] w-[100px] h-[30px] hidden md:block" viewBox="0 0 100 30" fill="none" aria-hidden="true">
          <path
            d="M5 20L75 18L82 15L90 18L82 21L75 18"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.06"
          />
          <path d="M90 18L95 18" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.04" />
        </svg>

        {/* Margin line — left edge */}
        <svg className="absolute top-0 left-[5%] w-[2px] h-full hidden lg:block" viewBox="0 0 2 100" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <line x1="1" y1="0" x2="1" y2="100" stroke="var(--primary)" strokeWidth="1" opacity="0.06" />
        </svg>
      </>
    ),

    cta: (
      <>
        {/* Ink flourish — centered, very faint */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[200px] md:h-[300px] hidden md:block" viewBox="0 0 600 300" fill="none" aria-hidden="true">
          <path
            d="M100 150C150 80 220 60 300 90C380 120 450 80 500 150"
            stroke="var(--primary)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.05"
          />
          <path
            d="M120 170C180 110 240 100 300 120C360 140 420 110 480 170"
            stroke="var(--primary)"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.035"
          />
        </svg>
      </>
    ),
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {layouts[variant]}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   3. INLINE ACCENTS
   ═══════════════════════════════════════════════ */

export function DoodleUnderline({ className = "" }: { className?: string }) {
  return (
    <svg className={`inline-block ${className}`} viewBox="0 0 200 12" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2 8C30 3 60 10 100 6C140 2 170 9 198 5"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="sketch-underline"
      />
    </svg>
  );
}

export function SketchArrowDown({ className = "" }: { className?: string }) {
  return (
    <svg className={`pointer-events-none ${className}`} viewBox="0 0 24 60" fill="none" aria-hidden="true">
      <path d="M12 2C11 18 13 36 12 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 46L12 55L17 46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SketchArrowCurved({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 60 50"
      fill="none"
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M4 10C14 4 34 2 48 16C52 20 50 28 46 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 24L46 31L40 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
