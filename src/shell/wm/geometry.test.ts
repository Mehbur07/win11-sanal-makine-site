import { describe, expect, it } from 'vitest';
import {
  cascadeRect,
  clampRect,
  detectSnap,
  MIN_H,
  MIN_W,
  resizeRect,
  snapRect,
} from './geometry.ts';

const bounds = { w: 1200, h: 800 };

describe('snapRect', () => {
  it('sol ve sağ yarıyı, tam ekranı hesaplar', () => {
    expect(snapRect('left', bounds)).toEqual({ x: 0, y: 0, w: 600, h: 800 });
    expect(snapRect('right', bounds)).toEqual({ x: 600, y: 0, w: 600, h: 800 });
    expect(snapRect('max', bounds)).toEqual({ x: 0, y: 0, w: 1200, h: 800 });
  });

  it('tek sayılı genişlikte iki yarı ekranı tam kaplar', () => {
    const b = { w: 1001, h: 700 };
    const left = snapRect('left', b);
    const right = snapRect('right', b);
    expect(left.w + right.w).toBe(1001);
    expect(right.x).toBe(left.w);
  });
});

describe('detectSnap', () => {
  it('kenarlara göre yaslama önerir', () => {
    expect(detectSnap(600, 2, bounds)).toBe('max');
    expect(detectSnap(5, 400, bounds)).toBe('left');
    expect(detectSnap(1195, 400, bounds)).toBe('right');
    expect(detectSnap(600, 400, bounds)).toBeNull();
  });
});

describe('clampRect', () => {
  it('ekran dışına kaçan pencereyi tutulabilir yerde bırakır', () => {
    const r = clampRect({ x: 5000, y: -50, w: 400, h: 300 }, bounds);
    expect(r.y).toBe(0);
    expect(r.x).toBeLessThanOrEqual(bounds.w - 120);
  });

  it('en küçük boyutun altına inmez, ekrandan büyük olamaz', () => {
    expect(clampRect({ x: 0, y: 0, w: 10, h: 10 }, bounds)).toMatchObject({ w: MIN_W, h: MIN_H });
    expect(clampRect({ x: 0, y: 0, w: 5000, h: 5000 }, bounds)).toMatchObject({ w: 1200, h: 800 });
  });

  it('başlık çubuğu ekranın altına kaçmaz', () => {
    const r = clampRect({ x: 100, y: 790, w: 400, h: 300 }, bounds, 40);
    expect(r.y).toBe(760);
  });
});

describe('cascadeRect', () => {
  it('pencereyi ekrana sığdırır ve her yenisini biraz kaydırır', () => {
    const a = cascadeRect(0, { w: 600, h: 400 }, bounds);
    const b = cascadeRect(1, { w: 600, h: 400 }, bounds);
    expect(b.x - a.x).toBe(28);
    expect(b.y - a.y).toBe(28);
    const big = cascadeRect(0, { w: 3000, h: 3000 }, bounds);
    expect(big.x).toBeGreaterThanOrEqual(0);
    expect(big.x + big.w).toBeLessThanOrEqual(bounds.w);
    expect(big.y + big.h).toBeLessThanOrEqual(bounds.h);
  });
});

describe('resizeRect', () => {
  const start = { x: 100, y: 100, w: 500, h: 400 };

  it('sağ alt köşeden büyütür', () => {
    expect(resizeRect(start, 'se', 50, 30)).toEqual({ x: 100, y: 100, w: 550, h: 430 });
  });

  it('sol üst köşeden büyütürken konum da değişir', () => {
    expect(resizeRect(start, 'nw', -20, -10)).toEqual({ x: 80, y: 90, w: 520, h: 410 });
  });

  it('en küçük boyutta durur ve karşı kenar yerinde kalır', () => {
    const r = resizeRect(start, 'w', 1000, 0);
    expect(r.w).toBe(MIN_W);
    expect(r.x + r.w).toBe(start.x + start.w);
  });

  it('üst kenar ekranın üstünü geçemez', () => {
    const r = resizeRect(start, 'n', 0, -500);
    expect(r.y).toBe(0);
    expect(r.y + r.h).toBe(start.y + start.h);
  });
});
