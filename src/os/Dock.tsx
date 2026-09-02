import { useState, useRef, useEffect } from 'react';
import { Search, Power, Settings as SettingsIcon, ChevronRight, Lock, RotateCcw, HardDrive } from 'lucide-react';
import type { AppManifest } from './types';
import type { WindowManager } from './useWindowManager';

interface DockProps {
  apps: AppManifest[];
  wm: WindowManager;
  onOpenStart: () => void;
  onPower: () => void;
  onLock: () => void;
  openAppId: string | null;
  clock: Date;
  onOpenApp?: (appId: string) => void;
}

export default function Dock({ apps, wm, onPower, onLock, openAppId, clock, onOpenApp }: DockProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const startRef = useRef<HTMLDivElement>(null);
  const [brandIcon, setBrandIcon] = useState(() => localStorage.getItem('vingrape-icon-url') ?? '');

  useEffect(() => {
    const handler = () => setBrandIcon(localStorage.getItem('vingrape-icon-url') ?? '');
    window.addEventListener('vingrape-settings-change', handler);
    return () => window.removeEventListener('vingrape-settings-change', handler);
  }, []);

  const pinnedIds = ['ai', 'browser', 'vinmarket', 'codestudio', 'terminal', 'files', 'editor', 'monitor', 'settings'];
  const pinned = pinnedIds
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is AppManifest => Boolean(a));

  const handleAppClick = (appId: string) => {
    const existing = wm.windows.find((w) => w.appId === appId);
    if (existing && existing.minimized) {
      wm.restoreWindow(existing.id);
    } else if (existing) {
      wm.focusWindow(existing.id);
    } else {
      if (onOpenApp) onOpenApp(appId);
      else wm.openApp(appId);
    }
    setStartOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const fmtTime = clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDate = clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <>
      {/* Start Menu */}
      {startOpen && (
        <div
          ref={startRef}
          className="fixed left-4 bottom-20 w-80 glass-panel p-4 z-[9000] animate-scale-in"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        >
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center overflow-hidden">
              <img src={brandIcon || "https://cdn-icons-png.flaticon.com/128/8832/8832714.png"} alt="VinGrape" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold">VinGrape</p>
              <p className="text-[10px] text-[var(--pyos-text-dim)] font-mono">made by ArtGroup</p>
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-wider text-[var(--pyos-text-dim)] mb-2 px-1">
            All Applications
          </p>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleAppClick(app.id)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/8 transition-colors text-left group"
              >
                <app.icon size={18} style={{ color: 'var(--pyos-accent)' }} />
                <span className="text-xs flex-1">{app.name}</span>
                <ChevronRight
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--pyos-text-dim)' }}
                />
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => handleAppClick('settings')}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/8 transition-colors"
            >
              <SettingsIcon size={14} style={{ color: 'var(--pyos-text-dim)' }} />
              <span className="text-xs">Settings</span>
            </button>
            <button
              onClick={() => { setStartOpen(false); onPower(); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <Power size={14} style={{ color: '#ff5577' }} />
              <span className="text-xs">Shut Down</span>
            </button>
          </div>
        </div>
      )}

      {/* Dock / Taskbar */}
      <div
        className="fixed bottom-0 left-0 right-0 h-16 z-[8000] flex items-center justify-between px-4"
        style={{
          background: 'var(--pyos-dock-bg)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop: '1px solid var(--pyos-glass-border)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStartOpen((v) => !v)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
              startOpen ? 'accent-gradient' : 'glass-panel hover:scale-105'
            }`}
            title="Start"
          >
            <img src={brandIcon || "https://cdn-icons-png.flaticon.com/128/8832/8832714.png"} alt="VinGrape" className="w-7 h-7 object-contain" />
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {pinned.map((app) => {
            const isOpen = wm.windows.some((w) => w.appId === app.id && !w.minimized);
            const isActive = openAppId === app.id && isOpen;
            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app.id)}
                onMouseEnter={() => setHovered(app.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:bg-white/8"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid var(--pyos-glass-border)' : '1px solid transparent',
                }}
                title={app.name}
              >
                <app.icon
                  size={20}
                  style={{ color: hovered === app.id ? 'var(--pyos-accent)' : 'var(--pyos-text)' }}
                />
                {isOpen && (
                  <div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'var(--pyos-accent)' }}
                  />
                )}
                {hovered === app.id && (
                  <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/80 text-[10px] whitespace-nowrap pointer-events-none animate-fade-in">
                    {app.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-mono font-medium" style={{ color: 'var(--pyos-text)' }}>
              {fmtTime}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>
              {fmtDate}
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <button
            onClick={onLock}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors"
            title="Lock"
          >
            <Lock size={16} style={{ color: 'var(--pyos-text-dim)' }} />
          </button>
        </div>
      </div>
    </>
  );
}
