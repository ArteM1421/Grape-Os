import type { WindowManager } from './useWindowManager';
import type { PyOSTheme } from './themes';

export type AppPermission =
  | 'system:settings'
  | 'system:files'
  | 'system:windows'
  | 'system:themes'
  | 'system:shortcuts'
  | 'system:boot';

export interface OSApi {
  windows: {
    open: (appId: string) => void;
    close: (windowId: string) => void;
    minimize: (windowId: string) => void;
    focus: (windowId: string) => void;
    list: () => { id: string; appId: string; title: string; minimized: boolean }[];
    setTitle: (windowId: string, title: string) => void;
  };
  theme: {
    get: () => PyOSTheme | undefined;
    set: (themeId: string) => void;
    list: () => PyOSTheme[];
  };
  settings: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
  };
  apps: {
    list: () => { id: string; name: string }[];
    open: (appId: string) => void;
  };
  storage: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
  };
}

export function createOSApi(wm: WindowManager, themeId: string): OSApi {
  return {
    windows: {
      open: (appId: string) => wm.openApp(appId),
      close: (windowId: string) => wm.closeWindow(windowId),
      minimize: (windowId: string) => wm.minimizeWindow(windowId),
      focus: (windowId: string) => wm.focusWindow(windowId),
      list: () =>
        wm.windows.map((w) => ({
          id: w.id,
          appId: w.appId,
          title: w.title,
          minimized: w.minimized,
        })),
      setTitle: (windowId: string, title: string) => wm.setTitle(windowId, title),
    },
    theme: {
      get: () => {
        const themes = JSON.parse(localStorage.getItem('pyos-all-themes') ?? '[]') as PyOSTheme[];
        return themes.find((t) => t.id === themeId);
      },
      set: (themeId: string) => {
        localStorage.setItem('pyos-theme', themeId);
        window.dispatchEvent(new Event('vingrape-settings-change'));
      },
      list: () => {
        try {
          return JSON.parse(localStorage.getItem('pyos-all-themes') ?? '[]') as PyOSTheme[];
        } catch {
          return [];
        }
      },
    },
    settings: {
      get: (key: string) => localStorage.getItem(key),
      set: (key: string, value: string) => {
        localStorage.setItem(key, value);
        window.dispatchEvent(new Event('vingrape-settings-change'));
      },
      remove: (key: string) => {
        localStorage.removeItem(key);
        window.dispatchEvent(new Event('vingrape-settings-change'));
      },
    },
    apps: {
      list: () => {
        try {
          const renames = JSON.parse(
            localStorage.getItem('vingrape-app-renames') ?? '{}'
          ) as Record<string, string>;
          const base = ['ai', 'browser', 'vinmarket', 'codestudio', 'terminal', 'files', 'editor', 'monitor', 'settings'];
          return base.map((id) => ({ id, name: renames[id] ?? id }));
        } catch {
          return [];
        }
      },
      open: (appId: string) => wm.openApp(appId),
    },
    storage: {
      get: (key: string) => localStorage.getItem(key),
      set: (key: string, value: string) => localStorage.setItem(key, value),
      remove: (key: string) => localStorage.removeItem(key),
    },
  };
}

export const PERMISSION_LABELS: Record<AppPermission, { label: string; desc: string }> = {
  'system:settings': { label: 'System Settings', desc: 'Read and modify OS settings, preferences, and configuration' },
  'system:files': { label: 'System Files', desc: 'Create, modify, and delete system files and shortcuts' },
  'system:windows': { label: 'Window Manager', desc: 'Open, close, and manage other application windows' },
  'system:themes': { label: 'Theme Engine', desc: 'Change the desktop theme and appearance settings' },
  'system:shortcuts': { label: 'Desktop Shortcuts', desc: 'Add, remove, and rearrange desktop icons and shortcuts' },
  'system:boot': { label: 'Boot System', desc: 'Modify boot configuration, BIOS settings, and recovery options' },
};
