import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Bot, User, Loader2, Palette, Code2, Trash2, Settings as SettingsIcon } from 'lucide-react';
import type { AppProps } from '../os/types';
import { loadAIConfig, saveAIConfig, buildHeaders, buildBody, extractContent, getProviderDefaults, type AIConfig, type AIProvider } from '../os/aiConfig';
import { loadCustomData, addCustomTheme, addCustomApp, deleteCustomTheme, deleteCustomApp, useRuntimeData, type CustomApp } from '../os/runtimeRegistry';
import type { PyOSTheme } from '../os/themes';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AICallback {
  type: 'theme' | 'app' | 'info';
  data?: unknown;
}

const SYSTEM_PROMPT = `You are VinGrape AI, the built-in AI assistant of the VinGrape operating system.
You can have conversations, answer questions, and help users customize their OS.

You have special capabilities:
1. CREATE THEME: When the user asks you to create or change a theme (e.g. "make a black theme", "create a blue ocean theme"), respond with a JSON block wrapped in <THEME_JSON>...</THEME_JSON> tags containing a full theme object with ALL of these fields:
   id (string, lowercase no spaces), name (string), bg, bgDeep, bgGradient, accent, accent2, accent3, glass, glassBorder, glassHover, text, textDim, textBright, radius (number), radiusSm (number), radiusLg (number), borderWidth (number), shadowColor, shadowBlur (number), glowColor, glowBlur (number), wallpaper (CSS gradient string), wallpaperOverlay, titlebarBg, titlebarHeight (number), titlebarTextSize (number), dockBg, dockHeight (number), dockBlur (number), font, monoFont, fontSize (number), headingWeight (number), bodyWeight (number), scrollbarTrack, scrollbarThumb, scrollbarThumbHover, selectionBg, selectionText, successColor, warningColor, errorColor, linkColor, animationSpeed (number).
   Use professional, clean colors similar to macOS or Windows. Avoid neon colors. Use subtle gradients.

2. CREATE APP: When the user asks you to create an app (e.g. "make a calculator app", "create a clock app"), respond with a JSON block wrapped in <APP_JSON>...</APP_JSON> tags containing:
   { "id": "unique_id", "name": "App Name", "icon": "LucideIconName", "description": "what it does", "code": "full React component code as a single TSX file using React hooks, Tailwind classes, and lucide-react icons. The component must be a default export accepting an AppProps with {windowId: string}. Use inline styles with var(--pyos-accent) etc for theming." }

Always be helpful, concise, and friendly. When you create a theme or app, explain what you did briefly after the JSON block.
Use **bold** for emphasis and use markdown formatting in your responses.`;

function parseAIResponse(text: string): { message: string; callbacks: AICallback[] } {
  const callbacks: AICallback[] = [];

  // Extract theme JSON
  const themeMatch = text.match(/<THEME_JSON>([\s\S]*?)<\/THEME_JSON>/);
  if (themeMatch) {
    try {
      const themeData = JSON.parse(themeMatch[1].trim());
      callbacks.push({ type: 'theme', data: themeData });
    } catch {
      // ignore parse error
    }
  }

  // Extract app JSON
  const appMatch = text.match(/<APP_JSON>([\s\S]*?)<\/APP_JSON>/);
  if (appMatch) {
    try {
      const appData = JSON.parse(appMatch[1].trim());
      callbacks.push({ type: 'app', data: appData });
    } catch {
      // ignore parse error
    }
  }

  // Clean message: remove JSON blocks but keep the explanation
  const message = text
    .replace(/<THEME_JSON>[\s\S]*?<\/THEME_JSON>/g, '[Theme created — see Settings]')
    .replace(/<APP_JSON>[\s\S]*?<\/APP_JSON>/g, '[App created — check desktop]')
    .trim();

  return { message, callbacks };
}

async function callAI(messages: ChatMessage[], config: AIConfig): Promise<string> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: buildHeaders(config),
    body: buildBody(config, SYSTEM_PROMPT, messages),
  });

  if (!response.ok) {
    throw new Error(`AI request failed (${response.status})`);
  }

  const data = await response.json();
  return extractContent(data);
}

interface AIAppProps extends AppProps {
  onThemeCreated?: (theme: Record<string, unknown>) => void;
  onAppCreated?: (app: Record<string, unknown>) => void;
}

