import { useRef, useCallback, useEffect, useState } from 'react';
import { Minus, Square, X, Copy, LayoutGrid } from 'lucide-react';
import type { WindowInstance, AppManifest, AppProps } from './types';
import type { WindowManager } from './useWindowManager';
import { WINDOW_LAYOUTS, type WindowLayout } from './windowLayouts';
import { getOSApi } from './runtimeRegistry';

interface WindowFrameProps {
  win: WindowInstance;
  manifest: AppManifest;
  wm: WindowManager;
  taskbarHeight: number;
}

type DragState =
  | { type: 'move'; startX: number; startY: number; origX: number; origY: number }
  | {
      type: 'resize';
      edge: string;
      startX: number;
      startY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
    }
  | null;

export default function WindowFrame({ win, manifest, wm, taskbarHeight }: WindowFrameProps) {
  const dragRef = useRef<DragState>(null);
  const [snapHint, setSnapHint] = useState<'left' | 'right' | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  const onTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (win.maximized) return;
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      wm.focusWindow(win.id);
      dragRef.current = {
        type: 'move',
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
      };
    },
    [win, wm]
  );

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, edge: string) => {
      e.preventDefault();
      e.stopPropagation();
      wm.focusWindow(win.id);
      dragRef.current = {
        type: 'resize',
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
        origW: win.width,
        origH: win.height,
      };
    },
    [win, wm]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const minW = manifest.minSize?.width ?? 280;
      const minH = manifest.minSize?.height ?? 200;

      if (drag.type === 'move') {
        const nx = Math.max(0, Math.min(window.innerWidth - 60, drag.origX + dx));
        const ny = Math.max(0, Math.min(window.innerHeight - taskbarHeight - 30, drag.origY + dy));
        wm.updateWindowRect(win.id, { x: nx, y: ny });

        if (e.clientY <= 4) {
          setSnapHint(null);
        } else if (e.clientX <= 6) {
          setSnapHint('left');
        } else if (e.clientX >= window.innerWidth - 6) {
          setSnapHint('right');
        } else {
          setSnapHint(null);
        }
      } else if (drag.type === 'resize') {
        let { origX: nx, origY: ny, origW: nw, origH: nh } = drag;
        const edge = drag.edge;
        if (edge.includes('e')) nw = Math.max(minW, drag.origW + dx);
        if (edge.includes('s')) nh = Math.max(minH, drag.origH + dy);
        if (edge.includes('w')) {
          nw = Math.max(minW, drag.origW - dx);
          nx = drag.origX + (drag.origW - nw);
        }
        if (edge.includes('n')) {
          nh = Math.max(minH, drag.origH - dy);
          ny = Math.max(0, drag.origY + (drag.origH - nh));
        }
        wm.updateWindowRect(win.id, { x: nx, y: ny, width: nw, height: nh });
      }
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (drag?.type === 'move') {
        if (snapHint === 'left') wm.snapWindow(win.id, 'left');
        else if (snapHint === 'right') wm.snapWindow(win.id, 'right');
        setSnapHint(null);
      }
      dragRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [win.id, win.x, win.y, win.width, win.height, snapHint, wm, taskbarHeight, manifest.minSize]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) {
        setLayoutOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const handleTitleDoubleClick = () => wm.toggleMaximize(win.id);

  if (win.minimized || win.closing) return null;

  const isMax = win.maximized;
  const style: React.CSSProperties = isMax
    ? {
        left: 0,
        top: 0,
        width: '100vw',
        height: `calc(100vh - ${taskbarHeight}px)`,
        zIndex: win.zIndex,
        borderRadius: 0,
      }
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      };

  const appProps: AppProps = { windowId: win.id, osApi: getOSApi() };

  const openCount = wm.windows.filter((w) => !w.minimized && !w.closing).length;
  const visibleLayouts = WINDOW_LAYOUTS.filter((l) => l.windowCount <= Math.max(2, openCount));

  const animClass = win.opening
    ? 'animate-win-open'
    : win.restoring
    ? 'animate-win-restore'
    : '';

  return (
    <>
      {snapHint && (
        <div
          className="fixed top-0 bottom-0 z-[9998] pointer-events-none transition-all duration-150"
          style={{
            left: snapHint === 'left' ? 0 : '50%',
            width: '50%',
            background: 'rgba(0,255,157,0.08)',
            border: `1px solid rgba(0,255,157,0.3)`,
            borderRadius: 0,
            bottom: taskbarHeight,
          }}
        />
      )}

      <div
        ref={frameRef}
        className={`absolute glass-panel flex flex-col overflow-hidden ${animClass} ${
          win.focused ? 'neon-border' : ''
        } ${isMax ? '' : 'shadow-2xl'}`}
        style={{
          ...style,
          boxShadow: win.focused
            ? '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,157,0.15)'
            : '0 16px 48px rgba(0,0,0,0.45)',
          transition: dragRef.current ? 'none' : 'left 0.28s cubic-bezier(0.22,1,0.36,1), top 0.28s cubic-bezier(0.22,1,0.36,1), width 0.28s cubic-bezier(0.22,1,0.36,1), height 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s',
        }}
        onMouseDown={() => wm.focusWindow(win.id)}
      >
        <div
          className="flex items-center justify-between h-9 px-3 select-none flex-shrink-0"
          style={{
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid var(--pyos-glass-border)',
            cursor: isMax ? 'default' : 'grab',
          }}
          onMouseDown={onTitleMouseDown}
          onDoubleClick={handleTitleDoubleClick}
        >
          <div className="flex items-center gap-2 min-w-0">
            <manifest.icon size={14} className="flex-shrink-0" style={{ color: 'var(--pyos-accent)' }} />
            <span className="text-xs font-medium truncate" style={{ color: 'var(--pyos-text)' }}>
              {win.title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {openCount >= 2 && (
              <div ref={layoutRef} className="relative">
                <button
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setLayoutOpen((v) => !v); }}
                  title="Window layouts"
                >
                  <LayoutGrid size={12} style={{ color: 'var(--pyos-text-dim)' }} />
                </button>
                {layoutOpen && (
                  <div className="absolute right-0 top-8 w-64 glass-panel p-2 z-[9500] animate-scale-in" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    <p className="text-[10px] uppercase tracking-wider px-1 mb-1.5" style={{ color: 'var(--pyos-text-dim)' }}>Snap Layouts</p>
                    {visibleLayouts.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={(e) => { e.stopPropagation(); wm.applyLayout(layout); setLayoutOpen(false); }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/8 transition-colors text-left"
                      >
                        <LayoutPreview layout={layout} />
                        <span className="text-[11px]" style={{ color: 'var(--pyos-text)' }}>{layout.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); wm.minimizeWindow(win.id); }}
              title="Minimize"
            >
              <Minus size={13} style={{ color: 'var(--pyos-text-dim)' }} />
            </button>
            <button
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); wm.toggleMaximize(win.id); }}
              title="Maximize"
            >
              {isMax ? <Copy size={11} style={{ color: 'var(--pyos-text-dim)' }} /> : <Square size={11} style={{ color: 'var(--pyos-text-dim)' }} />}
            </button>
            <button
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/30 transition-colors"
              onClick={(e) => { e.stopPropagation(); wm.closeWindow(win.id); }}
              title="Close"
            >
              <X size={13} style={{ color: 'var(--pyos-text-dim)' }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {(() => {
            const Cmp = manifest.component;
            return <Cmp {...appProps} />;
          })()}
        </div>

        {!isMax && (
          <>
            <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize" onMouseDown={(e) => onResizeMouseDown(e, 'n')} />
            <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize" onMouseDown={(e) => onResizeMouseDown(e, 's')} />
            <div className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize" onMouseDown={(e) => onResizeMouseDown(e, 'w')} />
            <div className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize" onMouseDown={(e) => onResizeMouseDown(e, 'e')} />
            <div className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize" onMouseDown={(e) => onResizeMouseDown(e, 'nw')} />
            <div className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize" onMouseDown={(e) => onResizeMouseDown(e, 'ne')} />
            <div className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" onMouseDown={(e) => onResizeMouseDown(e, 'sw')} />
            <div className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" onMouseDown={(e) => onResizeMouseDown(e, 'se')} />
          </>
        )}
      </div>
    </>
  );
}

function LayoutPreview({ layout }: { layout: WindowLayout }) {
  return (
    <div className="w-8 h-6 rounded border flex-shrink-0 relative overflow-hidden" style={{ borderColor: 'var(--pyos-glass-border)', background: 'rgba(255,255,255,0.03)' }}>
      {layout.zones.map((zone, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${zone.x * 100}%`,
            top: `${zone.y * 100}%`,
            width: `${zone.w * 100}%`,
            height: `${zone.h * 100}%`,
            background: i === 0 ? 'var(--pyos-accent)' : 'var(--pyos-accent-2)',
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}
