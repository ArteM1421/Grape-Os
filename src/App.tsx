import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { getAllApps, setAppContext } from './os/appRegistry';
import { useWindowManager } from './os/useWindowManager';
import WindowFrame from './os/WindowFrame';
import Dock from './os/Dock';
import BootScreen from './os/BootScreen';
import ShutdownScreen from './os/ShutdownScreen';
import LockScreen from './os/LockScreen';
import BiosScreen from './os/BiosScreen';
import RecoveryScreen from './os/RecoveryScreen';
import { applyTheme, type PyOSTheme } from './os/themes';
import {
  findTheme,
  loadCustomData,
  buildCustomAppManifests,
  addCustomTheme,
  addCustomApp,
  useRuntimeData,
  setOSApi,
  type CustomApp,
} from './os/runtimeRegistry';
import { createOSApi, PERMISSION_LABELS, type AppPermission } from './os/osApi';
import type { AppManifest } from './os/types';

type Phase = 'boot' | 'desktop' | 'shutdown' | 'lock' | 'bios' | 'recovery';

const TASKBAR_HEIGHT = 64;
const STORAGE_KEY = 'pyos-theme';

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [themeId, setThemeId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? 'macos-light'
  );
  const [clock, setClock] = useState(new Date());
  const [bootKey, setBootKey] = useState(0);

  const [settingsTick, setSettingsTick] = useState(0);
  const { customThemes, customApps } = useRuntimeData();

  useEffect(() => {
    loadCustomData();
  }, []);

  useEffect(() => {
    const handler = () => setSettingsTick((t) => t + 1);
    window.addEventListener('vingrape-settings-change', handler);
    return () => window.removeEventListener('vingrape-settings-change', handler);
  }, []);

  const allApps = useMemo<AppManifest[]>(() => {
    void settingsTick;
    const baseApps = getAllApps();
    const customManifests = buildCustomAppManifests();
    return [...baseApps, ...customManifests];
  }, [customApps, settingsTick]);

  useEffect(() => {
    const theme = findTheme(themeId);
    if (theme) {
      applyTheme(theme);
      localStorage.setItem(STORAGE_KEY, themeId);
    }
  }, [themeId, customThemes]);

  useEffect(() => {
    if (phase !== 'desktop') return;
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const wm = useWindowManager(allApps);

  const [pendingPermissions, setPendingPermissions] = useState<
    { appId: string; appName: string; permissions: AppPermission[] } | null
  >(null);

  useEffect(() => {
    const api = createOSApi(wm, themeId);
    setOSApi(api);
  }, [wm, themeId]);

  const openAppWithPermissionCheck = useCallback(
    (appId: string) => {
      const manifest = allApps.find((a) => a.id === appId);
      if (!manifest) return;
      if (manifest.permissions && manifest.permissions.length > 0) {
        setPendingPermissions({
          appId,
          appName: manifest.name,
          permissions: manifest.permissions,
        });
        return;
      }
      wm.openApp(appId);
    },
    [allApps, wm]
  );

  const confirmPermissions = useCallback(() => {
    if (pendingPermissions) {
      wm.openApp(pendingPermissions.appId);
      setPendingPermissions(null);
    }
  }, [pendingPermissions, wm]);

  useEffect(() => {
    setAppContext({
      currentThemeId: themeId,
      onThemeChange: (id: string) => setThemeId(id),
      onThemeCreated: (theme: Record<string, unknown>) => {
        const t = theme as unknown as PyOSTheme;
        addCustomTheme(t);
        setThemeId(t.id);
      },
      onAppCreated: (app: Record<string, unknown>) => {
        addCustomApp(app as unknown as CustomApp);
      },
    });
  }, [themeId]);

  const handleBootComplete = useCallback(() => setPhase('desktop'), []);
  const handlePower = useCallback(() => setPhase('shutdown'), []);
  const handleReboot = useCallback(() => {
    setBootKey((k) => k + 1);
    setPhase('boot');
  }, []);
  const handleLock = useCallback(() => setPhase('lock'), []);
  const handleUnlock = useCallback(() => setPhase('desktop'), []);
  const handleBios = useCallback(() => setPhase('bios'), []);
  const handleRecovery = useCallback(() => setPhase('recovery'), []);
  const handleExitBios = useCallback(() => {
    setBootKey((k) => k + 1);
    setPhase('boot');
  }, []);
  const handleExitRecovery = useCallback(() => setPhase('desktop'), []);

  const focusedWin = wm.windows.find((w) => w.focused && !w.minimized);
  const openAppId = focusedWin?.appId ?? null;

  if (phase === 'boot') {
    return <BootScreen key={bootKey} onComplete={handleBootComplete} />;
  }

  if (phase === 'shutdown') {
    return (
      <ShutdownScreen
        onReboot={handleReboot}
        onBios={handleBios}
        onRecovery={handleRecovery}
      />
    );
  }

  if (phase === 'lock') {
    return <LockScreen onUnlock={handleUnlock} clock={clock} />;
  }

  if (phase === 'bios') {
    return <BiosScreen onExit={handleExitBios} />;
  }

  if (phase === 'recovery') {
    return <RecoveryScreen onExit={handleExitRecovery} onReboot={handleReboot} />;
  }

  const currentTheme = findTheme(themeId);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: currentTheme?.wallpaper ?? '#000' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full opacity-10 animate-float"
          style={{
            top: '10%',
            left: '8%',
            background: `radial-gradient(circle, var(--pyos-accent), transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full opacity-8 animate-float"
          style={{
            top: '50%',
            right: '5%',
            background: `radial-gradient(circle, var(--pyos-accent-2), transparent 70%)`,
            filter: 'blur(50px)',
            animationDelay: '2s',
          }}
        />
      </div>

      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1]">
        {allApps.slice(0, 6).map((app) => (
          <DesktopIcon key={app.id} app={app} onOpen={() => openAppWithPermissionCheck(app.id)} />
        ))}
      </div>

      {wm.windows.map((win) => {
        const manifest = allApps.find((a) => a.id === win.appId);
        if (!manifest) return null;
        return (
          <WindowFrame
            key={win.id}
            win={win}
            manifest={manifest}
            wm={wm}
            taskbarHeight={TASKBAR_HEIGHT}
          />
        );
      })}

      <Dock
        apps={allApps}
        wm={wm}
        onOpenStart={() => {}}
        onPower={handlePower}
        onLock={handleLock}
        openAppId={openAppId}
        clock={clock}
        onOpenApp={openAppWithPermissionCheck}
      />

      {pendingPermissions && (
        <PermissionDialog
          appName={pendingPermissions.appName}
          permissions={pendingPermissions.permissions}
          onConfirm={confirmPermissions}
          onCancel={() => setPendingPermissions(null)}
        />
      )}
    </div>
  );
}

function DesktopIcon({ app, onOpen }: { app: AppManifest; onOpen: () => void }) {
  return (
    <button
      onDoubleClick={onOpen}
      onClick={onOpen}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/8 transition-colors w-20 group"
    >
      <div className="w-12 h-12 rounded-xl glass-panel flex items-center justify-center group-hover:scale-110 transition-transform">
        <app.icon size={24} style={{ color: 'var(--pyos-accent)' }} />
      </div>
      <span
        className="text-[10px] text-center truncate w-full"
        style={{ color: 'var(--pyos-text)' }}
      >
        {app.name}
      </span>
    </button>
  );
}

function PermissionDialog({
  appName,
  permissions,
  onConfirm,
  onCancel,
}: {
  appName: string;
  permissions: AppPermission[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md glass-panel p-6 animate-scale-in" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,85,119,0.15)' }}>
            <AlertTriangle size={24} style={{ color: '#ff5577' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--pyos-text)' }}>Security Warning</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--pyos-text-dim)' }}>
              <span style={{ color: '#ff5577' }}>{appName}</span> requests access to the following system features:
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {permissions.map((perm) => {
            const info = PERMISSION_LABELS[perm];
            return (
              <div key={perm} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,85,119,0.06)' }}>
                <Shield size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#ff5577' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--pyos-text)' }}>{info.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--pyos-text-dim)' }}>{info.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] mb-5 leading-relaxed" style={{ color: 'var(--pyos-text-dim)' }}>
          This app may be unsafe. Apps with system permissions can modify your OS settings, files, and configuration. Only continue if you trust the source of this app.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-xs font-medium transition-colors"
            style={{ color: 'var(--pyos-text)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium transition-transform hover:scale-[1.02]"
            style={{ background: 'rgba(255,85,119,0.2)', color: '#ff5577', border: '1px solid rgba(255,85,119,0.3)' }}
          >
            Allow & Launch
          </button>
        </div>
      </div>
    </div>
  );
}
