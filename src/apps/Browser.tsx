import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search, Globe, Lock, Home } from 'lucide-react';
import type { AppProps } from '../os/types';

interface HistoryEntry {
  url: string;
  title: string;
}

export default function Browser(_props: AppProps) {
  const [input, setInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    let url: string;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      url = trimmed;
    } else if (trimmed.includes('.') && !trimmed.includes(' ')) {
      url = `https://${trimmed}`;
    } else {
      url = `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
    }

    setLoading(true);
    setCurrentUrl(url);
    setInput(url);

    const entry: HistoryEntry = { url, title: trimmed };
    const newHistory = [...history.slice(0, historyIndex + 1), entry];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const entry = history[newIndex];
      setCurrentUrl(entry.url);
      setInput(entry.url);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const entry = history[newIndex];
      setCurrentUrl(entry.url);
      setInput(entry.url);
    }
  };

  const reload = () => {
    if (iframeRef.current && currentUrl) {
      setLoading(true);
      iframeRef.current.src = currentUrl;
    }
  };

  const goHome = () => {
    setCurrentUrl(null);
    setInput('');
    setHistoryIndex(-1);
    setHistory([]);
  };

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, [loading, currentUrl]);

  const isHttps = currentUrl?.startsWith('https://');

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'rgba(0,0,0,0.2)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 flex-shrink-0">
        <button
          onClick={goBack}
          disabled={historyIndex <= 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors disabled:opacity-30"
        >
          <ArrowLeft size={16} style={{ color: 'var(--pyos-text)' }} />
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors disabled:opacity-30"
        >
          <ArrowRight size={16} style={{ color: 'var(--pyos-text)' }} />
        </button>
        <button
          onClick={reload}
          disabled={!currentUrl}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors disabled:opacity-30"
        >
          <RotateCcw size={16} style={{ color: 'var(--pyos-text)' }} />
        </button>
        <button
          onClick={goHome}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors"
        >
          <Home size={16} style={{ color: 'var(--pyos-text)' }} />
        </button>

        {/* URL/Search bar */}
        <div className="flex-1 flex items-center gap-2 mx-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {currentUrl ? (
            isHttps ? (
              <Lock size={12} style={{ color: 'var(--pyos-success)' }} />
            ) : (
              <Globe size={12} style={{ color: 'var(--pyos-text-dim)' }} />
            )
          ) : (
            <Search size={12} style={{ color: 'var(--pyos-text-dim)' }} />
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(input)}
            placeholder="Search or enter URL..."
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--pyos-text)' }}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {!currentUrl ? (
          <HomePage onNavigate={navigate} />
        ) : (
          <>
            {loading && (
              <div className="absolute top-0 left-0 right-0 h-0.5 z-10 overflow-hidden">
                <div className="h-full accent-gradient animate-pulse" style={{ width: '40%' }} />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              title="Browser"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setLoading(false)}
            />
            <div className="absolute bottom-2 right-2 text-[9px] glass-panel px-2 py-0.5 rounded-full pointer-events-none" style={{ color: 'var(--pyos-text-dim)' }}>
              Some sites may block embedding
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [search, setSearch] = useState('');
  const shortcuts = [
    { label: 'DuckDuckGo', url: 'https://duckduckgo.com', color: '#de5833' },
    { label: 'Google', url: 'https://google.com', color: '#4285f4' },
    { label: 'YouTube', url: 'https://youtube.com', color: '#ff0000' },
    { label: 'GitHub', url: 'https://github.com', color: '#ffffff' },
    { label: 'Wikipedia', url: 'https://wikipedia.org', color: '#a2a9b1' },
    { label: 'Reddit', url: 'https://reddit.com', color: '#ff4500' },
    { label: 'X', url: 'https://x.com', color: '#1d9bf0' },
    { label: 'Hacker News', url: 'https://news.ycombinator.com', color: '#ff6600' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
          <Globe size={32} className="text-black/80" />
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--pyos-text)' }}>
          VinGrape Browser
        </h1>
        <p className="text-xs" style={{ color: 'var(--pyos-text-dim)' }}>
          Search the web or enter a URL
        </p>
      </div>

      <div className="w-full max-w-md mb-8">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl glass-panel">
          <Search size={18} style={{ color: 'var(--pyos-text-dim)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate(search)}
            placeholder="Search or type a URL..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--pyos-text)' }}
            autoFocus
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-md">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.url)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl glass-panel hover:scale-105 transition-transform"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: s.color, color: s.color === '#ffffff' ? '#000' : '#fff' }}
            >
              {s.label[0]}
            </div>
            <span className="text-[10px]" style={{ color: 'var(--pyos-text)' }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
