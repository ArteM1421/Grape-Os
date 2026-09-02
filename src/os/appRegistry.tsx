import {
  Terminal as TerminalIcon,
  Atom,
  Settings as SettingsIcon,
  FolderOpen,
  FileText,
  Activity,
  Sparkles,
  Globe,
  Code2,
  Store,
  Code2 as CodeStudioIcon,
  type LucideIcon,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { AppManifest, AppProps } from './types';
import Terminal from '../apps/Terminal';
import MarketEntropy from '../apps/MarketEntropy';
import SettingsApp from '../apps/Settings';
import Files from '../apps/Files';
import Editor from '../apps/Editor';
import SystemMonitor from '../apps/SystemMonitor';
import AIApp from '../apps/AIApp';
import Browser from '../apps/Browser';
import DevTools from '../apps/DevTools';
import VinMarket from '../apps/VinMarket';
import CodeStudio from '../apps/CodeStudio';

export interface AppContext {
  currentThemeId: string;
  onThemeChange: (id: string) => void;
  onThemeCreated?: (theme: Record<string, unknown>) => void;
  onAppCreated?: (app: Record<string, unknown>) => void;
}

let ctx: AppContext = {
  currentThemeId: 'vingrape',
  onThemeChange: () => {},
};

export function setAppContext(context: AppContext) {
  ctx = context;
}

function SettingsWrapper(props: AppProps) {
  return <SettingsApp {...props} currentThemeId={ctx.currentThemeId} onThemeChange={ctx.onThemeChange} />;
}

function AIWrapper(props: AppProps) {
  return <AIApp {...props} onThemeCreated={ctx.onThemeCreated} onAppCreated={ctx.onAppCreated} />;
}

function DevToolsWrapper(props: AppProps) {
  return <DevTools {...props} currentThemeId={ctx.currentThemeId} onThemeChange={ctx.onThemeChange} />;
}

export function getLucideIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? Sparkles;
}

export function getAllApps(): AppManifest[] {
  const renames = (() => { try { return JSON.parse(localStorage.getItem('vingrape-app-renames') ?? '{}') as Record<string, string>; } catch { return {}; } })();
  return APPS.map((app) => renames[app.id] ? { ...app, name: renames[app.id] } : app);
}

export const APPS: AppManifest[] = [
  {
    id: 'ai',
    name: 'VinGrape AI',
    icon: Sparkles,
    component: AIWrapper,
    defaultSize: { width: 560, height: 600 },
    minSize: { width: 360, height: 400 },
    singleton: true,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: TerminalIcon,
    component: Terminal,
    defaultSize: { width: 620, height: 420 },
    minSize: { width: 360, height: 240 },
  },
  {
    id: 'marketentropy',
    name: 'Market Entropy',
    icon: Atom,
    component: MarketEntropy,
    defaultSize: { width: 720, height: 520 },
    minSize: { width: 360, height: 280 },
  },
  {
    id: 'files',
    name: 'File Explorer',
    icon: FolderOpen,
    component: Files,
    defaultSize: { width: 680, height: 460 },
    minSize: { width: 400, height: 280 },
  },
  {
    id: 'editor',
    name: 'Text Editor',
    icon: FileText,
    component: Editor,
    defaultSize: { width: 640, height: 480 },
    minSize: { width: 320, height: 240 },
  },
  {
    id: 'monitor',
    name: 'System Monitor',
    icon: Activity,
    component: SystemMonitor,
    defaultSize: { width: 520, height: 560 },
    minSize: { width: 340, height: 360 },
  },
  {
    id: 'browser',
    name: 'Browser',
    icon: Globe,
    component: Browser,
    defaultSize: { width: 800, height: 560 },
    minSize: { width: 400, height: 300 },
  },
  {
    id: 'vinmarket',
    name: 'Vin Market',
    icon: Store,
    component: VinMarket,
    defaultSize: { width: 720, height: 560 },
    minSize: { width: 420, height: 360 },
    singleton: true,
  },
  {
    id: 'codestudio',
    name: 'Code Studio',
    icon: CodeStudioIcon,
    component: CodeStudio,
    defaultSize: { width: 860, height: 600 },
    minSize: { width: 560, height: 400 },
  },
  {
    id: 'devtools',
    name: 'Dev Tools',
    icon: Code2,
    component: DevToolsWrapper,
    defaultSize: { width: 900, height: 620 },
    minSize: { width: 620, height: 420 },
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: SettingsIcon,
    component: SettingsWrapper,
    defaultSize: { width: 680, height: 500 },
    minSize: { width: 420, height: 320 },
    singleton: true,
  },
];
