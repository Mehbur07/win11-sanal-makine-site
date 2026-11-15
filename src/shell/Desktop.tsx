import { Expand, Info, LayoutGrid, Monitor, Shrink } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useI18n } from '../i18n/context.ts';
import { useTheme } from '../settings/theme.ts';
import { StorageGate } from '../storage/StorageGate.tsx';
import { StorageProvider } from '../storage/StorageProvider.tsx';
import { ContextMenu, type ContextMenuItem } from './ContextMenu.tsx';
import { DesktopIcons } from './DesktopIcons.tsx';
import { METRICS } from './device.ts';
import { useNotifications } from './notifications/context.ts';
import { NotificationCenter } from './notifications/NotificationCenter.tsx';
import { NotificationProvider } from './notifications/NotificationProvider.tsx';
import { Toasts } from './notifications/Toasts.tsx';
import { AppMenu } from './panel/AppMenu.tsx';
import { CalendarPopover } from './panel/CalendarPopover.tsx';
import { Panel, type PanelPopover } from './panel/Panel.tsx';
import { QuickSettings } from './panel/QuickSettings.tsx';
import { useDeviceMode } from './useDeviceMode.ts';
import { useFullscreen } from './useFullscreen.ts';
import { useWM } from './wm/context.ts';
import { WindowLayer } from './wm/WindowLayer.tsx';
import { WindowManagerProvider } from './wm/WindowManagerProvider.tsx';
import './Desktop.css';

const LONG_PRESS_MS = 550;

export function Desktop({ onRestart }: { onRestart: () => void }) {
  const mode = useDeviceMode();
  return (
    <NotificationProvider>
      <StorageProvider>
        <WindowManagerProvider mode={mode}>
          <DesktopShell onRestart={onRestart} />
        </WindowManagerProvider>
      </StorageProvider>
    </NotificationProvider>
  );
}

function DesktopShell({ onRestart }: { onRestart: () => void }) {
  const { t } = useI18n();
  const wm = useWM();
  const { notify } = useNotifications();
  const fullscreen = useFullscreen();
  const { wallpaper, customWallpaperUrl } = useTheme();
  const [popover, setPopover] = useState<PanelPopover | null>(null);
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const longPress = useRef<{ timer: number; x: number; y: number } | null>(null);
  const welcomed = useRef(false);

  const closeAll = useCallback(() => {
    setPopover(null);
    setMenuAt(null);
  }, []);

  // İlk açılışta hoş geldin bildirimi
  useEffect(() => {
    if (welcomed.current) return;
    welcomed.current = true;
    notify({ titleKey: 'notif.welcome.title', bodyKey: 'notif.welcome.body' });
  }, [notify]);

  // Klavye kısayolları (Alt + harf/ok). Tarayıcı ve işletim sistemiyle çakışmayanlar seçildi.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeAll();
        return;
      }
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const id = wm.focusedId;
      let handled = true;
      switch (e.code) {
        case 'KeyM':
          setMenuAt(null);
          setPopover((p) => (p === 'menu' ? null : 'menu'));
          break;
        case 'KeyD':
          wm.minimizeAll();
          break;
        case 'KeyQ':
          if (id) wm.requestClose(id);
          break;
        case 'ArrowUp':
          if (id) wm.toggleMax(id);
          break;
        case 'ArrowDown':
          if (id) wm.minimize(id);
          break;
        case 'ArrowLeft':
          if (id) wm.snap(id, 'left');
          break;
        case 'ArrowRight':
          if (id) wm.snap(id, 'right');
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wm, closeAll]);

  const isBackground = (target: EventTarget) =>
    !(target as Element).closest('.window, .desktop-icon, .panel, .popover, .context-menu');

  function cancelLongPress() {
    if (longPress.current) window.clearTimeout(longPress.current.timer);
    longPress.current = null;
  }

  // Dokunmatikte masaüstüne uzun basma = sağ tık menüsü
  function onPointerDown(e: ReactPointerEvent) {
    if (e.pointerType === 'mouse' || !isBackground(e.target)) return;
    const { clientX: x, clientY: y } = e;
    cancelLongPress();
    longPress.current = {
      x,
      y,
      timer: window.setTimeout(() => {
        setPopover(null);
        setMenuAt({ x, y });
        longPress.current = null;
      }, LONG_PRESS_MS),
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    const lp = longPress.current;
    if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancelLongPress();
  }

  const togglePopover = (p: PanelPopover) => {
    setMenuAt(null);
    setPopover((cur) => (cur === p ? null : p));
  };

  const menuItems: ContextMenuItem[] = [
    { label: t('menu.open'), icon: LayoutGrid, onSelect: () => setPopover('menu') },
    { label: t('quick.showDesktop'), icon: Monitor, onSelect: () => wm.minimizeAll() },
    ...(fullscreen.supported
      ? [
          {
            label: fullscreen.active ? t('ctx.exitFullscreen') : t('ctx.fullscreen'),
            icon: fullscreen.active ? Shrink : Expand,
            onSelect: fullscreen.toggle,
          },
        ]
      : []),
    { label: t('ctx.about'), icon: Info, onSelect: () => wm.open('about') },
  ];

  const { titleH, panelH } = METRICS[wm.mode];
  const style = { '--title-h': `${titleH}px`, '--panel-h': `${panelH}px` } as CSSProperties;

  return (
    <div className="shell" data-mode={wm.mode} data-testid="desktop" style={style}>
      <main
        className="desktop"
        data-wallpaper={wallpaper}
        style={
          customWallpaperUrl
            ? { backgroundImage: `url(${JSON.stringify(customWallpaperUrl)})` }
            : undefined
        }
        aria-label={t('desktop.label')}
        onContextMenu={(e) => {
          if (!isBackground(e.target)) return;
          e.preventDefault();
          setPopover(null);
          setMenuAt({ x: e.clientX, y: e.clientY });
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
      >
        <DesktopIcons />
        <WindowLayer />
      </main>

      {(popover || menuAt) && <div className="scrim" onPointerDown={closeAll} aria-hidden="true" />}

      {popover === 'menu' && <AppMenu onClose={closeAll} onRestart={onRestart} />}
      {popover === 'quick' && <QuickSettings onClose={closeAll} />}
      {popover === 'notifications' && <NotificationCenter />}
      {popover === 'calendar' && <CalendarPopover />}

      {menuAt && (
        <ContextMenu
          x={menuAt.x}
          y={menuAt.y}
          label={t('ctx.label')}
          items={menuItems}
          onClose={() => setMenuAt(null)}
        />
      )}

      {!popover && <Toasts />}
      <StorageGate />
      <Panel open={popover} onToggle={togglePopover} />
    </div>
  );
}
