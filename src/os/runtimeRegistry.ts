import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createElement,
  type ComponentType,
} from 'react';
import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { THEMES, type PyOSTheme } from './themes';
import type { AppManifest, AppProps } from './types';
import { getLucideIcon } from './appRegistry';
import type { OSApi, AppPermission } from './osApi';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CustomApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  code: string;
  permissions?: AppPermission[];
}

let customThemesCache: PyOSTheme[] = [];
let customAppsCache: CustomApp[] = [];
let currentUserId: string | null = null;
const listeners: (() => void)[] = [];

export function setCurrentUser(userId: string | null): void {
  currentUserId = userId;
}

export function getCustomThemes(): PyOSTheme[] {
  return customThemesCache;
}

export function getCustomApps(): CustomApp[] {
  return customAppsCache;
}

export function getAllThemes(): PyOSTheme[] {
  return [...THEMES, ...customThemesCache];
}

export function findTheme(id: string): PyOSTheme | undefined {
  return getAllThemes().find((t) => t.id === id);
}

export function subscribeChanges(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notify() {
  listeners.forEach((cb) => cb());
}

export async function loadCustomData(): Promise<void> {
  const { data: themes } = await supabase
    .from('custom_themes')
    .select('*')
    .order('created_at', { ascending: false });
  if (themes) {
    customThemesCache = themes
      .map((row: Record<string, unknown>) => row.theme_data as PyOSTheme)
      .filter((t) => t !== null);
  }

  const { data: apps } = await supabase
    .from('custom_apps')
    .select('*')
    .order('created_at', { ascending: false });
  if (apps) {
    customAppsCache = apps.map((row: Record<string, unknown>) => ({
      id: row.app_id as string,
      name: row.name as string,
      description: row.description as string,
      icon: (row.icon_name as string) ?? 'Sparkles',
      code: row.code as string,
      permissions: (row.permissions as AppPermission[]) ?? parsePermissionsFromCode(row.code as string),
    }));
  }

  notify();
}

export async function addCustomTheme(themeData: PyOSTheme, ownerId?: string): Promise<void> {
  await supabase.from('custom_themes').upsert({
    theme_id: themeData.id,
    name: themeData.name,
    theme_data: themeData,
    owner_id: ownerId ?? currentUserId,
  });
  customThemesCache = [
    themeData,
    ...customThemesCache.filter((t) => t.id !== themeData.id),
  ];
  notify();
}

export async function addCustomApp(app: CustomApp, ownerId?: string): Promise<void> {
  const permissions = app.permissions ?? parsePermissionsFromCode(app.code);
  const owner = ownerId ?? currentUserId;
  await supabase.from('custom_apps').upsert({
    app_id: app.id,
    name: app.name,
    description: app.description,
    icon_name: app.icon,
    code: app.code,
    permissions,
    owner_id: owner,
  });
  customAppsCache = [{ ...app, permissions }, ...customAppsCache.filter((a) => a.id !== app.id)];
  notify();
}

export async function deleteCustomTheme(themeId: string): Promise<void> {
  await supabase.from('custom_themes').delete().eq('theme_id', themeId);
  customThemesCache = customThemesCache.filter((t) => t.id !== themeId);
  notify();
}

export async function deleteCustomApp(appId: string): Promise<void> {
  await supabase.from('custom_apps').delete().eq('app_id', appId);
  customAppsCache = customAppsCache.filter((a) => a.id !== appId);
  notify();
}

export function useRuntimeData() {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const unsub = subscribeChanges(rerender);
    return unsub;
  }, [rerender]);

  return {
    customThemes: customThemesCache,
    customApps: customAppsCache,
    allThemes: getAllThemes(),
  };
}

export function buildCustomAppManifests(): AppManifest[] {
  return customAppsCache.map((app) => ({
    id: `custom-${app.id}`,
    name: app.name,
    icon: getLucideIcon(app.icon),
    component: createRuntimeComponent(app.code, app.id),
    defaultSize: { width: 640, height: 480 },
    minSize: { width: 320, height: 240 },
    permissions: app.permissions ?? parsePermissionsFromCode(app.code),
  }));
}

