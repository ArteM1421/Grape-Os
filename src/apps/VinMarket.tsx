import { useState, useEffect, useCallback } from 'react';
import { Store, Download, Search, Loader2, Check, AlertCircle, Tag, FlaskConical, FileCode } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { AppProps } from '../os/types';
import { addCustomApp } from '../os/runtimeRegistry';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MarketApp {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  app_type: 'direct' | 'beta';
  download_url: string;
  code: string;
  category: string;
  version: string;
  author: string;
}

type FilterType = 'all' | 'direct' | 'beta';

export default function VinMarket(_props: AppProps) {
  const [apps, setApps] = useState<MarketApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [installError, setInstallError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('vin_market_apps')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setApps((data as MarketApp[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleInstall = useCallback(async (app: MarketApp) => {
    setInstalling(app.id);
    setInstallError(null);
    try {
      let code = app.code;
      if (app.app_type === 'direct') {
        if (!app.download_url) {
          throw new Error('This app has no download URL configured.');
        }
        const res = await fetch(app.download_url);
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        code = await res.text();
        if (!code || code.length < 10) throw new Error('Downloaded file is empty or invalid.');
      }
      await addCustomApp({
        id: `market-${app.id}`,
        name: app.name,
        description: app.description,
        icon: app.icon_name,
        code,
      });
      setInstalled((prev) => new Set(prev).add(app.id));
      window.dispatchEvent(new Event('vingrape-settings-change'));
    } catch (e) {
      setInstallError(e instanceof Error ? e.message : 'Installation failed');
    } finally {
      setInstalling(null);
    }
  }, []);

  const filtered = apps.filter((app) => {
    if (filter !== 'all' && app.app_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q) || app.category.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = Array.from(new Set(apps.map((a) => a.category)));

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'rgba(7,6,26,0.4)' }}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center flex-shrink-0">
          <Store size={18} className="text-black/80" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Vin Market</h2>
          <p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>Download apps for your desktop</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--pyos-text-dim)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-40 bg-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none border border-transparent focus:border-[var(--pyos-accent)]/30"
              style={{ color: 'var(--pyos-text)' }}
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'direct', 'beta'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  filter === f ? 'accent-gradient text-black/80' : 'bg-white/5 hover:bg-white/8'
                }`}
              >
                {f === 'all' ? 'All' : f === 'direct' ? 'Direct' : 'Beta'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchApps}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/8 flex items-center justify-center transition-colors"
            title="Refresh"
          >
            <Loader2 size={13} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--pyos-text-dim)' }} />
          </button>
        </div>
      </div>

      {installError && (
        <div className="mx-4 mt-3 p-3 rounded-lg flex items-center gap-2 text-xs" style={{ background: 'rgba(255,85,119,0.1)', color: 'var(--pyos-error)' }}>
          <AlertCircle size={14} />
          {installError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin mb-3" style={{ color: 'var(--pyos-accent)' }} />
            <p className="text-xs" style={{ color: 'var(--pyos-text-dim)' }}>Loading market...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle size={32} className="mb-3" style={{ color: 'var(--pyos-error)' }} />
            <p className="text-xs mb-1" style={{ color: 'var(--pyos-error)' }}>Failed to load market</p>
            <p className="text-[10px] mb-4" style={{ color: 'var(--pyos-text-dim)' }}>{error}</p>
            <button onClick={fetchApps} className="px-4 py-2 rounded-lg accent-gradient text-black/80 text-xs font-medium">Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Store size={32} className="mb-3 opacity-30" style={{ color: 'var(--pyos-text-dim)' }} />
            <p className="text-xs" style={{ color: 'var(--pyos-text-dim)' }}>
              {apps.length === 0 ? 'No apps in the market yet. Add some from the Supabase dashboard.' : 'No apps match your search.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {categories.length > 1 && (
              <div className="flex gap-1.5 mb-4 flex-wrap">
                <button
                  onClick={() => setSearch('')}
                  className="px-2.5 py-1 rounded-full text-[10px] bg-white/5 hover:bg-white/8 transition-colors"
                  style={{ color: 'var(--pyos-text-dim)' }}
                >
                  All categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSearch(cat)}
                    className="px-2.5 py-1 rounded-full text-[10px] bg-white/5 hover:bg-white/8 transition-colors flex items-center gap-1"
                    style={{ color: 'var(--pyos-text-dim)' }}
                  >
                    <Tag size={9} /> {cat}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((app) => (
                <div key={app.id} className="glass-panel p-4 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {app.app_type === 'beta' ? (
                        <FlaskConical size={18} style={{ color: 'var(--pyos-accent-2)' }} />
                      ) : (
                        <FileCode size={18} style={{ color: 'var(--pyos-accent)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{app.name}</h3>
                      <p className="text-[10px]" style={{ color: 'var(--pyos-text-dim)' }}>v{app.version} by {app.author}</p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-mono flex-shrink-0"
                      style={{
                        background: app.app_type === 'beta' ? 'rgba(0,212,255,0.15)' : 'rgba(0,255,157,0.15)',
                        color: app.app_type === 'beta' ? 'var(--pyos-accent-2)' : 'var(--pyos-accent)',
                      }}
                    >
                      {app.app_type === 'beta' ? 'BETA' : 'DIRECT'}
                    </span>
                  </div>
                  <p className="text-xs mb-3 flex-1" style={{ color: 'var(--pyos-text-dim)' }}>
                    {app.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[9px] bg-white/5" style={{ color: 'var(--pyos-text-dim)' }}>{app.category}</span>
                    {installed.has(app.id) ? (
                      <div className="flex-1 flex items-center justify-end gap-1.5 text-xs" style={{ color: 'var(--pyos-success)' }}>
                        <Check size={14} /> Installed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInstall(app)}
                        disabled={installing === app.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg accent-gradient text-black/80 text-xs font-medium hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
                      >
                        {installing === app.id ? (
                          <><Loader2 size={13} className="animate-spin" /> Installing...</>
                        ) : (
                          <><Download size={13} /> Install</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
