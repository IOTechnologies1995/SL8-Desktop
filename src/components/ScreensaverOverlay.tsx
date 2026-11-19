import React, { useEffect, useRef, useState } from 'react';
import { ScreensaverId } from '../types/os';
import { SL8_LOGO_SRC } from './AppIcons';

interface ScreensaverOverlayProps {
  active: boolean;
  variant: ScreensaverId;
  accentHex: string;
  clock24Hour: boolean;
  onDismiss: () => void;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 229,
    Number.isFinite(b) ? b : 255,
  ];
}

export const ScreensaverOverlay: React.FC<ScreensaverOverlayProps> = ({
  active,
  variant,
  accentHex,
  clock24Hour,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [drift, setDrift] = useState({ x: 0, y: 0 });
  const armedAtRef = useRef<number>(0);
  const originPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Smooth clock + seconds progress update
  useEffect(() => {
    if (!active) return;
    armedAtRef.current = performance.now() + 380;
    originPointerRef.current = null;

    let rafId = 0;
    const start = performance.now();
    const tick = (ts: number) => {
      setNow(new Date());
      const elapsed = (ts - start) / 1000;
      setDrift({
        x: Math.sin(elapsed * 0.22) * 34,
        y: Math.cos(elapsed * 0.17) * 24,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onKeyDown = (e: KeyboardEvent) => {
      if (performance.now() < armedAtRef.current) return;
      e.preventDefault();
      onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [active, onDismiss]);

  // Fullscreen canvas renderer for all 4 OS screensaver modes
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [ar, ag, ab] = hexToRgb(accentHex);
    const rgba = (a: number) => `rgba(${ar}, ${ag}, ${ab}, ${a})`;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const shards = Array.from({ length: 18 }, (_, i) => ({
      x: (i * 0.193) % 1,
      y: (i * 0.271) % 1,
      w: 0.08 + ((i * 0.037) % 0.16),
      h: 0.1 + ((i * 0.043) % 0.2),
      vx: (i % 2 === 0 ? 1 : -1) * (0.015 + (i % 4) * 0.006),
      vy: (i % 3 === 0 ? 1 : -1) * (0.008 + (i % 3) * 0.004),
      accent: i % 2 === 0,
    }));

    const stars = Array.from({ length: 120 }, (_, i) => ({
      x: ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 2 - 1,
      y: ((Math.cos(i * 78.233) * 19341.21) % 1) * 2 - 1,
      z: ((i * 0.083) % 1) + 0.05,
    }));

    let rafId = 0;
    const start = performance.now();

    const draw = (ts: number) => {
      const t = (ts - start) / 1000;
      ctx.fillStyle = '#030407';
      ctx.fillRect(0, 0, width, height);

      if (variant === 'gateway-clock') {
        const cx = width / 2;
        const cy = height / 2;
        const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.5);
        glow.addColorStop(0, rgba(0.14));
        glow.addColorStop(0.5, rgba(0.03));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        // Subtle sweeping architectural horizon hairlines
        for (let i = 0; i < 6; i++) {
          const y = ((i / 6 + t * 0.025) % 1) * height;
          ctx.strokeStyle = i % 2 === 0 ? rgba(0.11) : 'rgba(255,255,255,0.04)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else if (variant === 'glass-shards') {
        shards.forEach((s) => {
          const rx = ((((s.x + t * s.vx) % 1.3) + 1.3) % 1.3 - 0.15) * width;
          const ry = ((((s.y + t * s.vy) % 1.3) + 1.3) % 1.3 - 0.15) * height;
          const rw = s.w * width;
          const rh = s.h * height;

          const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
          grad.addColorStop(0, 'rgba(26, 33, 46, 0.34)');
          grad.addColorStop(1, s.accent ? rgba(0.1) : 'rgba(8, 10, 15, 0.52)');
          ctx.fillStyle = grad;
          ctx.fillRect(rx, ry, rw, rh);

          ctx.strokeStyle = s.accent ? rgba(0.55) : 'rgba(255,255,255,0.16)';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);

          ctx.fillStyle = s.accent ? rgba(0.85) : 'rgba(255,255,255,0.35)';
          ctx.fillRect(rx, ry, rw, 1.5);
        });
      } else if (variant === 'starfield-grid') {
        const cx = width / 2;
        const cy = height / 2;

        // Perspective corridor frames flying forward
        for (let i = 0; i < 10; i++) {
          const depth = ((i / 10 + t * 0.18) % 1);
          const scale = Math.pow(depth, 2.1);
          const rw = width * scale * 1.15;
          const rh = height * scale * 1.15;
          ctx.strokeStyle = rgba(0.06 + scale * 0.42);
          ctx.lineWidth = 0.8 + scale * 1.2;
          ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);
        }

        // Corner rays from vanishing point
        ctx.strokeStyle = rgba(0.16);
        ctx.lineWidth = 1;
        [
          [0, 0],
          [width, 0],
          [0, height],
          [width, height],
        ].forEach(([tx, ty]) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        });

        // Sharp square starlight particles
        stars.forEach((st) => {
          const z = (((st.z - t * 0.22) % 1) + 1) % 1;
          const inv = 1 / (z + 0.08);
          const sx = cx + st.x * width * 0.35 * inv;
          const sy = cy + st.y * height * 0.35 * inv;
          if (sx < 0 || sx > width || sy < 0 || sy > height) return;
          const sz = Math.max(1.2, (1 - z) * 4);
          ctx.fillStyle = z < 0.35 ? rgba(0.92) : `rgba(255,255,255,${(1 - z) * 0.75})`;
          ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        });
      } else {
        // accent-ribbons
        const ribbons = 9;
        for (let r = 0; r < ribbons; r++) {
          const baseY = height * (0.2 + r * 0.075);
          const amp = height * (0.06 + (r % 3) * 0.025);
          const freq = 0.0022 + r * 0.00045;
          const phase = t * (0.55 + r * 0.12) * (r % 2 === 0 ? 1 : -1);

          ctx.beginPath();
          for (let x = 0; x <= width; x += 12) {
            const y =
              baseY +
              Math.sin(x * freq + phase) * amp +
              Math.sin(x * freq * 1.9 - phase * 0.7) * (amp * 0.35);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = r % 2 === 0 ? rgba(0.65 - r * 0.04) : 'rgba(255,255,255,0.22)';
          ctx.lineWidth = r % 3 === 0 ? 2 : 1.1;
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [active, variant, accentHex]);

  if (!active) return null;

  const secondsFraction = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !clock24Hour,
  });
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (performance.now() < armedAtRef.current) return;
    if (!originPointerRef.current) {
      originPointerRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const dx = e.clientX - originPointerRef.current.x;
    const dy = e.clientY - originPointerRef.current.y;
    if (Math.hypot(dx, dy) > 16) {
      onDismiss();
    }
  };

  const handlePointerDown = () => {
    if (performance.now() < armedAtRef.current) return;
    onDismiss();
  };

  return (
    <div
      role="dialog"
      aria-label="SL8 Screensaver"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      className="fixed inset-0 z-[110] bg-[#030407] cursor-none select-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {variant === 'gateway-clock' ? (
        <div
          className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 text-center"
          style={{ transform: `translate3d(${drift.x}px, ${drift.y}px, 0)` }}
        >
          <img
            src={SL8_LOGO_SRC}
            alt="SL8 OS"
            draggable={false}
            className="w-20 h-20 object-contain mix-blend-screen opacity-85 mb-4 select-none pointer-events-none"
          />
          <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#8E9AA9] mb-4">
            SL8 DSK Experimental Build
          </p>
          <div className="inline-block">
            <p className="font-display text-7xl sm:text-8xl font-semibold tracking-tight text-white tabular-nums leading-none">
              {formattedTime}
            </p>
            {/* Synchronized seconds sweep line directly below hour & minute */}
            <div className="mt-4 h-[3px] w-full bg-white/10 relative overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${secondsFraction * 100}%`,
                  backgroundColor: 'var(--sl8-accent)',
                  boxShadow: '0 0 14px var(--sl8-accent)',
                }}
              />
            </div>
          </div>
          <p className="text-sm text-[#A5B1C2] mt-4">{formattedDate}</p>
          <p
            className="font-display text-xs tracking-[0.24em] uppercase mt-8 opacity-85"
            style={{ color: 'var(--sl8-accent)' }}
          >
            Your Personal Gateway Experience
          </p>
        </div>
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col justify-end p-8 sm:p-12 pointer-events-none">
          <div className="max-w-xs">
            <p className="font-display text-4xl font-semibold text-white tabular-nums leading-none">
              {formattedTime}
            </p>
            <div className="mt-2.5 h-[2px] w-44 bg-white/10 overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${secondsFraction * 100}%`,
                  backgroundColor: 'var(--sl8-accent)',
                  boxShadow: '0 0 10px var(--sl8-accent)',
                }}
              />
            </div>
            <p className="text-xs text-[#94A0B2] mt-2">{formattedDate}</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-6 z-20 text-[10px] font-mono tracking-wider uppercase text-white/35 pointer-events-none">
        Move mouse or press any key to wake
      </div>
    </div>
  );
};
