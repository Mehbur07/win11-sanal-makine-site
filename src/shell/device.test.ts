import { describe, expect, it } from 'vitest';
import { detectMode } from './device.ts';
import { monthGrid, weekdayNames } from './panel/calendar.ts';
import { fillVars } from '../i18n/context.ts';

describe('detectMode', () => {
  it('küçük ekran (dik ya da yatay) telefondur', () => {
    expect(detectMode(390, 844, true)).toBe('phone');
    expect(detectMode(844, 390, true)).toBe('phone');
    expect(detectMode(500, 900, false)).toBe('phone');
  });

  it('büyük dokunmatik ekran tablettir, fareli büyük ekran bilgisayardır', () => {
    expect(detectMode(1180, 820, true)).toBe('tablet');
    expect(detectMode(820, 1180, true)).toBe('tablet');
    expect(detectMode(1366, 768, false)).toBe('desktop');
  });
});

describe('monthGrid', () => {
  it('Kasım 2026 pazar başlar: 6 boş hücre, 30 gün, haftalara tamamlanır', () => {
    const cells = monthGrid(2026, 10);
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(cells[6]).toBe(1);
    expect(cells.filter((c) => c !== null)).toHaveLength(30);
    expect(cells.length % 7).toBe(0);
  });

  it('artık yılda şubat 29 gündür', () => {
    expect(monthGrid(2028, 1).filter((c) => c !== null)).toHaveLength(29);
  });
});

describe('weekdayNames', () => {
  it('pazartesiden başlar', () => {
    expect(weekdayNames('tr-TR')[0]).toMatch(/^Pzt/);
    expect(weekdayNames('en-US')[0]).toBe('Mon');
  });
});

describe('fillVars', () => {
  it('yer tutucuları doldurur, bilinmeyenleri bırakır', () => {
    expect(fillVars('{app} yakında', { app: 'Dosyalar' })).toBe('Dosyalar yakında');
    expect(fillVars('{a} ve {b}', { a: 1 })).toBe('1 ve {b}');
    expect(fillVars('düz metin')).toBe('düz metin');
  });
});