export default function AIApp({ windowId: _windowId, onThemeCreated, onAppCreated }: AIAppProps) {
  void _windowId;
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig());
  const [showConfig, setShowConfig] = useState(false);
  const { customThemes, customApps } = useRuntimeData();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm VinGrape AI, your built-in assistant. I can chat, create custom themes for your OS, and even build new desktop apps. Try asking me to 'create a dark ocean theme' or 'make a calculator app'!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customThemesState] = useState<Record<string, unknown>[]>([]);
  void customThemesState;
  const [customAppsState] = useState<Record<string, unknown>[]>([]);
  void customAppsState;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load saved themes and apps on mount
  useEffect(() => {
    loadCustomData();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const rawResponse = await callAI(newMessages, aiConfig);
      const { message, callbacks } = parseAIResponse(rawResponse);

      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);

      // Process callbacks
      for (const cb of callbacks) {
        if (cb.type === 'theme' && cb.data) {
          const themeData = cb.data as PyOSTheme;
          await addCustomTheme(themeData);
          onThemeCreated?.(themeData as unknown as Record<string, unknown>);
        } else if (cb.type === 'app' && cb.data) {
          const appData = cb.data as CustomApp;
          await addCustomApp(appData);
          onAppCreated?.(appData as unknown as Record<string, unknown>);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${errorMsg}. Please try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    await deleteCustomTheme(themeId);
  };

  const handleDeleteApp = async (appId: string) => {
    await deleteCustomApp(appId);
  };

  const quickPrompts = [
    { label: 'Create a dark theme', icon: Palette, prompt: 'Create a beautiful pure black theme with subtle white accents' },
    { label: 'Make a calculator', icon: Code2, prompt: 'Create a calculator app for my desktop' },
    { label: 'Ocean theme', icon: Palette, prompt: 'Create a deep ocean blue theme with cyan accents' },
    { label: 'Clock app', icon: Code2, prompt: 'Create a digital clock app that shows the current time' },
  ];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'rgba(7,6,26,0.5)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg accent-gradient flex items-center justify-center">
          <Sparkles size={14} className="text-black/80" />
        </div>
        <div>
          <p className="text-sm font-semibold">VinGrape AI</p>
          <p className="text-[10px] text-[var(--pyos-text-dim)]">Free AI · Theme & App Builder</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setShowConfig((v) => !v)}
            className="w-7 h-7 rounded-lg glass-panel flex items-center justify-center hover:scale-105 transition-transform"
            title="AI Settings"
          >
            <SettingsIcon size={13} style={{ color: 'var(--pyos-text-dim)' }} />
          </button>
          {customThemes.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5" style={{ color: 'var(--pyos-accent)' }}>
              {customThemes.length} themes
            </span>
          )}
          {customApps.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5" style={{ color: 'var(--pyos-accent-2)' }}>
              {customApps.length} apps
            </span>
          )}
        </div>
      </div>

      {/* Inline config panel */}
      {showConfig && (
        <AIConfigPanel config={aiConfig} onChange={setAiConfig} onClose={() => setShowConfig(false)} />
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-white/10' : 'accent-gradient'
              }`}
            >
              {msg.role === 'user' ? (
                <User size={14} style={{ color: 'var(--pyos-text)' }} />
              ) : (
                <Bot size={14} className="text-black/80" />
              )}
            </div>
            <div
              className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-white/8' : 'glass-panel'
              }`}
              style={{ color: 'var(--pyos-text)' }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg accent-gradient flex items-center justify-center">
              <Bot size={14} className="text-black/80" />
            </div>
            <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--pyos-accent)' }} />
              <span className="text-xs text-[var(--pyos-text-dim)]">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickPrompts.map((qp) => (
            <button
              key={qp.label}
              onClick={() => setInput(qp.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel hover:scale-105 transition-transform text-xs"
            >
              <qp.icon size={12} style={{ color: 'var(--pyos-accent)' }} />
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Created items list */}
      {(customThemes.length > 0 || customApps.length > 0) && (
        <div className="px-4 py-2 border-t border-white/10 max-h-24 overflow-y-auto">
          {customThemes.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[10px] text-[var(--pyos-text-dim)]">Themes:</span>
              {customThemes.map((t) => (
                <span key={t.id as string} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5">
                  <span style={{ color: 'var(--pyos-accent)' }}>{t.name as string}</span>
                  <button onClick={() => handleDeleteTheme(t.id as string)} className="opacity-50 hover:opacity-100">
                    <Trash2 size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {customApps.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[var(--pyos-text-dim)]">Apps:</span>
              {customApps.map((a) => (
                <span key={a.id as string} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5">
                  <span style={{ color: 'var(--pyos-accent-2)' }}>{a.name as string}</span>
                  <button onClick={() => handleDeleteApp(a.id as string)} className="opacity-50 hover:opacity-100">
                    <Trash2 size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/10 flex items-center gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything... create a theme, build an app, or just chat"
          className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[var(--pyos-accent)]/30 transition-colors"
          style={{ color: 'var(--pyos-text)', caretColor: 'var(--pyos-accent)' }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 disabled:scale-100"
        >
          {loading ? <Loader2 size={16} className="animate-spin text-black/80" /> : <Send size={16} className="text-black/80" />}
        </button>
      </div>
    </div>
  );
}

function AIConfigPanel({
  config,
  onChange,
  onClose,
}: {
  config: AIConfig;
  onChange: (c: AIConfig) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<AIConfig>(config);

  const update = (patch: Partial<AIConfig>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    saveAIConfig(next);
    onChange(next);
  };

  const handleProviderChange = (provider: AIProvider) => {
    const defaults = getProviderDefaults(provider);
    const next: AIConfig = {
      provider,
      model: defaults.model || local.model,
      apiKey: defaults.needsKey ? local.apiKey : '',
      endpoint: defaults.endpoint || local.endpoint,
    };
    setLocal(next);
    saveAIConfig(next);
    onChange(next);
  };

  return (
    <div className="border-b border-white/10 p-4 space-y-3 animate-fade-in" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">AI Configuration</p>
        <button onClick={onClose} className="text-[10px] text-[var(--pyos-text-dim)] hover:text-[var(--pyos-text)]">
          Close
        </button>
      </div>

      {/* Provider */}
      <div>
        <label className="text-[10px] text-[var(--pyos-text-dim)] block mb-1">Provider</label>
        <div className="flex gap-1.5">
          {(['pollinations', 'openai', 'openrouter', 'custom'] as AIProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => handleProviderChange(p)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                local.provider === p
                  ? 'accent-gradient text-black/80 font-medium'
                  : 'glass-panel hover:bg-white/8'
              }`}
            >
              {p === 'pollinations' ? 'Pollinations (Free)' : p === 'openai' ? 'OpenAI' : p === 'openrouter' ? 'OpenRouter' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="text-[10px] text-[var(--pyos-text-dim)] block mb-1">Model</label>
        <input
          value={local.model}
          onChange={(e) => update({ model: e.target.value })}
          placeholder="e.g. openai, gpt-4o-mini, mistral"
          className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs outline-none border border-transparent focus:border-[var(--pyos-accent)]/30"
          style={{ color: 'var(--pyos-text)' }}
        />
      </div>

      {/* Endpoint */}
      <div>
        <label className="text-[10px] text-[var(--pyos-text-dim)] block mb-1">API Endpoint</label>
        <input
          value={local.endpoint}
          onChange={(e) => update({ endpoint: e.target.value })}
          placeholder="https://..."
          className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono outline-none border border-transparent focus:border-[var(--pyos-accent)]/30"
          style={{ color: 'var(--pyos-text)' }}
        />
      </div>

      {/* API Key */}
      <div>
        <label className="text-[10px] text-[var(--pyos-text-dim)] block mb-1">API Key (optional)</label>
        <input
          type="password"
          value={local.apiKey}
          onChange={(e) => update({ apiKey: e.target.value })}
          placeholder="sk-... (leave empty for free providers)"
          className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono outline-none border border-transparent focus:border-[var(--pyos-accent)]/30"
          style={{ color: 'var(--pyos-text)' }}
        />
        <p className="text-[9px] text-[var(--pyos-text-dim)] mt-1">
          Stored locally in your browser. Not needed for Pollinations.
        </p>
      </div>
    </div>
  );
}
