import React, { useEffect, useRef } from 'react';
import { AnimatedWallpaperId } from '../types/os';

interface LiveWallpaperProps {
  variant: AnimatedWallpaperId;
  accentHex: string;
  compact?: boolean;
  isDesktopCanvas?: boolean;
  className?: string;
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

export const LiveWallpaper: React.FC<LiveWallpaperProps> = ({
  variant,
  accentHex,
  compact = false,
  isDesktopCanvas = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [ar, ag, ab] = hexToRgb(accentHex);
    const rgba = (a: number) => `rgba(${ar}, ${ag}, ${ab}, ${a})`;

    let width = Math.max(1, container.clientWidth);
    let height = Math.max(1, container.clientHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 2);

    const resize = () => {
      if (!container || !canvas) return;
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Deterministic seeds for architectural shards & signal traces
    const shards = Array.from({ length: compact ? 6 : 12 }, (_, i) => ({
      x: ((i * 0.271) % 1),
      y: ((i * 0.193 + 0.08) % 0.62),
      w: 0.09 + ((i * 0.043) % 0.14),
      h: 0.08 + ((i * 0.037) % 0.16),
      vx: (i % 2 === 0 ? 1 : -1) * (0.004 + (i % 4) * 0.002),
      phase: i * 1.15,
      accentEdge: i % 3 === 0,
    }));

    const panes = Array.from({ length: compact ? 5 : 9 }, (_, i) => ({
      cx: 0.12 + ((i * 0.19) % 0.78),
      cy: 0.15 + ((i * 0.23) % 0.7),
      w: 0.18 + ((i * 0.06) % 0.24),
      h: 0.22 + ((i * 0.07) % 0.28),
      speed: 0.18 + (i % 4) * 0.07,
      phase: i * 0.9,
      accent: i % 2 === 0,
    }));

    const traces = Array.from({ length: compact ? 10 : 24 }, (_, i) => ({
      horizontal: i % 2 === 0,
      lane: (i * 0.137) % 1,
      speed: 0.055 + (i % 5) * 0.022,
      offset: (i * 0.31) % 1,
      length: 0.1 + (i % 4) * 0.05,
      bright: i % 3 === 0,
    }));

    let rafId = 0;
    const startTime = performance.now();

    const drawHorizon = (t: number) => {
      // Deep obsidian sky gradient
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#04060A');
      bg.addColorStop(0.5, '#080D15');
      bg.addColorStop(0.58, '#09131C');
      bg.addColorStop(1, '#030508');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const horizonY = height * 0.56;
      const centerX = width * 0.5;

      // Ambient horizon glow in user accent color
      const glow = ctx.createRadialGradient(
        centerX,
        horizonY,
        4,
        centerX,
        horizonY,
        Math.max(width, height) * 0.6
      );
      glow.addColorStop(0, rgba(0.24));
      glow.addColorStop(0.32, rgba(0.08));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Floating smoked rectangular architectural glass panels above horizon
      shards.forEach((s) => {
        const px = (((s.x + t * s.vx) % 1.24) + 1.24) % 1.24 - 0.12;
        const py = s.y + Math.sin(t * 0.55 + s.phase) * 0.018;
        const rx = px * width;
        const ry = py * height;
        const rw = s.w * width;
        const rh = s.h * height;

        ctx.fillStyle = 'rgba(13, 18, 26, 0.42)';
        ctx.fillRect(rx, ry, rw, rh);

        ctx.strokeStyle = s.accentEdge ? rgba(0.35) : 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);

        // Specular top bevel
        ctx.beginPath();
        ctx.moveTo(rx, ry + 0.5);
        ctx.lineTo(rx + rw, ry + 0.5);
        ctx.strokeStyle = s.accentEdge ? rgba(0.6) : 'rgba(255, 255, 255, 0.22)';
        ctx.stroke();
      });

      // Perspective floor grid scrolling smoothly in a seamless loop
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizonY, width, height - horizonY);
      ctx.clip();

      const verticalCount = compact ? 12 : 22;
      for (let i = -verticalCount; i <= verticalCount; i++) {
        const norm = i / verticalCount;
        const topX = centerX + norm * width * 0.24;
        const botX = centerX + norm * width * 1.45;
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(botX, height);
        ctx.strokeStyle =
          Math.abs(i) % 4 === 0 ? rgba(0.22) : 'rgba(255, 255, 255, 0.055)';
        ctx.lineWidth = Math.abs(i) % 4 === 0 ? 1.1 : 0.8;
        ctx.stroke();
      }

      const horizLines = compact ? 10 : 18;
      const speed = (t * 0.26) % 1;
      for (let i = 0; i < horizLines; i++) {
        const raw = (i + speed) / horizLines;
        const eased = Math.pow(raw, 2.25);
        const y = horizonY + eased * (height - horizonY);
        const alpha = 0.04 + eased * 0.26;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = i % 3 === 0 ? rgba(alpha) : `rgba(210, 224, 240, ${alpha * 0.45})`;
        ctx.lineWidth = 0.8 + eased * 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // Crisp horizon light line with traveling highlight
      ctx.fillStyle = rgba(0.55);
      ctx.fillRect(0, horizonY, width, 1.2);
      const sweepX = ((t * 0.14) % 1.4 - 0.2) * width;
      const sweepGrad = ctx.createLinearGradient(sweepX - 180, 0, sweepX + 180, 0);
      sweepGrad.addColorStop(0, 'rgba(255,255,255,0)');
      sweepGrad.addColorStop(0.5, rgba(0.95));
      sweepGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sweepX - 180, horizonY - 0.8, 360, 2.4);
    };

    const drawPrism = (t: number) => {
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#070A10');
      bg.addColorStop(0.55, '#05070B');
      bg.addColorStop(1, '#020305');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle architectural background diagonal shaft
      const shaftX = width * (0.5 + Math.sin(t * 0.22) * 0.18);
      const shaft = ctx.createRadialGradient(
        shaftX,
        height * 0.42,
        10,
        shaftX,
        height * 0.42,
        Math.max(width, height) * 0.55
      );
      shaft.addColorStop(0, rgba(0.22));
      shaft.addColorStop(0.5, rgba(0.05));
      shaft.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shaft;
      ctx.fillRect(0, 0, width, height);

      // Overlapping smoked 90-degree architectural glass sheets
      panes.forEach((p, idx) => {
        const dx = Math.sin(t * p.speed + p.phase) * width * 0.045;
        const dy = Math.cos(t * p.speed * 0.8 + p.phase) * height * 0.035;
        const rw = p.w * width;
        const rh = p.h * height;
        const rx = p.cx * width - rw / 2 + dx;
        const ry = p.cy * height - rh / 2 + dy;

        const paneGrad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
        paneGrad.addColorStop(0, 'rgba(24, 31, 43, 0.46)');
        paneGrad.addColorStop(0.55, 'rgba(9, 12, 18, 0.62)');
        paneGrad.addColorStop(1, p.accent ? rgba(0.12) : 'rgba(255,255,255,0.03)');

        ctx.fillStyle = paneGrad;
        ctx.fillRect(rx, ry, rw, rh);

        ctx.strokeStyle = p.accent ? rgba(0.42) : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);

        // Moving glint along top or left bevel
        const glintPos = ((t * (0.16 + idx * 0.02) + p.phase) % 1) * rw;
        const glint = ctx.createLinearGradient(rx + glintPos - 60, ry, rx + glintPos + 60, ry);
        glint.addColorStop(0, 'rgba(255,255,255,0)');
        glint.addColorStop(0.5, p.accent ? rgba(0.85) : 'rgba(255,255,255,0.55)');
        glint.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glint;
        ctx.fillRect(rx, ry, rw, 1.5);
      });
    };

