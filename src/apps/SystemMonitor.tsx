import { useState, useEffect, useRef } from 'react';
import { Cpu, MemoryStick, HardDrive, Activity, Thermometer, Zap } from 'lucide-react';
import type { AppProps } from '../os/types';

interface Metrics {
  cpu: number;
  mem: number;
  disk: number;
  gpu: number;
  temp: number;
  net: number;
  cpuHistory: number[];
  memHistory: number[];
  netHistory: number[];
}

const MAX_HIST = 60;

function generateHistory(base: number, variance: number): number[] {
  return Array.from({ length: MAX_HIST }, () =>
    Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance))
  );
}

export default function SystemMonitor({ windowId: _windowId }: AppProps) {
  void _windowId;
  const [metrics, setMetrics] = useState<Metrics>({
    cpu: 24,
    mem: 48,
    disk: 62,
    gpu: 18,
    temp: 45,
    net: 12,
    cpuHistory: generateHistory(24, 30),
    memHistory: generateHistory(48, 10),
    netHistory: generateHistory(12, 40),
  });
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;
      setMetrics((prev) => {
        const cpuTarget = 20 + Math.sin(tickRef.current * 0.05) * 15 + Math.random() * 10;
        const memTarget = 45 + Math.sin(tickRef.current * 0.02) * 8 + Math.random() * 5;
        const netTarget = 10 + Math.random() * 40;
        const gpuTarget = 15 + Math.random() * 20;
        const tempTarget = 40 + (cpuTarget / 100) * 20;

        const lerp = (a: number, b: number) => a + (b - a) * 0.15;

        return {
          cpu: lerp(prev.cpu, cpuTarget),
          mem: lerp(prev.mem, memTarget),
          disk: 62 + Math.random() * 0.5,
          gpu: lerp(prev.gpu, gpuTarget),
          temp: lerp(prev.temp, tempTarget),
          net: lerp(prev.net, netTarget),
          cpuHistory: [...prev.cpuHistory.slice(1), lerp(prev.cpu, cpuTarget)],
          memHistory: [...prev.memHistory.slice(1), lerp(prev.mem, memTarget)],
          netHistory: [...prev.netHistory.slice(1), lerp(prev.net, netTarget)],
        };
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const Gauge = ({
    label,
    value,
    icon: Icon,
    unit = '%',
    color,
  }: {
    label: string;
    value: number;
    icon: typeof Cpu;
    unit?: string;
    color: string;
  }) => (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color }} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-lg font-mono font-bold" style={{ color }}>
          {Math.round(value)}
          <span className="text-xs text-[var(--pyos-text-dim)]">{unit}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
    </div>
  );

  const Sparkline = ({ data, color, label }: { data: number[]; color: string; label: string }) => {
    const w = 100;
    const h = 30;
    const max = 100;
    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * h;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">{label}</span>
          <span className="text-xs font-mono text-[var(--pyos-text-dim)]">
            {Math.round(data[data.length - 1])}%
          </span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${h} ${points} ${w},${h}`}
            fill={`url(#grad-${label})`}
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  const accent = 'var(--pyos-accent)';
  const accent2 = 'var(--pyos-accent-2)';

  return (
    <div className="w-full h-full overflow-y-auto p-4" style={{ background: 'rgba(7,6,26,0.4)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} style={{ color: accent }} />
        <h2 className="text-sm font-semibold">System Monitor</h2>
        <span className="text-[10px] font-mono text-[var(--pyos-text-dim)] ml-auto">
          Aether-core 1.0
        </span>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Gauge label="CPU" value={metrics.cpu} icon={Cpu} color={accent} />
        <Gauge label="Memory" value={metrics.mem} icon={MemoryStick} color={accent2} />
        <Gauge label="GPU" value={metrics.gpu} icon={Zap} color="#ff7a59" />
        <Gauge label="Disk" value={metrics.disk} icon={HardDrive} color="#ffd166" />
      </div>

      {/* Sparklines */}
      <div className="grid grid-cols-1 gap-3 mb-3">
        <Sparkline data={metrics.cpuHistory} color={accent} label="CPU Usage" />
        <Sparkline data={metrics.memHistory} color={accent2} label="Memory Usage" />
        <Sparkline data={metrics.netHistory} color="#ff7a59" label="Network I/O" />
      </div>

      {/* Extra info */}
      <div className="glass-panel p-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Thermometer size={14} style={{ color: '#ff5577' }} />
          <span className="text-xs text-[var(--pyos-text-dim)]">Temperature</span>
          <span className="text-xs font-mono ml-auto">{Math.round(metrics.temp)}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: accent }} />
          <span className="text-xs text-[var(--pyos-text-dim)]">Uptime</span>
          <span className="text-xs font-mono ml-auto">
            {Math.floor(tickRef.current * 0.8)}s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={14} style={{ color: accent2 }} />
          <span className="text-xs text-[var(--pyos-text-dim)]">Cores</span>
          <span className="text-xs font-mono ml-auto">8 vCPU</span>
        </div>
        <div className="flex items-center gap-2">
          <MemoryStick size={14} style={{ color: '#ffd166' }} />
          <span className="text-xs text-[var(--pyos-text-dim)]">Total RAM</span>
          <span className="text-xs font-mono ml-auto">16 GB</span>
        </div>
      </div>
    </div>
  );
}
