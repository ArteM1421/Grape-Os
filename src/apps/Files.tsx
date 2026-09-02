import { useState } from 'react';
import {
  Folder,
  FileText,
  FileJson,
  FileCode,
  ChevronRight,
  Home,
  ArrowLeft,
  Search,
} from 'lucide-react';
import type { AppProps } from '../os/types';

interface FsNode {
  name: string;
  type: 'folder' | 'file';
  icon: typeof Folder;
  children?: FsNode[];
  content?: string;
}

const FS: FsNode[] = [
  {
    name: 'home',
    type: 'folder',
    icon: Folder,
    children: [
      {
        name: 'Documents',
        type: 'folder',
        icon: Folder,
        children: [
          { name: 'readme.txt', type: 'file', icon: FileText, content: 'Welcome to PyOS v1.0 Aether.\nThis is a simulated filesystem.' },
          { name: 'notes.md', type: 'file', icon: FileText, content: '# Quick Notes\n- Organic Cyber-Glass UI\n- Modular app system\n- Theme engine' },
        ],
      },
      {
        name: 'Projects',
        type: 'folder',
        icon: Folder,
        children: [
          { name: 'main.py', type: 'file', icon: FileCode, content: 'import pyos\n\nif __name__ == "__main__":\n    pyos.boot()' },
          { name: 'kernel.py', type: 'file', icon: FileCode, content: 'class Kernel:\n    def __init__(self):\n        self.wm = WindowManager()\n        self.renderer = Renderer()' },
          { name: 'manifest.json', type: 'file', icon: FileJson, content: '{\n  "os": "PyOS",\n  "version": "1.0",\n  "codename": "Aether"\n}' },
        ],
      },
      {
        name: 'apps',
        type: 'folder',
        icon: Folder,
        children: [
          {
            name: 'market_entropy',
            type: 'folder',
            icon: Folder,
            children: [
              { name: 'manifest.json', type: 'file', icon: FileJson, content: '{\n  "id": "market_entropy",\n  "name": "Market Entropy",\n  "entry": "main.py"\n}' },
              { name: 'main.py', type: 'file', icon: FileCode, content: '# Market Entropy visualization\nfrom pyos import App, Canvas\n\nclass MarketEntropy(App):\n    def on_render(self, ctx):\n        for p in self.particles:\n            ctx.draw(p.x, p.y, p.color)' },
            ],
          },
          {
            name: 'terminal',
            type: 'folder',
            icon: Folder,
            children: [
              { name: 'manifest.json', type: 'file', icon: FileJson, content: '{\n  "id": "terminal",\n  "name": "Terminal"\n}' },
            ],
          },
        ],
      },
      { name: '.installed', type: 'file', icon: FileText, content: 'PyOS installation marker. Do not delete.' },
    ],
  },
];

export default function Files({ windowId: _windowId }: AppProps) {
  void _windowId;
  const [path, setPath] = useState<string[]>(['home']);
  const [selected, setSelected] = useState<FsNode | null>(null);
  const [search, setSearch] = useState('');

  const navigateTo = (parts: string[]) => {
    setPath(parts);
    setSelected(null);
  };

  const getCurrentNodes = (): FsNode[] => {
    let nodes: FsNode[] = FS;
    for (let i = 1; i < path.length; i++) {
      const found = nodes.find((n) => n.name === path[i] && n.type === 'folder');
      if (found?.children) nodes = found.children;
      else return [];
    }
    return nodes;
  };

  const currentNodes = getCurrentNodes();
  const filtered = search
    ? currentNodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
    : currentNodes;

  return (
    <div className="w-full h-full flex" style={{ background: 'rgba(7,6,26,0.4)' }}>
      {/* Sidebar */}
      <div className="w-44 flex-shrink-0 p-3 border-r border-white/10">
        <p className="text-[10px] uppercase tracking-wider text-[var(--pyos-text-dim)] mb-2 px-2">
          Locations
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => navigateTo(['home'])}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
              path.length === 1 ? 'bg-white/8' : 'hover:bg-white/5'
            }`}
          >
            <Home size={14} style={{ color: 'var(--pyos-accent)' }} />
            Home
          </button>
          {FS[0].children?.map((child) => (
            <button
              key={child.name}
              onClick={() => navigateTo(['home', child.name])}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                path[1] === child.name ? 'bg-white/8' : 'hover:bg-white/5'
              }`}
            >
              <Folder size={14} style={{ color: 'var(--pyos-text-dim)' }} />
              {child.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-white/10">
          <button
            onClick={() => path.length > 1 && navigateTo(path.slice(0, -1))}
            disabled={path.length <= 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/8 disabled:opacity-30 transition-colors"
          >
            <ArrowBack size={14} />
          </button>
          <div className="flex items-center gap-1 text-xs font-mono">
            {path.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} style={{ color: 'var(--pyos-text-dim)' }} />}
                <button
                  onClick={() => navigateTo(path.slice(0, i + 1))}
                  className="hover:text-[var(--pyos-accent)] transition-colors"
                >
                  {p}
                </button>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5">
            <Search size={12} style={{ color: 'var(--pyos-text-dim)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..."
              className="bg-transparent text-xs outline-none w-24"
              style={{ color: 'var(--pyos-text)' }}
            />
          </div>
        </div>

        {/* File grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
            {filtered.map((node) => (
              <button
                key={node.name}
                onClick={() => setSelected(node)}
                onDoubleClick={() => {
                  if (node.type === 'folder') navigateTo([...path, node.name]);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  selected?.name === node.name ? 'bg-white/8 neon-border' : 'hover:bg-white/5'
                }`}
              >
                <node.icon
                  size={28}
                  style={{ color: node.type === 'folder' ? 'var(--pyos-accent)' : 'var(--pyos-text-dim)' }}
                />
                <span className="text-[10px] text-center truncate w-full">{node.name}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-full text-xs text-[var(--pyos-text-dim)]">
              No items found
            </div>
          )}
        </div>

        {/* Preview panel */}
        {selected?.type === 'file' && selected.content && (
          <div className="border-t border-white/10 p-3 max-h-40 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wider text-[var(--pyos-text-dim)] mb-1">
              {selected.name}
            </p>
            <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--pyos-text)]">
              {selected.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowBack({ size }: { size: number }) {
  return <ArrowLeft size={size} />;
}