    const drawMatrix = (t: number) => {
      ctx.fillStyle = '#04060A';
      ctx.fillRect(0, 0, width, height);

      const cell = compact ? 22 : 44;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }

      // Soft center radial illumination
      const centerGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        10,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.55
      );
      centerGlow.addColorStop(0, rgba(0.14));
      centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // Right-angle signal pulses riding grid channels
      traces.forEach((tr) => {
        const progress = (t * tr.speed + tr.offset) % 1.3 - 0.15;
        if (tr.horizontal) {
          const y = Math.round((tr.lane * height) / cell) * cell + 0.5;
          const xHead = progress * width;
          const segLen = tr.length * width;
          const grad = ctx.createLinearGradient(xHead - segLen, y, xHead, y);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.7, tr.bright ? rgba(0.65) : 'rgba(220,232,245,0.28)');
          grad.addColorStop(1, tr.bright ? '#FFFFFF' : rgba(0.9));
          ctx.strokeStyle = grad;
          ctx.lineWidth = tr.bright ? 1.8 : 1.1;
          ctx.beginPath();
          ctx.moveTo(xHead - segLen, y);
          ctx.lineTo(xHead, y);
          ctx.stroke();

          ctx.fillStyle = tr.bright ? '#FFFFFF' : rgba(0.95);
          ctx.fillRect(xHead - 1.5, y - 1.5, 3, 3);
        } else {
          const x = Math.round((tr.lane * width) / cell) * cell + 0.5;
          const yHead = progress * height;
          const segLen = tr.length * height;
          const grad = ctx.createLinearGradient(x, yHead - segLen, x, yHead);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.7, tr.bright ? rgba(0.55) : 'rgba(200,215,232,0.24)');
          grad.addColorStop(1, tr.bright ? '#FFFFFF' : rgba(0.85));
          ctx.strokeStyle = grad;
          ctx.lineWidth = tr.bright ? 1.8 : 1.1;
          ctx.beginPath();
          ctx.moveTo(x, yHead - segLen);
          ctx.lineTo(x, yHead);
          ctx.stroke();

          ctx.fillStyle = tr.bright ? '#FFFFFF' : rgba(0.9);
          ctx.fillRect(x - 1.5, yHead - 1.5, 3, 3);
        }
      });
    };

    const drawAurora = (t: number) => {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#05070B');
      bg.addColorStop(0.5, '#090E16');
      bg.addColorStop(1, '#030407');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const waveCount = compact ? 4 : 7;
      const stepX = compact ? 14 : 18;

      for (let w = 0; w < waveCount; w++) {
        const baseY = height * (0.28 + w * 0.085);
        const amp = height * (0.045 + (w % 3) * 0.02);
        const freq = 0.0024 + w * 0.00055;
        const speed = (0.35 + w * 0.08) * (w % 2 === 0 ? 1 : -1);

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width + stepX; x += stepX) {
          const y =
            baseY +
            Math.sin(x * freq + t * speed) * amp +
            Math.cos(x * freq * 0.5 - t * speed * 0.6) * (amp * 0.45);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(0, baseY - amp, 0, baseY + height * 0.25);
        fillGrad.addColorStop(0, w % 2 === 0 ? rgba(0.16) : 'rgba(220, 232, 246, 0.07)');
        fillGrad.addColorStop(1, 'rgba(4, 6, 10, 0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Crisp harmonic ridge line
        ctx.beginPath();
        for (let x = 0; x <= width + stepX; x += stepX) {
          const y =
            baseY +
            Math.sin(x * freq + t * speed) * amp +
            Math.cos(x * freq * 0.5 - t * speed * 0.6) * (amp * 0.45);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = w % 2 === 0 ? rgba(0.45 - w * 0.03) : 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = w === 0 ? 1.5 : 1;
        ctx.stroke();
      }

      // Subtle vertical architectural monolith lines
      const cols = compact ? 5 : 9;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.lineWidth = 1;
      for (let c = 1; c < cols; c++) {
        const x = Math.round((width / cols) * c) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    };

    const renderFrame = (nowMs: number) => {
      const t = reducedMotion ? 1.2 : (nowMs - startTime) / 1000;
      if (variant === 'anim-horizon') drawHorizon(t);
      else if (variant === 'anim-prism') drawPrism(t);
      else if (variant === 'anim-matrix') drawMatrix(t);
      else drawAurora(t);

      if (!reducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [variant, accentHex, compact]);

  return (
    <div
      ref={containerRef}
      data-desktop-canvas={isDesktopCanvas ? 'true' : undefined}
      className={`w-full h-full overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        data-desktop-canvas={isDesktopCanvas ? 'true' : undefined}
        className="block w-full h-full pointer-events-none select-none"
      />
    </div>
  );
};
