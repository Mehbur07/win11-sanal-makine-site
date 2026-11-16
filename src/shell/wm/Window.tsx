import { Columns2, Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { AppIcon } from '../../apps/AppIcon.tsx';
import { APPS } from '../../apps/registry.ts';
import { useI18n } from '../../i18n/context.ts';
import { ConfirmDialog } from '../dialog/ConfirmDialog.tsx';
import { AppBody } from './AppBody.tsx';
import { METRICS } from '../device.ts';
import { useWM } from './context.ts';
import {
  clampRect,
  detectSnap,
  resizeRect,
  snapRect,
  type Rect,
  type ResizeDir,
  type Snap,
} from './geometry.ts';
import type { WinState } from './reducer.ts';

const HANDLES: ResizeDir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const DRAG_THRESHOLD = 4;
const DOUBLE_TAP_MS = 350;

interface DragState {
  kind: 'move' | 'resize';
  dir?: ResizeDir;
  pointerId: number;
  start: { x: number; y: number };
  rect: Rect;
  moved: boolean;
}

/** Bir sonraki "yan yana" konumu: serbest → sol → sağ → serbest */
function nextSplit(snap: Snap): Snap {
  if (snap === 'left') return 'right';
  if (snap === 'right') return null;
  return 'left';
}

export function Window({ win }: { win: WinState }) {
  const wm = useWM();
  const { t } = useI18n();
  const app = APPS[win.appId];
  const appTitle = t(app.titleKey);
  const title = `${win.dirty ? '• ' : ''}${win.title ? `${win.title} — ${appTitle}` : appTitle}`;
  const { titleH } = METRICS[wm.mode];
  const phone = wm.mode === 'phone';
  const focused = wm.focusedId === win.id;

  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const lastTap = useRef(0);

  // Ekranda görünen dikdörtgen: telefonda tam ekran, yaslıysa yaslı alan, değilse serbest konum
  const rect: Rect = phone
    ? { x: 0, y: 0, ...wm.bounds }
    : win.snap
      ? snapRect(win.snap, wm.bounds)
      : clampRect(win.rect, wm.bounds, titleH);

  // Pencere açılınca klavye odağı pencereye geçsin
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  function layerPoint(e: ReactPointerEvent) {
    const box = wm.layerRef.current?.getBoundingClientRect();
    return { x: e.clientX - (box?.left ?? 0), y: e.clientY - (box?.top ?? 0) };
  }

  function startDrag(e: ReactPointerEvent<HTMLElement>, kind: DragState['kind'], dir?: ResizeDir) {
    wm.focus(win.id);
    if (phone || e.button !== 0) return;
    if (kind === 'move' && (e.target as Element).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { kind, dir, pointerId: e.pointerId, start: layerPoint(e), rect, moved: false };
  }

  function onDragMove(e: ReactPointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const p = layerPoint(e);
    let dx = p.x - d.start.x;
    let dy = p.y - d.start.y;

    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      // Yaslı pencere sürüklenmeye başlayınca eski boyutuna döner ve imlecin altında kalır
      if (win.snap) {
        const w = Math.min(win.rect.w, wm.bounds.w);
        const h = Math.min(win.rect.h, wm.bounds.h);
        const ratio = (d.start.x - rect.x) / rect.w;
        d.rect =
          d.kind === 'move'
            ? { x: Math.round(p.x - ratio * w), y: Math.max(0, p.y - titleH / 2), w, h }
            : rect;
        d.start = p;
        dx = 0;
        dy = 0;
        wm.setRect(win.id, d.rect);
      }
    }

    if (d.kind === 'move') {
      const next = clampRect({ ...d.rect, x: d.rect.x + dx, y: d.rect.y + dy }, wm.bounds, titleH);
      wm.move(win.id, next.x, next.y);
      const suggestion = detectSnap(p.x, p.y, wm.bounds);
      if (suggestion !== wm.preview) wm.setPreview(suggestion);
    } else if (d.dir) {
      wm.setRect(win.id, clampRect(resizeRect(d.rect, d.dir, dx, dy), wm.bounds, titleH));
    }
  }

  function endDrag(e: ReactPointerEvent<HTMLElement>, cancelled = false) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (d.kind === 'move') {
      if (d.moved && !cancelled && wm.preview) wm.snap(win.id, wm.preview);
      if (wm.preview) wm.setPreview(null);
      // Başlığa iki kez dokunma / tıklama: büyüt ya da eski boyut
      if (!d.moved && !cancelled) {
        const now = performance.now();
        if (now - lastTap.current < DOUBLE_TAP_MS) {
          wm.toggleMax(win.id);
          lastTap.current = 0;
        } else {
          lastTap.current = now;
        }
      }
    }
  }

  const dragHandlers = {
    onPointerMove: onDragMove,
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => endDrag(e),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => endDrag(e, true),
  };

  const maximized = win.snap === 'max';
  const titleId = `${win.id}-title`;

  return (
    <div
      ref={ref}
      className="window"
      data-focused={focused}
      data-snap={win.snap ?? 'none'}
      data-app={win.appId}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      hidden={win.minimized}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: 10 + win.z }}
      onPointerDown={() => wm.focus(win.id)}
    >
      <div
        className="window__titlebar"
        onPointerDown={(e) => startDrag(e, 'move')}
        {...dragHandlers}
      >
        <AppIcon app={app} size="sm" />
        <span className="window__title" id={titleId}>
          {title}
        </span>
        <div className="window__buttons">
          <button
            type="button"
            aria-label={t('window.minimize')}
            onClick={() => wm.minimize(win.id)}
          >
            <Minus />
          </button>
          {wm.mode === 'tablet' && (
            <button
              type="button"
              aria-label={t('window.split')}
              onClick={() => wm.snap(win.id, nextSplit(win.snap))}
            >
              <Columns2 />
            </button>
          )}
          {!phone && (
            <button
              type="button"
              aria-label={maximized ? t('window.restore') : t('window.maximize')}
              onClick={() => wm.toggleMax(win.id)}
            >
              {maximized ? <Copy /> : <Square />}
            </button>
          )}
          <button
            type="button"
            className="window__close"
            aria-label={t('window.close')}
            onClick={() => wm.requestClose(win.id)}
          >
            <X />
          </button>
        </div>
      </div>

      <div className="window__body">
        <AppBody windowId={win.id} appId={win.appId} args={win.args} />
        {win.confirmClose && (
          <ConfirmDialog
            title={t('window.unsaved.title')}
            text={t('window.unsaved.text')}
            confirmLabel={t('window.unsaved.discard')}
            danger
            onCancel={() => wm.cancelClose(win.id)}
            onConfirm={() => wm.close(win.id)}
          />
        )}
      </div>

      {!phone &&
        !maximized &&
        HANDLES.map((dir) => (
          <div
            key={dir}
            className={`window__handle window__handle--${dir}`}
            aria-hidden="true"
            onPointerDown={(e) => startDrag(e, 'resize', dir)}
            {...dragHandlers}
          />
        ))}
    </div>
  );
}