const VALID_PERMISSIONS: AppPermission[] = [
  'system:settings', 'system:files', 'system:windows',
  'system:themes', 'system:shortcuts', 'system:boot',
];

export function parsePermissionsFromCode(code: string): AppPermission[] {
  const found: AppPermission[] = [];
  for (const p of VALID_PERMISSIONS) {
    if (code.includes(p)) found.push(p);
  }
  return found;
}

let currentOsApi: OSApi | null = null;

export function setOSApi(api: OSApi): void {
  currentOsApi = api;
}

export function getOSApi(): OSApi | undefined {
  return currentOsApi ?? undefined;
}

const transpileCache = new Map<string, string>();

async function transpileComponent(code: string): Promise<string> {
  const cached = transpileCache.get(code);
  if (cached) return cached;

  const mod = await import('@babel/standalone');
  const Babel = (mod as unknown as { default?: typeof mod; transform?: (code: string, options?: Record<string, unknown>) => { code: string } }).default ?? (mod as unknown as { transform: (code: string, options?: Record<string, unknown>) => { code: string } });
  const transformed = Babel.transform(code, {
    presets: [
      ['typescript'],
      ['react', { runtime: 'classic' }],
      ['env', { modules: 'commonjs', targets: { esmodules: true } }],
    ],
    filename: 'app.tsx',
  }).code ?? '';

  transpileCache.set(code, transformed);
  return transformed;
}

function createRuntimeComponent(
  code: string,
  appId: string
): ComponentType<AppProps> {
  return function RuntimeApp(props: AppProps) {
    const [error, setError] = useState<string | null>(null);
    const [Comp, setComp] = useState<ComponentType<AppProps> | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
      mountedRef.current = true;
      let cancelled = false;

      (async () => {
        try {
          const transformed = await transpileComponent(code);

          const requireFn = (mod: string): unknown => {
            if (mod === 'react') return React;
            if (mod === 'lucide-react') return LucideIcons;
            throw new Error(`Module "${mod}" is not available in the runtime sandbox`);
          };

          const factory = new Function(
            'require',
            'exports',
            'module',
            'useState',
            'useEffect',
            'useRef',
            'useCallback',
            'useMemo',
            'useReducer',
            'useContext',
            'useLayoutEffect',
            'createElement',
            'osApi',
            'windowId',
            transformed + '\nreturn typeof exports.default !== "undefined" ? exports.default : (typeof module.exports !== "undefined" && module.exports.default ? module.exports.default : module.exports);\n'
          );

          const moduleObj = { exports: {} as Record<string, unknown> };
          const result = factory(
            requireFn,
            moduleObj.exports,
            moduleObj,
            React.useState,
            React.useEffect,
            React.useRef,
            React.useCallback,
            React.useMemo,
            React.useReducer,
            React.useContext,
            React.useLayoutEffect,
            React.createElement,
            currentOsApi,
            props.windowId
          );

          const Component = (result ?? moduleObj.exports.default ?? moduleObj.exports) as ComponentType<AppProps>;
          if (typeof Component !== 'function') {
            throw new Error('App code must export a React component as default');
          }
          if (mountedRef.current && !cancelled) {
            setComp(() => Component);
            setError(null);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (mountedRef.current && !cancelled) setError(msg);
        }
      })();

      return () => { mountedRef.current = false; cancelled = true; };
    }, [code, props.windowId]);

    if (error) {
      return createElement('div', {
        className: 'w-full h-full overflow-auto p-4',
        style: { color: 'var(--pyos-text)' },
        children: [
          createElement('div', {
            key: 'err',
            className: 'glass-panel p-4 rounded-xl text-sm',
            style: { color: '#ff5577', border: '1px solid rgba(255,85,119,0.3)' },
            children: `Runtime Error in "${appId}":\n\n${error}`,
          }),
        ],
      });
    }

    if (!Comp) {
      return createElement('div', {
        className: 'w-full h-full flex items-center justify-center',
        style: { color: 'var(--pyos-text-dim)' },
        children: createElement('div', {
          className: 'text-xs animate-pulse',
          children: `Loading "${appId}"...`,
        }),
      });
    }

    return createElement(Comp, props);
  };
}
