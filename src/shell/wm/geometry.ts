// Pencere konum/boyut hesapları. Hepsi saf fonksiyon: aynı girdiye hep aynı sonucu verir,
// bu yüzden birim testlerle kolayca denetlenir.

export interface Size {
  w: number;
  h: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

/** Pencerenin yaslandığı yer: sol yarı, sağ yarı, tam ekran ya da serbest (null) */
export type Snap = 'left' | 'right' | 'max' | null;

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const MIN_W = 280;
export const MIN_H = 200;
/** İmleç kenara bu kadar yaklaşınca yaslama önerilir (px) */
export const SNAP_EDGE = 16;
/** Pencerenin en az bu kadarı ekranda kalır ki geri tutulabilsin (px) */
export const KEEP_VISIBLE = 120;

export function snapRect(snap: Exclude<Snap, null>, bounds: Size): Rect {
  const half = Math.round(bounds.w / 2);
  switch (snap) {
    case 'left':
      return { x: 0, y: 0, w: half, h: bounds.h };
    case 'right':
      return { x: half, y: 0, w: bounds.w - half, h: bounds.h };
    case 'max':
      return { x: 0, y: 0, w: bounds.w, h: bounds.h };
  }
}

/** Sürüklenen pencerenin imleci kenara geldiyse hangi yaslamanın önerileceği */
export function detectSnap(x: number, y: number, bounds: Size): Snap {
  if (y <= SNAP_EDGE / 2) return 'max';
  if (x <= SNAP_EDGE) return 'left';
  if (x >= bounds.w - SNAP_EDGE) return 'right';
  return null;
}

/** Pencereyi ekran içinde tutar: en küçük boyut, başlık çubuğu her zaman tutulabilir */
export function clampRect(rect: Rect, bounds: Size, titleH = 40): Rect {
  const w = Math.min(Math.max(rect.w, Math.min(MIN_W, bounds.w)), bounds.w);
  const h = Math.min(Math.max(rect.h, Math.min(MIN_H, bounds.h)), bounds.h);
  const keep = Math.min(KEEP_VISIBLE, w);
  const x = Math.min(Math.max(rect.x, keep - w), bounds.w - keep);
  const y = Math.min(Math.max(rect.y, 0), Math.max(0, bounds.h - titleH));
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

/** Yeni açılan pencerenin yeri: ortadan başlayıp her yeni pencerede biraz kayar */
export function cascadeRect(index: number, size: Size, bounds: Size): Rect {
  const w = Math.min(size.w, Math.round(bounds.w * 0.92));
  const h = Math.min(size.h, Math.round(bounds.h * 0.9));
  const step = (index % 6) * 28 - 56;
  const x = Math.min(Math.max(Math.round((bounds.w - w) / 2) + step, 0), Math.max(0, bounds.w - w));
  const y = Math.min(
    Math.max(Math.round((bounds.h - h) / 2.5) + step, 0),
    Math.max(0, bounds.h - h),
  );
  return { x, y, w, h };
}

/** Kenar/köşeden boyutlandırma: başlangıç dikdörtgeni + imlecin kayması → yeni dikdörtgen */
export function resizeRect(start: Rect, dir: ResizeDir, dx: number, dy: number): Rect {
  let { x, y, w, h } = start;
  if (dir.includes('e')) w = start.w + dx;
  if (dir.includes('s')) h = start.h + dy;
  if (dir.includes('w')) {
    w = start.w - dx;
    x = start.x + dx;
  }
  if (dir.includes('n')) {
    h = start.h - dy;
    y = start.y + dy;
  }
  if (w < MIN_W) {
    if (dir.includes('w')) x -= MIN_W - w;
    w = MIN_W;
  }
  if (h < MIN_H) {
    if (dir.includes('n')) y -= MIN_H - h;
    h = MIN_H;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }
  return { x, y, w, h };
}
