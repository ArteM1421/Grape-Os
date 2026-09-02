import { useRef, useCallback, useState } from 'react';
import type { WindowInstance, AppManifest, AppProps } from './types';
import { WINDOW_LAYOUTS, zoneToPixels, type WindowLayout } from './windowLayouts';

let idCounter = 0;
const nextId = () => `win-${++idCounter}`;

export interface WindowManagerState {
  windows: WindowInstance[];
  zTop: number;
}

export function useWindowManager(apps: AppManifest[]) {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [zTop, setZTop] = useState(10);
  const [activeLayout, setActiveLayout] = useState<WindowLayout | null>(null);
  const stateRef = useRef({ windows, zTop });
  stateRef.current = { windows, zTop };

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const top = stateRef.current.zTop + 1;
      setZTop(top);
      return prev.map((w) =>
        w.id === id
          ? { ...w, zIndex: top, focused: true, minimized: false }
          : { ...w, focused: false }
      );
    });
  }, []);

  const openApp = useCallback(
    (appId: string) => {
      const manifest = apps.find((a) => a.id === appId);
      if (!manifest) return;

      if (manifest.singleton) {
        const existing = stateRef.current.windows.find((w) => w.appId === appId);
        if (existing) {
          focusWindow(existing.id);
          return;
        }
      }

      const id = nextId();
      const top = stateRef.current.zTop + 1;
      setZTop(top);

      const dw = manifest.defaultSize?.width ?? 640;
      const dh = manifest.defaultSize?.height ?? 440;
      const maxW = window.innerWidth - 80;
      const maxH = window.innerHeight - 140;

      const width = Math.min(dw, maxW);
      const height = Math.min(dh, maxH);
      const x = Math.max(20, Math.round((window.innerWidth - width) / 2) + (Math.random() * 60 - 30));
      const y = Math.max(20, Math.round((window.innerHeight - height) / 2 - 30) + (Math.random() * 40 - 20));

      const win: WindowInstance = {
        id,
        appId,
        title: manifest.name,
        x,
        y,
        width,
        height,
        zIndex: top,
        minimized: false,
        maximized: false,
        focused: true,
        opening: true,
      };

      setWindows((prev) => [...prev.map((w) => ({ ...w, focused: false })), win]);

      window.setTimeout(() => {
        setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, opening: false } : w)));
      }, 300);
    },
    [apps, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, closing: true } : w)));
    window.setTimeout(() => {
      setWindows((prev) => prev.filter((w) => w.id !== id));
    }, 200);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true, focused: false } : w))
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const top = stateRef.current.zTop + 1;
      setZTop(top);
      return prev.map((w) =>
        w.id === id
          ? { ...w, minimized: false, focused: true, restoring: true, zIndex: top }
          : { ...w, focused: false }
      );
    });
    window.setTimeout(() => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, restoring: false } : w)));
    }, 300);
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          const r = w.prevRect ?? { x: 80, y: 60, width: 640, height: 440 };
          return { ...w, maximized: false, ...r };
        }
        return {
          ...w,
          maximized: true,
          prevRect: { x: w.x, y: w.y, width: w.width, height: w.height },
        };
      })
    );
  }, []);

  const updateWindowRect = useCallback(
    (id: string, rect: Partial<Pick<WindowInstance, 'x' | 'y' | 'width' | 'height'>>) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...rect } : w))
      );
    },
    []
  );

  const snapWindow = useCallback(
    (id: string, zone: 'left' | 'right' | 'top') => {
      const taskbarH = 64;
      const topbarH = 0;
      const availH = window.innerHeight - taskbarH - topbarH;
      const availW = window.innerWidth;

      if (zone === 'top') {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  maximized: true,
                  prevRect: { x: w.x, y: w.y, width: w.width, height: w.height },
                }
              : w
          )
        );
        return;
      }

      const halfW = Math.round(availW / 2);
      const rect =
        zone === 'left'
          ? { x: 0, y: topbarH, width: halfW, height: availH }
          : { x: halfW, y: topbarH, width: availW - halfW, height: availH };

      setWindows((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, ...rect, maximized: false, prevRect: { x: w.x, y: w.y, width: w.width, height: w.height } }
            : w
        )
      );
    },
    []
  );

  const applyLayout = useCallback((layout: WindowLayout) => {
    const taskbarH = 64;
    const availW = window.innerWidth;
    const availH = window.innerHeight - taskbarH;
    const visible = stateRef.current.windows.filter((w) => !w.closing);
    const toArrange = visible.slice(0, layout.windowCount);

    setWindows((prev) =>
      prev.map((w, idx) => {
        const zoneIdx = toArrange.findIndex((tw) => tw.id === w.id);
        if (zoneIdx === -1 || zoneIdx >= layout.zones.length) return w;
        const px = zoneToPixels(layout.zones[zoneIdx], availW, availH);
        return {
          ...w,
          x: px.x,
          y: px.y,
          width: px.width,
          height: px.height,
          maximized: false,
          prevRect: { x: w.x, y: w.y, width: w.width, height: w.height },
        };
      })
    );
    setActiveLayout(layout);
  }, []);

  const setTitle = useCallback((id: string, title: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, title } : w)));
  }, []);

  return {
    windows,
    zTop,
    openApp,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    updateWindowRect,
    snapWindow,
    focusWindow,
    setTitle,
    applyLayout,
    activeLayout,
    availableLayouts: WINDOW_LAYOUTS,
  };
}

export type WindowManager = ReturnType<typeof useWindowManager>;

export function renderApp(
  manifest: AppManifest | undefined,
  props: AppProps
) {
  if (!manifest) return null;
  const Cmp = manifest.component;
  return <Cmp {...props} />;
}
