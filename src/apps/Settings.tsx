import { useState, useEffect, useRef } from 'react';
import { Palette, Check, Monitor, Volume2, Shield, Info, Sliders, Bot, Code2 } from 'lucide-react';
import type { AppProps } from '../os/types';
import { THEMES, type PyOSTheme } from '../os/themes';
import { createClient } from '@supabase/supabase-js';
import { loadAIConfig, saveAIConfig, getProviderDefaults, type AIConfig, type AIProvider } from '../os/aiConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SettingsProps extends AppProps {
  currentThemeId: string;
  onThemeChange: (id: string) => void;
  customThemes?: PyOSTheme[];
}

type Tab = 'appearance' | 'advanced' | 'ai' | 'display' | 'sound' | 'security' | 'about';

const THEME_SETTING_LABELS: { key: keyof PyOSTheme; label: string; type: 'color' | 'text' | 'number' }[] = [
  { key: 'bg', label: 'Background', type: 'color' },
  { key: 'bgDeep', label: 'Deep Background', type: 'color' },
  { key: 'bgGradient', label: 'BG Gradient', type: 'text' },
  { key: 'accent', label: 'Accent', type: 'color' },
  { key: 'accent2', label: 'Accent 2', type: 'color' },
  { key: 'accent3', label: 'Accent 3', type: 'color' },
  { key: 'glass', label: 'Glass BG', type: 'text' },
  { key: 'glassBorder', label: 'Glass Border', type: 'text' },
  { key: 'glassHover', label: 'Glass Hover', type: 'text' },
  { key: 'text', label: 'Text', type: 'color' },
  { key: 'textDim', label: 'Text Dim', type: 'color' },
  { key: 'textBright', label: 'Text Bright', type: 'color' },
  { key: 'radius', label: 'Radius', type: 'number' },
  { key: 'radiusSm', label: 'Radius Small', type: 'number' },
  { key: 'radiusLg', label: 'Radius Large', type: 'number' },
  { key: 'borderWidth', label: 'Border Width', type: 'number' },
  { key: 'shadowColor', label: 'Shadow Color', type: 'text' },
  { key: 'shadowBlur', label: 'Shadow Blur', type: 'number' },
  { key: 'glowColor', label: 'Glow Color', type: 'text' },
  { key: 'glowBlur', label: 'Glow Blur', type: 'number' },
  { key: 'wallpaper', label: 'Wallpaper', type: 'text' },
  { key: 'wallpaperOverlay', label: 'Wallpaper Overlay', type: 'text' },
  { key: 'titlebarBg', label: 'Titlebar BG', type: 'text' },
  { key: 'titlebarHeight', label: 'Titlebar Height', type: 'number' },
  { key: 'titlebarTextSize', label: 'Titlebar Text Size', type: 'number' },
  { key: 'dockBg', label: 'Dock BG', type: 'text' },
  { key: 'dockHeight', label: 'Dock Height', type: 'number' },
  { key: 'dockBlur', label: 'Dock Blur', type: 'number' },
  { key: 'font', label: 'Font', type: 'text' },
  { key: 'monoFont', label: 'Mono Font', type: 'text' },
  { key: 'fontSize', label: 'Font Size', type: 'number' },
  { key: 'headingWeight', label: 'Heading Weight', type: 'number' },
  { key: 'bodyWeight', label: 'Body Weight', type: 'number' },
  { key: 'scrollbarTrack', label: 'Scrollbar Track', type: 'text' },
  { key: 'scrollbarThumb', label: 'Scrollbar Thumb', type: 'text' },
  { key: 'scrollbarThumbHover', label: 'Scrollbar Hover', type: 'text' },
  { key: 'selectionBg', label: 'Selection BG', type: 'text' },
  { key: 'selectionText', label: 'Selection Text', type: 'color' },
  { key: 'successColor', label: 'Success', type: 'color' },
  { key: 'warningColor', label: 'Warning', type: 'color' },
  { key: 'errorColor', label: 'Error', type: 'color' },
  { key: 'linkColor', label: 'Link', type: 'color' },
  { key: 'animationSpeed', label: 'Anim Speed', type: 'number' },
];

