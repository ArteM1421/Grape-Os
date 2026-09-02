export interface LayoutZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowLayout {
  id: string;
  name: string;
  windowCount: number;
  zones: LayoutZone[];
}

export const WINDOW_LAYOUTS: WindowLayout[] = [
  // 2-window layouts (10)
  { id: '2-1', name: 'Split L/R 50/50', windowCount: 2, zones: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  { id: '2-2', name: 'Split T/B 50/50', windowCount: 2, zones: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
  { id: '2-3', name: 'Left 33 / Right 67', windowCount: 2, zones: [{ x: 0, y: 0, w: 0.33, h: 1 }, { x: 0.33, y: 0, w: 0.67, h: 1 }] },
  { id: '2-4', name: 'Left 67 / Right 33', windowCount: 2, zones: [{ x: 0, y: 0, w: 0.67, h: 1 }, { x: 0.67, y: 0, w: 0.33, h: 1 }] },
  { id: '2-5', name: 'Left 25 / Right 75', windowCount: 2, zones: [{ x: 0, y: 0, w: 0.25, h: 1 }, { x: 0.25, y: 0, w: 0.75, h: 1 }] },
  { id: '2-6', name: 'Left 75 / Right 25', windowCount: 2, zones: [{ x: 0, y: 0, w: 0.75, h: 1 }, { x: 0.75, y: 0, w: 0.25, h: 1 }] },
  { id: '2-7', name: 'Top 33 / Bottom 67', windowCount: 2, zones: [{ x: 0, y: 0, w: 1, h: 0.33 }, { x: 0, y: 0.33, w: 1, h: 0.67 }] },
  { id: '2-8', name: 'Top 67 / Bottom 33', windowCount: 2, zones: [{ x: 0, y: 0, w: 1, h: 0.67 }, { x: 0, y: 0.67, w: 1, h: 0.33 }] },
  { id: '2-9', name: 'Left 40 / Right 60', windowCount: 2, zones: [{ x: 0, y: 0, w: 0.4, h: 1 }, { x: 0.4, y: 0, w: 0.6, h: 1 }] },
  { id: '2-10', name: 'Left 60 / Right 40', windowCount: 2, zones: [{ x: 0, y: 0, w: 0.6, h: 1 }, { x: 0.6, y: 0, w: 0.4, h: 1 }] },

  // 3-window layouts (8)
  { id: '3-1', name: 'Three Columns', windowCount: 3, zones: [{ x: 0, y: 0, w: 0.33, h: 1 }, { x: 0.33, y: 0, w: 0.34, h: 1 }, { x: 0.67, y: 0, w: 0.33, h: 1 }] },
  { id: '3-2', name: 'Left + Right Split', windowCount: 3, zones: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
  { id: '3-3', name: 'Left Split + Right', windowCount: 3, zones: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  { id: '3-4', name: 'Top + Bottom Split', windowCount: 3, zones: [{ x: 0, y: 0, w: 1, h: 0.33 }, { x: 0, y: 0.33, w: 0.5, h: 0.67 }, { x: 0.5, y: 0.33, w: 0.5, h: 0.67 }] },
  { id: '3-5', name: 'Bottom + Top Split', windowCount: 3, zones: [{ x: 0, y: 0, w: 0.5, h: 0.67 }, { x: 0.5, y: 0, w: 0.5, h: 0.67 }, { x: 0, y: 0.67, w: 1, h: 0.33 }] },
  { id: '3-6', name: 'Left 50 / Center 25 / Right 25', windowCount: 3, zones: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.25, h: 1 }, { x: 0.75, y: 0, w: 0.25, h: 1 }] },
  { id: '3-7', name: 'Left 25 / Center 25 / Right 50', windowCount: 3, zones: [{ x: 0, y: 0, w: 0.25, h: 1 }, { x: 0.25, y: 0, w: 0.25, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  { id: '3-8', name: 'Left 40 / Center 30 / Right 30', windowCount: 3, zones: [{ x: 0, y: 0, w: 0.4, h: 1 }, { x: 0.4, y: 0, w: 0.3, h: 1 }, { x: 0.7, y: 0, w: 0.3, h: 1 }] },

  // 4-window layouts (7)
  { id: '4-1', name: '2x2 Grid', windowCount: 4, zones: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
  { id: '4-2', name: 'Four Columns', windowCount: 4, zones: [{ x: 0, y: 0, w: 0.25, h: 1 }, { x: 0.25, y: 0, w: 0.25, h: 1 }, { x: 0.5, y: 0, w: 0.25, h: 1 }, { x: 0.75, y: 0, w: 0.25, h: 1 }] },
  { id: '4-3', name: 'Four Rows', windowCount: 4, zones: [{ x: 0, y: 0, w: 1, h: 0.25 }, { x: 0, y: 0.25, w: 1, h: 0.25 }, { x: 0, y: 0.5, w: 1, h: 0.25 }, { x: 0, y: 0.75, w: 1, h: 0.25 }] },
  { id: '4-4', name: 'Left 50 + Right 3 Rows', windowCount: 4, zones: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 0.33 }, { x: 0.5, y: 0.33, w: 0.5, h: 0.34 }, { x: 0.5, y: 0.67, w: 0.5, h: 0.33 }] },
  { id: '4-5', name: 'Top 50 + Bottom 3 Cols', windowCount: 4, zones: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 0.33, h: 0.5 }, { x: 0.33, y: 0.5, w: 0.34, h: 0.5 }, { x: 0.67, y: 0.5, w: 0.33, h: 0.5 }] },
  { id: '4-6', name: 'Left 40 + Right 2x2', windowCount: 4, zones: [{ x: 0, y: 0, w: 0.4, h: 1 }, { x: 0.4, y: 0, w: 0.3, h: 0.5 }, { x: 0.7, y: 0, w: 0.3, h: 0.5 }, { x: 0.4, y: 0.5, w: 0.6, h: 0.5 }] },
  { id: '4-7', name: 'Four Quarters', windowCount: 4, zones: [{ x: 0, y: 0, w: 0.25, h: 1 }, { x: 0.25, y: 0, w: 0.25, h: 1 }, { x: 0.5, y: 0, w: 0.25, h: 1 }, { x: 0.75, y: 0, w: 0.25, h: 1 }] },
];

export function getLayoutsForCount(count: number): WindowLayout[] {
  return WINDOW_LAYOUTS.filter((l) => l.windowCount === count);
}

export function zoneToPixels(zone: LayoutZone, availW: number, availH: number) {
  return {
    x: Math.round(zone.x * availW),
    y: Math.round(zone.y * availH),
    width: Math.round(zone.w * availW),
    height: Math.round(zone.h * availH),
  };
}
