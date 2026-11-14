import { useLayoutEffect } from 'react';
import { useWM } from './context.ts';
import { snapRect } from './geometry.ts';
import { Window } from './Window.tsx';
import './Window.css';

// Pencerelerin çizildiği katman. Boyutu değiştikçe (ekran döndürme vb.) pencere alanını günceller.
export function WindowLayer() {
  const { layerRef, setBounds, windows, preview, bounds } = useWM();

  useLayoutEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const measure = () =>
      setBounds({
        w: el.clientWidth || window.innerWidth,
        h: el.clientHeight || window.innerHeight,
      });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layerRef, setBounds]);

  const previewRect = preview ? snapRect(preview, bounds) : null;

  return (
    <div className="wm-layer" ref={layerRef}>
      {previewRect && (
        <div
          className="wm-preview"
          data-testid="snap-preview"
          style={{
            left: previewRect.x + 6,
            top: previewRect.y + 6,
            width: previewRect.w - 12,
            height: previewRect.h - 12,
          }}
        />
      )}
      {windows.map((win) => (
        <Window key={win.id} win={win} />
      ))}
    </div>
  );
}
