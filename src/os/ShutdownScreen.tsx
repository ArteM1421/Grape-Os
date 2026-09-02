import { useState, useEffect } from 'react';
import { Power, RotateCcw, HardDrive, Wrench } from 'lucide-react';

interface ShutdownScreenProps {
  onReboot: () => void;
  onBios: () => void;
  onRecovery: () => void;
}

export default function ShutdownScreen({ onReboot, onBios, onRecovery }: ShutdownScreenProps) {
  const [phase, setPhase] = useState<'shutdown' | 'off'>('shutdown');
  const [brandIcon, setBrandIcon] = useState(() => localStorage.getItem('vingrape-icon-url') ?? '');
  const [osName, setOsName] = useState(() => localStorage.getItem('vingrape-os-name') ?? 'VinGrape');
  const [creatorName, setCreatorName] = useState(() => localStorage.getItem('vingrape-creator-name') ?? 'ArtGroup (Artem Malmygin)');

  useEffect(() => {
    const t = setTimeout(() => setPhase('off'), 1800);
    return () => clearTimeout(t);
  }, []);

  if (phase === 'off') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: '#0a0a0c' }}
      >
        <div className="text-center mb-8">
          <img src={brandIcon || "https://cdn-icons-png.flaticon.com/128/8832/8832714.png"} alt="VinGrape" className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm text-[var(--pyos-text-dim)] mb-6">{osName} has been shut down.</p>
        </div>

        <div className="flex flex-col gap-2 w-64">
          <button
            onClick={onReboot}
            className="flex items-center gap-3 px-4 py-3 rounded-xl accent-gradient text-black/80 font-medium text-sm hover:scale-105 transition-transform"
          >
            <Power size={16} />
            Power On
          </button>
          <button
            onClick={onBios}
            className="flex items-center gap-3 px-4 py-3 rounded-xl glass-panel text-sm hover:bg-white/8 transition-colors"
            style={{ color: 'var(--pyos-text)' }}
          >
            <HardDrive size={16} style={{ color: 'var(--pyos-text-dim)' }} />
            Enter BIOS
          </button>
          <button
            onClick={onRecovery}
            className="flex items-center gap-3 px-4 py-3 rounded-xl glass-panel text-sm hover:bg-white/8 transition-colors"
            style={{ color: 'var(--pyos-text)' }}
          >
            <Wrench size={16} style={{ color: 'var(--pyos-text-dim)' }} />
            Recovery Mode
          </button>
        </div>

        <p className="text-[10px] text-[var(--pyos-text-dim)] mt-8 font-mono">made by {creatorName}</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-1000"
      style={{ background: '#0a0a0c' }}
    >
      <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin-slow" style={{ borderColor: 'var(--pyos-accent)', borderTopColor: 'transparent' }} />
      <p className="mt-6 text-sm text-[var(--pyos-text-dim)] font-mono">Shutting down...</p>
    </div>
  );
}
