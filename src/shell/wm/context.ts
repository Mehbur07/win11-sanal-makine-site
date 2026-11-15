import { createContext, useContext, type RefObject } from 'react';
import type { AppArgs, AppId } from '../../apps/types.ts';
import type { DeviceMode } from '../device.ts';
import type { Rect, Size, Snap } from './geometry.ts';
import type { WinState } from './reducer.ts';

export interface WMValue {
  mode: DeviceMode;
  windows: WinState[];
  focusedId: string | null;
  /** Pencerelerin yerleşebildiği alan (ekran eksi panel) */
  bounds: Size;
  setBounds: (size: Size) => void;
  layerRef: RefObject<HTMLDivElement | null>;
  /** Sürüklerken gösterilen yaslama önizlemesi */
  preview: Snap;
  setPreview: (snap: Snap) => void;
  open: (appId: AppId, args?: AppArgs) => void;
  /** Panel düğmesi davranışı: aç / öne getir / küçült */
  activate: (appId: AppId) => void;
  /** Hemen kapatır */
  close: (id: string) => void;
  /** Kaydedilmemiş değişiklik varsa önce sorar */
  requestClose: (id: string) => void;
  cancelClose: (id: string) => void;
  setTitle: (id: string, title: string | undefined) => void;
  setDirty: (id: string, dirty: boolean) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMax: (id: string) => void;
  snap: (id: string, snap: Snap) => void;
  move: (id: string, x: number, y: number) => void;
  setRect: (id: string, rect: Rect) => void;
  minimizeAll: () => void;
}

export const WMContext = createContext<WMValue | null>(null);

export function useWM(): WMValue {
  const value = useContext(WMContext);
  if (!value) throw new Error('useWM, WindowManagerProvider içinde kullanılmalı');
  return value;
}
