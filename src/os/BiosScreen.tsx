import { useState, useEffect, useRef } from 'react';
import { Cpu, MemoryStick, HardDrive, Clock, Monitor, ChevronRight, ChevronLeft, Save, RotateCcw } from 'lucide-react';

interface BiosScreenProps {
  onExit: () => void;
}

type BiosTab = 'main' | 'boot' | 'display' | 'security' | 'about';

const BIOS_SETTINGS_KEY = 'vingrape-bios-settings';

interface BiosSettings {
  bootDelay: number;
  fastBoot: boolean;
  bootDevice: string;
  resolution: string;
  vSync: boolean;
  secureBoot: boolean;
  virtualization: boolean;
  cpuCores: number;
  memoryMB: number;
}

const DEFAULT_SETTINGS: BiosSettings = {
  bootDelay: 3,
  fastBoot: false,
  bootDevice: 'VinGrape-SSD',
  resolution: '1920x1080',
  vSync: true,
  secureBoot: true,
  virtualization: true,
  cpuCores: 8,
  memoryMB: 16384,
};

function loadSettings(): BiosSettings {
  try {
    const s = JSON.parse(localStorage.getItem(BIOS_SETTINGS_KEY) ?? '{}');
    return { ...DEFAULT_SETTINGS, ...s };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: BiosSettings) {
  localStorage.setItem(BIOS_SETTINGS_KEY, JSON.stringify(s));
}

export default function BiosScreen({ onExit }: BiosScreenProps) {
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState<BiosTab>('main');
  const [settings, setSettings] = useState<BiosSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const lines = [
      'VinGrape BIOS v2.0 (C) 2026 ArtGroup',
      `CPU: Virtual x86_64 @ 3.2 GHz (${settings.cpuCores} cores)`,
      `Memory Test: ${settings.memoryMB} MB ............ OK`,
      'Detecting storage devices ....... OK',
      `  Primary Master: ${settings.bootDevice}`,
      '  Secondary: None',
      'Detecting USB devices ............ None',
      'Initializing display adapter ..... OK',
      `  Resolution: ${settings.resolution} @ 60Hz`,
      'Initializing audio controller .... OK',
      'Initializing network controller . OK',
      '  MAC: 00:1A:2B:3C:4D:5E',
      `Secure Boot: ${settings.secureBoot ? 'Enabled' : 'Disabled'} ........ OK`,
      `Virtualization: ${settings.virtualization ? 'Enabled' : 'Disabled'} ... OK`,
      'Loading boot configuration ....... OK',
      'Checking system integrity ........ OK',
      'All systems nominal.',
    ];
    lines.forEach((line, i) => {
      const t = window.setTimeout(() => {
        setBootLines((prev) => [...prev, line]);
        if (i === lines.length - 1) {
          const t2 = window.setTimeout(() => setBooted(true), 500);
          timersRef.current.push(t2);
        }
      }, i * 120);
      timersRef.current.push(t);
    });
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  const updateSetting = <K extends keyof BiosSettings>(key: K, value: BiosSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs: { id: BiosTab; label: string; icon: typeof Cpu }[] = [
    { id: 'main', label: 'Main', icon: Cpu },
    { id: 'boot', label: 'Boot', icon: HardDrive },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'security', label: 'Security', icon: Save },
    { id: 'about', label: 'About', icon: Clock },
  ];

  if (!booted) {
    return (
      <div
        className="fixed inset-0 z-[9999] p-8 font-mono text-sm overflow-y-auto"
        style={{ background: '#000018', color: '#cccccc' }}
      >
        {bootLines.map((line, i) => (
          <div key={i} className="leading-relaxed">{line || '\u00A0'}</div>
        ))}
        {!booted && bootLines.length === 0 && (
          <div className="animate-blink" style={{ color: '#ffff66' }}>VinGrape BIOS v2.0</div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: '#000018', color: '#cccccc', fontFamily: 'monospace' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span style={{ color: '#ffff66' }}>VinGrape BIOS v2.0</span>
          <span style={{ color: '#666' }}>(C) 2026 ArtGroup</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span style={{ color: '#888' }}>{new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tab sidebar */}
        <div className="w-44 border-r border-white/10 p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                tab === t.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{ color: tab === t.id ? '#ffff66' : '#aaa' }}
            >
              <t.icon size={13} />
              {t.label}
              {tab === t.id && <ChevronRight size={11} className="ml-auto" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {tab === 'main' && (
            <div className="space-y-3 max-w-xl">
              <h2 className="text-sm mb-4" style={{ color: '#ffff66' }}>Main Configuration</h2>
              <BiosRow label="CPU Cores" value={settings.cpuCores}>
                <input type="range" min="1" max="16" value={settings.cpuCores} onChange={(e) => updateSetting('cpuCores', Number(e.target.value))} className="w-32 accent-yellow-400" />
                <span className="ml-2 font-mono">{settings.cpuCores}</span>
              </BiosRow>
              <BiosRow label="Memory (MB)" value={settings.memoryMB}>
                <input type="range" min="2048" max="32768" step="1024" value={settings.memoryMB} onChange={(e) => updateSetting('memoryMB', Number(e.target.value))} className="w-32 accent-yellow-400" />
                <span className="ml-2 font-mono">{settings.memoryMB}</span>
              </BiosRow>
              <BiosRow label="Virtualization">
                <Toggle value={settings.virtualization} onChange={(v) => updateSetting('virtualization', v)} />
              </BiosRow>
            </div>
          )}

          {tab === 'boot' && (
            <div className="space-y-3 max-w-xl">
              <h2 className="text-sm mb-4" style={{ color: '#ffff66' }}>Boot Configuration</h2>
              <BiosRow label="Boot Device">
                <select
                  value={settings.bootDevice}
                  onChange={(e) => updateSetting('bootDevice', e.target.value)}
                  className="bg-white/5 px-2 py-1 rounded text-xs outline-none"
                  style={{ color: '#ccc' }}
                >
                  <option>VinGrape-SSD</option>
                  <option>USB-Drive</option>
                  <option>Network-PXE</option>
                </select>
              </BiosRow>
              <BiosRow label="Boot Delay (sec)" value={settings.bootDelay}>
                <input type="range" min="0" max="10" value={settings.bootDelay} onChange={(e) => updateSetting('bootDelay', Number(e.target.value))} className="w-32 accent-yellow-400" />
                <span className="ml-2 font-mono">{settings.bootDelay}s</span>
              </BiosRow>
              <BiosRow label="Fast Boot">
                <Toggle value={settings.fastBoot} onChange={(v) => updateSetting('fastBoot', v)} />
              </BiosRow>
            </div>
          )}

          {tab === 'display' && (
            <div className="space-y-3 max-w-xl">
              <h2 className="text-sm mb-4" style={{ color: '#ffff66' }}>Display Settings</h2>
              <BiosRow label="Resolution">
                <select
                  value={settings.resolution}
                  onChange={(e) => updateSetting('resolution', e.target.value)}
                  className="bg-white/5 px-2 py-1 rounded text-xs outline-none"
                  style={{ color: '#ccc' }}
                >
                  <option>1280x720</option>
                  <option>1920x1080</option>
                  <option>2560x1440</option>
                  <option>3840x2160</option>
                </select>
              </BiosRow>
              <BiosRow label="V-Sync">
                <Toggle value={settings.vSync} onChange={(v) => updateSetting('vSync', v)} />
              </BiosRow>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-3 max-w-xl">
              <h2 className="text-sm mb-4" style={{ color: '#ffff66' }}>Security</h2>
              <BiosRow label="Secure Boot">
                <Toggle value={settings.secureBoot} onChange={(v) => updateSetting('secureBoot', v)} />
              </BiosRow>
              <div className="p-3 rounded-lg bg-white/5 text-[10px] leading-relaxed" style={{ color: '#888' }}>
                Secure Boot verifies the integrity of the boot loader before allowing the system to start.
                Disabling it is not recommended unless you are developing custom boot components.
              </div>
            </div>
          )}

          {tab === 'about' && (
            <div className="space-y-2 max-w-xl">
              <h2 className="text-sm mb-4" style={{ color: '#ffff66' }}>System Information</h2>
              {[
                ['BIOS Version', 'VinGrape BIOS v2.0'],
                ['BIOS Date', '2026.08.28'],
                ['Manufacturer', 'ArtGroup'],
                ['CPU', `Virtual x86_64 @ 3.2 GHz (${settings.cpuCores} cores)`],
                ['Memory', `${settings.memoryMB} MB`],
                ['Boot Device', settings.bootDevice],
                ['Resolution', settings.resolution],
                ['Secure Boot', settings.secureBoot ? 'Enabled' : 'Disabled'],
                ['Virtualization', settings.virtualization ? 'Enabled' : 'Disabled'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span style={{ color: '#888' }}>{k}</span>
                  <span className="font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
            style={{ color: saved ? '#00ff9d' : '#ccc' }}
          >
            {saved ? <span style={{ color: '#00ff9d' }}>Saved!</span> : <><Save size={12} /> Save Settings</>}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
            style={{ color: '#ccc' }}
          >
            <RotateCcw size={12} /> Reset to Defaults
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ color: '#666' }}><ChevronLeft size={11} className="inline" /> Esc: Exit BIOS</span>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded accent-gradient text-black/80 font-medium"
          >
            Exit & Reboot <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BiosRow({ label, value, children }: { label: string; value?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span style={{ color: '#aaa' }}>{label}</span>
      <div className="flex items-center gap-2">
        {children ?? <span className="font-mono">{value}</span>}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full flex items-center transition-colors ${value ? 'bg-yellow-400/80' : 'bg-white/10'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