export default function Settings({ currentThemeId, onThemeChange }: SettingsProps) {
  const [tab, setTab] = useState<Tab>('appearance');
  const [vol, setVol] = useState(65);
  const [brightness, setBrightness] = useState(80);
  const [customThemes, setCustomThemes] = useState<PyOSTheme[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig());
  const [brandIcon, setBrandIcon] = useState(() => localStorage.getItem('vingrape-icon-url') ?? '');
  const [osName, setOsName] = useState(() => localStorage.getItem('vingrape-os-name') ?? 'VinGrape OS');
  const [creatorName, setCreatorName] = useState(() => localStorage.getItem('vingrape-creator-name') ?? 'ArtGroup (Artem Malmygin)');
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);
  const [devUnlocked, setDevUnlocked] = useState(() => localStorage.getItem('vingrape-dev-unlocked') === 'true');

  const handleIconTripleClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => { clickCountRef.current = 0; }, 1000);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      const newVal = !devUnlocked;
      setDevUnlocked(newVal);
      localStorage.setItem('vingrape-dev-unlocked', String(newVal));
      window.dispatchEvent(new Event('vingrape-settings-change'));
    }
  };

  useEffect(() => {
    const handler = () => {
      setBrandIcon(localStorage.getItem('vingrape-icon-url') ?? '');
      setOsName(localStorage.getItem('vingrape-os-name') ?? 'VinGrape OS');
      setCreatorName(localStorage.getItem('vingrape-creator-name') ?? 'ArtGroup (Artem Malmygin)');
    };
    window.addEventListener('vingrape-settings-change', handler);
    return () => window.removeEventListener('vingrape-settings-change', handler);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('custom_themes').select('*').order('created_at', { ascending: false });
      if (data) {
        setCustomThemes(data.map((row: Record<string, unknown>) => row.theme_data as PyOSTheme));
      }
    })();
  }, []);

  const allThemes = [...THEMES, ...customThemes];
  const currentTheme = allThemes.find((t) => t.id === currentThemeId) ?? THEMES[0];

  const tabs: { id: Tab; label: string; icon: typeof Palette }[] = [
    { id: 'appearance', label: 'Themes', icon: Palette },
    { id: 'advanced', label: 'Theme Settings', icon: Sliders },
    { id: 'ai', label: 'AI Engine', icon: Bot },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'sound', label: 'Sound', icon: Volume2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="w-full h-full flex" style={{ background: 'rgba(7,6,26,0.4)' }}>
      {/* Sidebar */}
      <div className="w-44 flex-shrink-0 p-3 border-r border-white/10">
        <p className="text-[10px] uppercase tracking-wider text-[var(--pyos-text-dim)] mb-2 px-2">
          Settings
        </p>
        <div className="space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                tab === t.id
                  ? 'bg-white/8 text-[var(--pyos-text)]'
                  : 'text-[var(--pyos-text-dim)] hover:bg-white/5'
              }`}
            >
              <t.icon size={15} style={{ color: tab === t.id ? 'var(--pyos-accent)' : undefined }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'appearance' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Themes</h2>
            <p className="text-xs text-[var(--pyos-text-dim)] mb-6">
              {allThemes.length} themes available. Changes apply instantly. Ask VinGrape AI to create more.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {allThemes.map((theme) => {
                const active = theme.id === currentThemeId;
                const isCustom = customThemes.some((ct) => ct.id === theme.id);
                return (
                  <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`relative p-4 rounded-xl text-left transition-all overflow-hidden ${
                      active ? 'neon-border' : 'glass-panel hover:scale-[1.02]'
                    }`}
                    style={{ background: theme.wallpaper }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium" style={{ color: theme.text }}>
                        {theme.name}
                      </span>
                      {active && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: theme.accent }}
                        >
                          <Check size={12} className="text-black/80" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-6 h-6 rounded-md" style={{ background: theme.accent }} />
                      <div className="w-6 h-6 rounded-md" style={{ background: theme.accent2 }} />
                      <div className="w-6 h-6 rounded-md" style={{ background: theme.accent3 }} />
                      <div className="w-6 h-6 rounded-md" style={{ background: theme.bg }} />
                      <div className="w-6 h-6 rounded-md border border-white/10" style={{ background: theme.glass }} />
                    </div>
                    {active && (
                      <div
                        className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-mono rounded-bl-lg"
                        style={{ background: theme.accent, color: '#000' }}
                      >
                        ACTIVE
                      </div>
                    )}
                    {isCustom && (
                      <div
                        className="absolute top-0 left-0 px-2 py-0.5 text-[9px] font-mono rounded-br-lg"
                        style={{ background: 'rgba(255,255,255,0.15)', color: theme.text }}
                      >
                        AI
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 glass-panel p-4">
              <h3 className="text-xs font-medium mb-3">Theme Engine</h3>
              <p className="text-xs text-[var(--pyos-text-dim)] leading-relaxed">
                Each theme contains 40 customizable settings: 3 background colors, 3 accent colors, 3 glass
                effects, 3 text colors, 3 border radii, shadow, glow, wallpaper gradient, title bar, dock,
                fonts, scrollbar, selection, status colors, and animation speed. Themes are hot-swappable
                and applied via CSS custom properties. Use VinGrape AI to generate new themes.
              </p>
            </div>
          </div>
        )}

        {tab === 'advanced' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Theme Settings</h2>
            <p className="text-xs text-[var(--pyos-text-dim)] mb-6">
              All 40 settings for the current theme: {currentTheme.name}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {THEME_SETTING_LABELS.map((setting) => {
                const value = currentTheme[setting.key];
                return (
                  <div key={setting.key} className="glass-panel px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[var(--pyos-text-dim)]">{setting.label}</span>
                      {setting.type === 'color' && (
                        <div
                          className="w-4 h-4 rounded border border-white/20"
                          style={{ background: value as string }}
                        />
                      )}
                    </div>
                    <p className="text-xs font-mono truncate" style={{ color: 'var(--pyos-text)' }}>
                      {String(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">AI Engine</h2>
            <p className="text-xs text-[var(--pyos-text-dim)] mb-6">
              Configure the AI provider, model, and API key. Settings are stored locally.
            </p>

            <div className="space-y-4">
              {/* Provider */}
              <div className="glass-panel p-4">
                <label className="text-xs font-medium block mb-2">Provider</label>
                <div className="flex gap-2">
                  {(['pollinations', 'openai', 'openrouter', 'custom'] as AIProvider[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        const defaults = getProviderDefaults(p);
                        const next: AIConfig = {
                          provider: p,
                          model: defaults.model || aiConfig.model,
                          apiKey: defaults.needsKey ? aiConfig.apiKey : '',
                          endpoint: defaults.endpoint || aiConfig.endpoint,
                        };
                        saveAIConfig(next);
                        setAiConfig(next);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                        aiConfig.provider === p
                          ? 'accent-gradient text-black/80 font-medium'
                          : 'bg-white/5 hover:bg-white/8'
                      }`}
                    >
                      {p === 'pollinations' ? 'Pollinations (Free)' : p === 'openai' ? 'OpenAI' : p === 'openrouter' ? 'OpenRouter' : 'Custom'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--pyos-text-dim)] mt-2">
                  {aiConfig.provider === 'pollinations' && 'Free, no API key needed. Powered by Pollinations.AI.'}
                  {aiConfig.provider === 'openai' && 'Requires an OpenAI API key from platform.openai.com.'}
                  {aiConfig.provider === 'openrouter' && 'Requires an OpenRouter API key from openrouter.ai/keys. Access 100+ models.'}
                  {aiConfig.provider === 'custom' && 'Use any OpenAI-compatible endpoint (e.g. local LLM, Azure, etc).'}
                </p>
              </div>

              {/* Model */}
              <div className="glass-panel p-4">
                <label className="text-xs font-medium block mb-2">Model</label>
                <input
                  value={aiConfig.model}
                  onChange={(e) => {
                    const next = { ...aiConfig, model: e.target.value };
                    saveAIConfig(next);
                    setAiConfig(next);
                  }}
                  placeholder="e.g. openai, gpt-4o-mini, mistral"
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs outline-none border border-transparent focus:border-[var(--pyos-accent)]/30"
                  style={{ color: 'var(--pyos-text)' }}
                />
              </div>

              {/* Endpoint */}
              <div className="glass-panel p-4">
                <label className="text-xs font-medium block mb-2">API Endpoint</label>
                <input
                  value={aiConfig.endpoint}
                  onChange={(e) => {
                    const next = { ...aiConfig, endpoint: e.target.value };
                    saveAIConfig(next);
                    setAiConfig(next);
                  }}
                  placeholder="https://..."
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono outline-none border border-transparent focus:border-[var(--pyos-accent)]/30"
                  style={{ color: 'var(--pyos-text)' }}
                />
              </div>

              {/* API Key */}
              <div className="glass-panel p-4">
                <label className="text-xs font-medium block mb-2">API Key</label>
                <input
                  type="password"
                  value={aiConfig.apiKey}
                  onChange={(e) => {
                    const next = { ...aiConfig, apiKey: e.target.value };
                    saveAIConfig(next);
                    setAiConfig(next);
                  }}
                  placeholder="sk-... (leave empty for free providers)"
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono outline-none border border-transparent focus:border-[var(--pyos-accent)]/30"
                  style={{ color: 'var(--pyos-text)' }}
                />
                <p className="text-[10px] text-[var(--pyos-text-dim)] mt-2">
                  Stored locally in your browser only. Not sent anywhere except the API endpoint above.
                </p>
              </div>

              <div className="glass-panel p-4">
                <h3 className="text-xs font-medium mb-2">About VinGrape AI</h3>
                <p className="text-xs text-[var(--pyos-text-dim)] leading-relaxed">
                  VinGrape AI can chat, create custom themes, and build desktop apps. By default it uses
                  the free Pollinations.AI service. You can switch to OpenAI or any custom OpenAI-compatible
                  endpoint. The AI has direct access to modify the OS — it can create themes and apps that
                  appear instantly on your desktop.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'display' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Display</h2>
            <p className="text-xs text-[var(--pyos-text-dim)] mb-6">Screen and rendering settings.</p>

            <div className="space-y-5">
              <div className="glass-panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Brightness</span>
                  <span className="text-xs font-mono text-[var(--pyos-text-dim)]">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-[var(--pyos-accent)]"
                />
              </div>

              <div className="glass-panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Resolution</span>
                  <span className="text-xs font-mono text-[var(--pyos-text-dim)]">
                    {window.innerWidth} x {window.innerHeight}
                  </span>
                </div>
                <p className="text-xs text-[var(--pyos-text-dim)]">Adaptive — scales to viewport</p>
              </div>

              <div className="glass-panel p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">V-Sync</span>
                    <p className="text-xs text-[var(--pyos-text-dim)] mt-0.5">Vertical sync for smooth 60+ FPS</p>
                  </div>
                  <div className="w-10 h-6 rounded-full accent-gradient flex items-center justify-end px-0.5">
                    <div className="w-5 h-5 rounded-full bg-white/90" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'sound' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Sound</h2>
            <p className="text-xs text-[var(--pyos-text-dim)] mb-6">Audio output configuration.</p>

            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Master Volume</span>
                <span className="text-xs font-mono text-[var(--pyos-text-dim)]">{vol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={vol}
                onChange={(e) => setVol(Number(e.target.value))}
                className="w-full accent-[var(--pyos-accent)]"
              />
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Security</h2>
            <p className="text-xs text-[var(--pyos-text-dim)] mb-6">System protection and sandboxing.</p>

            <div className="space-y-3">
              <div className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm">App Sandbox</span>
                  <p className="text-xs text-[var(--pyos-text-dim)] mt-0.5">Restrict app access to system files</p>
                </div>
                <div className="w-10 h-6 rounded-full accent-gradient flex items-center justify-end px-0.5">
                  <div className="w-5 h-5 rounded-full bg-white/90" />
                </div>
              </div>
              <div className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm">Global Error Catch</span>
                  <p className="text-xs text-[var(--pyos-text-dim)] mt-0.5">Intercepts all crashes gracefully</p>
                </div>
                <div className="w-10 h-6 rounded-full accent-gradient flex items-center justify-end px-0.5">
                  <div className="w-5 h-5 rounded-full bg-white/90" />
                </div>
              </div>
              <div className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm">Core Integrity Check</span>
                  <p className="text-xs text-[var(--pyos-text-dim)] mt-0.5">Verify kernel checksum on boot</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-white/10 flex items-center justify-start px-0.5">
                  <div className="w-5 h-5 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">About</h2>
            <p className="text-xs text-[var(--pyos-text-dim)] mb-6">System information.</p>

            <div className="glass-panel p-6 text-center mb-4">
              <img
                src={brandIcon || "https://cdn-icons-png.flaticon.com/128/8832/8832714.png"}
                alt="VinGrape"
                className="w-16 h-16 mx-auto mb-4 object-contain cursor-pointer select-none"
                onClick={handleIconTripleClick}
              />
              <h3 className="text-xl font-bold neon-text">{osName}</h3>
              <p className="text-sm text-[var(--pyos-text-dim)] mt-1">made by {creatorName}</p>
              {devUnlocked && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px]" style={{ background: 'rgba(0,255,157,0.15)', color: 'var(--pyos-accent)' }}>
                  <Code2 size={11} /> Dev Tools unlocked
                </div>
              )}
            </div>

            <div className="glass-panel divide-y divide-white/5">
              {[
                ['Kernel', 'VinGrape-core 1.0'],
                ['Architecture', 'Modular / React + Tailwind'],
                ['Design Language', 'Organic Cyber-Glass'],
                ['Window Manager', 'VinGrape WM'],
                ['Theme Engine', 'JSON-based, hot-swap, 40 settings'],
                ['Boot System', 'Auto-Bootstrap Core'],
                ['AI Engine', 'Pollinations.AI (free)'],
                ['Shell', 'vgsh 1.0'],
                ['Themes', `${allThemes.length} (${customThemes.length} AI-created)`],
                ['Build', '2026.08.26'],
                ['Created by', creatorName],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-[var(--pyos-text-dim)]">{k}</span>
                  <span className="text-xs font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
