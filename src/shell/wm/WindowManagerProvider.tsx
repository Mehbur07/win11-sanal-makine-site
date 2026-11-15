import { useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { APPS } from '../../apps/registry.ts';
import type { AppArgs, AppId } from '../../apps/types.ts';
import { METRICS, type DeviceMode } from '../device.ts';
import { WMContext, type WMValue } from './context.ts';
import { cascadeRect, type Size, type Snap } from './geometry.ts';
import { focusedWindow, initialWM, wmReducer } from './reducer.ts';

function initialBounds(mode: DeviceMode): Size {
  return { w: window.innerWidth, h: Math.max(0, window.innerHeight - METRICS[mode].panelH) };
}

export function WindowManagerProvider({
  mode,
  children,
}: {
  mode: DeviceMode;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(wmReducer, initialWM);
  const [bounds, setBounds] = useState<Size>(() => initialBounds(mode));
  const [preview, setPreview] = useState<Snap>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);

  const focused = focusedWindow(state);
  const focusedId = focused?.id ?? null;

  const value = useMemo<WMValue>(() => {
    const open = (appId: AppId, args?: AppArgs) => {
      const app = APPS[appId];
      const rect = cascadeRect(state.windows.length, app.size, bounds);
      dispatch({ type: 'open', appId, rect, single: app.single, args });
    };

    return {
      mode,
      windows: state.windows,
      focusedId,
      bounds,
      setBounds,
      layerRef,
      preview,
      setPreview,
      open,
      activate: (appId) => {
        const own = state.windows.filter((w) => w.appId === appId).sort((a, b) => b.z - a.z);
        const top = own[0];
        if (!top) open(appId);
        else if (top.minimized) dispatch({ type: 'restore', id: top.id });
        else if (top.id === focusedId) dispatch({ type: 'minimize', id: top.id });
        else dispatch({ type: 'focus', id: top.id });
      },
      close: (id) => dispatch({ type: 'close', id }),
      requestClose: (id) => dispatch({ type: 'requestClose', id }),
      cancelClose: (id) => dispatch({ type: 'cancelClose', id }),
      setTitle: (id, title) => dispatch({ type: 'setTitle', id, title }),
      setDirty: (id, dirty) => dispatch({ type: 'setDirty', id, dirty }),
      focus: (id) => dispatch({ type: 'focus', id }),
      minimize: (id) => dispatch({ type: 'minimize', id }),
      restore: (id) => dispatch({ type: 'restore', id }),
      toggleMax: (id) => dispatch({ type: 'toggleMax', id }),
      snap: (id, snap) => dispatch({ type: 'snap', id, snap }),
      move: (id, x, y) => dispatch({ type: 'move', id, x, y }),
      setRect: (id, rect) => dispatch({ type: 'setRect', id, rect }),
      minimizeAll: () => dispatch({ type: 'minimizeAll' }),
    };
  }, [mode, state.windows, focusedId, bounds, preview]);

  return <WMContext.Provider value={value}>{children}</WMContext.Provider>;
}
