import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Activity, Zap } from 'lucide-react';
import type { AppProps } from '../os/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

interface Attractor {
  x: number;
  y: number;
  mass: number;
}

export default function MarketEntropy({ windowId: _windowId }: AppProps) {
  void _windowId;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);
  const [mode, setMode] = useState<'chaos' | 'flow' | 'gravity'>('chaos');
  const [particleCount, setParticleCount] = useState(300);
  const runningRef = useRef(running);
  const modeRef = useRef(mode);
  const countRef = useRef(particleCount);
  runningRef.current = running;
  modeRef.current = mode;
  countRef.current = particleCount;

  const particlesRef = useRef<Particle[]>([]);
  const attractorsRef = useRef<Attractor[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const initParticles = useCallback((w: number, h: number) => {
    const count = countRef.current;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 120,
        hue: Math.random() * 60 + 140,
        size: Math.random() * 2 + 0.5,
      });
    }
    particlesRef.current = particles;

    attractorsRef.current = [
      { x: w * 0.3, y: h * 0.4, mass: 800 },
      { x: w * 0.7, y: h * 0.6, mass: -600 },
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initParticles(rect.width, rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (!runningRef.current) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      timeRef.current += 0.008;
      const t = timeRef.current;

      // Fade trail
      ctx.fillStyle = 'rgba(7, 6, 26, 0.08)';
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;
      const attractors = attractorsRef.current;
      const m = modeRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (m === 'chaos') {
          // Lorenz-like chaotic flow
          const dx = Math.sin(p.y * 0.01 + t) * 1.5;
          const dy = Math.cos(p.x * 0.01 + t * 1.3) * 1.5;
          p.vx += dx * 0.15;
          p.vy += dy * 0.15;
        } else if (m === 'flow') {
          // Perlin-ish flow field
          const angle = Math.sin(p.x * 0.005 + t) * Math.cos(p.y * 0.005 + t * 0.7) * Math.PI * 2;
          p.vx += Math.cos(angle) * 0.3;
          p.vy += Math.sin(angle) * 0.3;
        } else if (m === 'gravity') {
          // Gravity wells
          for (const a of attractors) {
            const ddx = a.x - p.x;
            const ddy = a.y - p.y;
            const dist = Math.max(15, Math.sqrt(ddx * ddx + ddy * ddy));
            const force = a.mass / (dist * dist);
            p.vx += (ddx / dist) * force;
            p.vy += (ddy / dist) * force;
          }
        }

        // Damping
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Respawn
        if (p.life > p.maxLife || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.vx = (Math.random() - 0.5) * 2;
          p.vy = (Math.random() - 0.5) * 2;
          p.life = 0;
        }

        // Draw
        const alpha = 1 - p.life / p.maxLife;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--pyos-accent').trim() || '#00ff9d';
        const accent2 = getComputedStyle(document.documentElement).getPropertyValue('--pyos-accent-2').trim() || '#00d4ff';

        // Color based on speed
        const lerp = Math.min(1, speed / 4);
        const r1 = parseInt(accent.slice(1, 3), 16);
        const g1 = parseInt(accent.slice(3, 5), 16);
        const b1 = parseInt(accent.slice(5, 7), 16);
        const r2 = parseInt(accent2.slice(1, 3), 16);
        const g2 = parseInt(accent2.slice(3, 5), 16);
        const b2 = parseInt(accent2.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * lerp);
        const g = Math.round(g1 + (g2 - g1) * lerp);
        const b = Math.round(b1 + (b2 - b1) * lerp);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + lerp * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Trail line
        if (speed > 1.5) {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          ctx.stroke();
        }
      }

      // Draw attractors in gravity mode
      if (m === 'gravity') {
        for (const a of attractors) {
          const isPositive = a.mass > 0;
          ctx.strokeStyle = isPositive ? 'rgba(0,255,157,0.15)' : 'rgba(255,85,119,0.15)';
          ctx.lineWidth = 1;
          for (let r = 20; r < 120; r += 20) {
            ctx.beginPath();
            ctx.arc(a.x, a.y, r + Math.sin(t * 2) * 5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [initParticles]);

  const reset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initParticles(canvas.width, canvas.height);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Control overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="glass-panel px-3 py-1.5 flex items-center gap-2">
            <Activity size={13} style={{ color: 'var(--pyos-accent)' }} />
            <span className="text-xs font-mono">Market Entropy</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setRunning((r) => !r)}
            className="glass-panel w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
          >
            {running ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            onClick={reset}
            className="glass-panel w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="glass-panel p-1 flex gap-1">
          {(['chaos', 'flow', 'gravity'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                mode === m ? 'accent-gradient text-black/80 font-medium' : 'hover:bg-white/8'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="glass-panel px-3 py-1.5 flex items-center gap-2">
          <Zap size={12} style={{ color: 'var(--pyos-accent)' }} />
          <span className="text-[10px] font-mono text-[var(--pyos-text-dim)]">PARTICLES</span>
          <input
            type="range"
            min="50"
            max="800"
            value={particleCount}
            onChange={(e) => setParticleCount(Number(e.target.value))}
            className="w-20 accent-[var(--pyos-accent)]"
          />
          <span className="text-xs font-mono w-8 text-right">{particleCount}</span>
        </div>
      </div>
    </div>
  );
}
