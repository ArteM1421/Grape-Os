import { useMemo, useState } from 'react';
import { Code2, Palette, Settings2, Save, RotateCcw, Search, Monitor, AppWindow, Image as ImageIcon, Pencil, Check, Type, User } from 'lucide-react';
import type { AppProps } from '../os/types';
import { THEMES, type PyOSTheme } from '../os/themes';
import { getCustomThemes, getCustomApps, addCustomTheme, useRuntimeData } from '../os/runtimeRegistry';
import { APPS } from '../os/appRegistry';

interface DevToolsProps extends AppProps {
  currentThemeId?: string;
  onThemeChange?: (id: string) => void;
}

type DevTab = 'quick' | 'theme' | 'apps' | 'code' | 'identity';

const editableKeys: (keyof PyOSTheme)[] = [
  'bg', 'bgDeep', 'accent', 'accent2', 'accent3', 'text', 'textDim', 'textBright',
  'glass', 'glassBorder', 'glassHover', 'wallpaper', 'titlebarBg', 'dockBg', 'font', 'monoFont',
];

export default function DevTools({ currentThemeId = 'windows-dark', onThemeChange }: DevToolsProps) {
  const [tab, setTab] = useState<DevTab>('quick');
  const [iconUrl, setIconUrl] = useState(() => localStorage.getItem('vingrape-icon-url') ?? '');
  const [osName, setOsName] = useState(() => localStorage.getItem('vingrape-os-name') ?? 'VinGrape OS');
  const [themeDraft, setThemeDraft] = useState<PyOSTheme>(() => ({ ...THEMES.find((t) => t.id === currentThemeId) ?? THEMES[0] }));
  const [codeTarget, setCodeTarget] = useState('App.tsx');
  const [codeValue, setCodeValue] = useState('');
  const [appRenames, setAppRenames] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('vingrape-app-renames') ?? '{}'); } catch { return {}; }
  });
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [creatorName, setCreatorName] = useState(() => localStorage.getItem('vingrape-creator-name') ?? 'ArtGroup (Artem Malmygin)');
  const [brandText, setBrandText] = useState(() => localStorage.getItem('vingrape-brand-text') ?? 'VinGrape');
  const { customApps } = useRuntimeData();
  const customThemes = getCustomThemes();

  const allThemes = useMemo(() => [...THEMES, ...customThemes], [customThemes]);

  const setQuickValue = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event('vingrape-settings-change'));
  };

  const saveCreatorName = (name: string) => {
    setCreatorName(name);
    setQuickValue('vingrape-creator-name', name);
  };

  const saveBrandText = (text: string) => {
    setBrandText(text);
    setQuickValue('vingrape-brand-text', text);
    // Also update OS name if it still contains the old brand
    const currentOsName = localStorage.getItem('vingrape-os-name') ?? 'VinGrape OS';
    if (currentOsName.includes('VinGrape')) {
      const newName = currentOsName.replace(/VinGrape/g, text);
      setQuickValue('vingrape-os-name', newName);
    }
  };

  const saveAppName = (appId: string, newName: string) => {
    const next = { ...appRenames, [appId]: newName };
    setAppRenames(next);
    localStorage.setItem('vingrape-app-renames', JSON.stringify(next));
    window.dispatchEvent(new Event('vingrape-settings-change'));
  };

  const resetAppNames = () => {
    setAppRenames({});
    localStorage.removeItem('vingrape-app-renames');
    window.dispatchEvent(new Event('vingrape-settings-change'));
  };

  const selectTheme = (id: string) => {
    const theme = allThemes.find((item) => item.id === id);
    if (!theme) return;
    setThemeDraft({ ...theme });
    onThemeChange?.(id);
  };

  const saveTheme = async () => {
    const id = themeDraft.id || `custom-${Date.now()}`;
    const next = { ...themeDraft, id, name: themeDraft.name || 'Custom theme' };
    await addCustomTheme(next);
    onThemeChange?.(next.id);
    setThemeDraft(next);
  };

  const loadCode = () => {
    const sourceMap: Record<string, string> = {
      'App.tsx': 'System entry point is protected in the browser build. Use the controls in Quick settings and Theme editor to change supported system behavior.',
      'themes.ts': JSON.stringify(themeDraft, null, 2),
      'appRegistry.tsx': JSON.stringify(customApps, null, 2),
    };
    setCodeValue(sourceMap[codeTarget] ?? 'No editable source selected.');
  };

  const tabs: { id: DevTab; label: string; icon: typeof Code2 }[] = [
    { id: 'quick', label: 'Quick settings', icon: Settings2 },
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'theme', label: 'Theme editor', icon: Palette },
    { id: 'apps', label: 'Applications', icon: AppWindow },
    { id: 'code', label: 'OS source', icon: Code2 },
  ];

  return (
    <div className="w-full h-full flex" style={{ background: 'var(--pyos-bg)' }}>
      <aside className="w-48 flex-shrink-0 border-r border-black/10 dark:border-white/10 p-3">
        <div className="flex items-center gap-2 px-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--pyos-accent)' }}>
            <Code2 size={17} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-semibold">Dev Tools</p>
            <p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>System editor</p>
          </div>
        </div>
        <div className="space-y-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-left transition-colors ${tab === item.id ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <item.icon size={15} style={{ color: tab === item.id ? 'var(--pyos-accent)' : 'var(--pyos-text-dim)' }} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6 p-3 rounded-lg text-[10px] leading-relaxed" style={{ background: 'var(--pyos-glass)', color: 'var(--pyos-text-dim)' }}>
          Changes are saved locally and apply without restarting the desktop.
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-5">
        {tab === 'quick' && (
          <section className="space-y-4">
            <Header title="Quick settings" subtitle="Change the identity and presentation of your OS." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="OS name" value={osName} onChange={(value) => { setOsName(value); setQuickValue('vingrape-os-name', value); }} />
              <Field label="Grape OS icon URL" value={iconUrl} onChange={(value) => { setIconUrl(value); setQuickValue('vingrape-icon-url', value); }} />
            </div>
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-sm font-medium">Desktop style</h3>
              <div className="grid grid-cols-2 gap-2">
                {allThemes.slice(0, 8).map((theme) => (
                  <button key={theme.id} onClick={() => selectTheme(theme.id)} className="p-3 rounded-lg text-left border transition-colors" style={{ background: theme.wallpaper, borderColor: theme.id === currentThemeId ? theme.accent : 'transparent', color: theme.text }}>
                    <span className="text-xs font-medium">{theme.name}</span>
                    <span className="block text-[10px] mt-1 opacity-70">{theme.font.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-3">
              <ImageIcon size={18} style={{ color: 'var(--pyos-accent)' }} />
              <div className="flex-1"><p className="text-xs font-medium">Brand icon</p><p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>The URL is used by the desktop shell wherever the OS icon is shown.</p></div>
              <button onClick={() => { localStorage.removeItem('vingrape-icon-url'); setIconUrl(''); }} className="px-3 py-1.5 rounded-lg text-[10px] bg-black/10 dark:bg-white/10">Reset</button>
            </div>
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><AppWindow size={16} style={{ color: 'var(--pyos-accent)' }} /><h3 className="text-sm font-medium">Rename applications</h3></div>
                <button onClick={resetAppNames} className="px-3 py-1.5 rounded-lg text-[10px] bg-black/10 dark:bg-white/10">Reset all</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {APPS.map((app) => (
                  <div key={app.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <app.icon size={15} style={{ color: 'var(--pyos-text-dim)' }} />
                    {editingApp === app.id ? (
                      <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { saveAppName(app.id, editValue); setEditingApp(null); } if (e.key === 'Escape') setEditingApp(null); }} className="flex-1 bg-transparent outline-none text-xs" style={{ color: 'var(--pyos-text)' }} autoFocus />
                    ) : (
                      <span className="flex-1 text-xs" style={{ color: 'var(--pyos-text)' }}>{appRenames[app.id] ?? app.name}</span>
                    )}
                    {editingApp === app.id ? (
                      <button onClick={() => { saveAppName(app.id, editValue); setEditingApp(null); }} className="opacity-60 hover:opacity-100"><Check size={13} style={{ color: 'var(--pyos-success)' }} /></button>
                    ) : (
                      <button onClick={() => { setEditingApp(app.id); setEditValue(appRenames[app.id] ?? app.name); }} className="opacity-40 hover:opacity-100"><Pencil size={13} style={{ color: 'var(--pyos-text-dim)' }} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'identity' && (
          <section className="space-y-4">
            <Header title="Identity" subtitle="Change the creator name and replace all VinGrape branding with your own text." />
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} style={{ color: 'var(--pyos-accent)' }} />
                <h3 className="text-sm font-medium">Creator Name</h3>
              </div>
              <Field label="Creator" value={creatorName} onChange={saveCreatorName} />
              <p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>This appears in the About section, shutdown screen, and BIOS.</p>
            </div>
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Type size={16} style={{ color: 'var(--pyos-accent)' }} />
                <h3 className="text-sm font-medium">Brand Text Replacement</h3>
              </div>
              <Field label={'Replace "VinGrape" with'} value={brandText} onChange={saveBrandText} />
              <p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>All occurrences of "VinGrape" in the UI will be replaced with this text. The OS name is also updated.</p>
            </div>
          </section>
        )}

        {tab === 'theme' && (
          <section className="space-y-4">
            <Header title="Theme editor" subtitle="Edit every visual value and save it as a reusable system theme." />
            <div className="flex items-center gap-2">
              <select value={themeDraft.id} onChange={(event) => selectTheme(event.target.value)} className="flex-1 rounded-lg px-3 py-2 text-xs bg-black/10 dark:bg-white/10 outline-none" style={{ color: 'var(--pyos-text)' }}>
                {allThemes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
              </select>
              <button onClick={() => setThemeDraft({ ...THEMES[0], id: `custom-${Date.now()}`, name: 'New custom theme' })} className="px-3 py-2 rounded-lg text-xs bg-black/10 dark:bg-white/10">New</button>
              <button onClick={saveTheme} className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ background: 'var(--pyos-accent)', color: '#fff' }}><Save size={13} /> Save</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Theme name" value={themeDraft.name} onChange={(value) => setThemeDraft((draft) => ({ ...draft, name: value }))} />
              {editableKeys.map((key) => <Field key={key} label={key} value={String(themeDraft[key])} onChange={(value) => setThemeDraft((draft) => ({ ...draft, [key]: value }))} />)}
            </div>
          </section>
        )}

        {tab === 'apps' && (
          <section className="space-y-4">
            <Header title="Applications" subtitle="Inspect installed applications and their saved source." />
            <div className="grid grid-cols-2 gap-3">
              {customApps.length === 0 ? <Empty label="No AI applications installed yet." /> : customApps.map((app) => <div key={app.id} className="glass-panel p-4"><div className="flex items-center gap-3"><AppWindow size={20} style={{ color: 'var(--pyos-accent)' }} /><div><p className="text-sm font-medium">{app.name}</p><p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>{app.id}</p></div></div><p className="text-xs mt-3" style={{ color: 'var(--pyos-text-dim)' }}>{app.description}</p><p className="text-[10px] mt-3 font-mono" style={{ color: 'var(--pyos-text-dim)' }}>Source saved in custom app storage</p></div>)}
            </div>
          </section>
        )}

        {tab === 'code' && (
          <section className="space-y-4">
            <Header title="OS source" subtitle="Read system source and inspect generated app code. Core files stay protected from accidental deletion." />
            <div className="flex gap-2"><select value={codeTarget} onChange={(event) => setCodeTarget(event.target.value)} className="rounded-lg px-3 py-2 text-xs bg-black/10 dark:bg-white/10 outline-none" style={{ color: 'var(--pyos-text)' }}><option>App.tsx</option><option>themes.ts</option><option>appRegistry.tsx</option></select><button onClick={loadCode} className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 bg-black/10 dark:bg-white/10"><Search size={13} /> Load</button><button onClick={() => setCodeValue('')} className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 bg-black/10 dark:bg-white/10"><RotateCcw size={13} /> Clear</button></div>
            <textarea value={codeValue} onChange={(event) => setCodeValue(event.target.value)} placeholder="Choose a source file and press Load..." className="w-full min-h-[360px] rounded-xl p-4 bg-black/20 dark:bg-black/30 font-mono text-xs outline-none resize-y" style={{ color: 'var(--pyos-text)' }} />
          </section>
        )}
      </main>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><h2 className="text-lg font-semibold">{title}</h2><p className="text-xs mt-1" style={{ color: 'var(--pyos-text-dim)' }}>{subtitle}</p></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="glass-panel p-3 block"><span className="block text-[10px] mb-1.5" style={{ color: 'var(--pyos-text-dim)' }}>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent outline-none text-xs" style={{ color: 'var(--pyos-text)' }} /></label>;
}

function Empty({ label }: { label: string }) {
  return <div className="col-span-2 glass-panel p-8 text-center text-xs" style={{ color: 'var(--pyos-text-dim)' }}>{label}</div>;
}
