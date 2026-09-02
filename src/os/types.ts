import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { OSApi, AppPermission } from './osApi';

export interface AppManifest {
  id: string;
  name: string;
  icon: LucideIcon;
  component: ComponentType<AppProps>;
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  singleton?: boolean;
  permissions?: AppPermission[];
}

export interface AppProps {
  windowId: string;
  osApi?: OSApi;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
  prevRect?: { x: number; y: number; width: number; height: number };
  opening?: boolean;
  closing?: boolean;
  restoring?: boolean;
}
