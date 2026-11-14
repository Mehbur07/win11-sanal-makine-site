import { describe, expect, it } from 'vitest';
import { focusedWindow, initialWM, wmReducer, type WMAction, type WMState } from './reducer.ts';

const rect = { x: 10, y: 10, w: 400, h: 300 };

function run(...actions: WMAction[]): WMState {
  return actions.reduce(wmReducer, initialWM);
}

describe('wmReducer', () => {
  it('pencere açar; yeni pencere odakta olur', () => {
    const s = run({ type: 'open', appId: 'files', rect }, { type: 'open', appId: 'editor', rect });
    expect(s.windows.map((w) => w.id)).toEqual(['w1', 'w2']);
    expect(focusedWindow(s)?.id).toBe('w2');
  });

  it('tek pencereli uygulamayı ikinci kez açmaz, öne getirir', () => {
    const s = run(
      { type: 'open', appId: 'about', rect, single: true },
      { type: 'open', appId: 'files', rect },
      { type: 'open', appId: 'about', rect, single: true },
    );
    expect(s.windows).toHaveLength(2);
    expect(focusedWindow(s)?.appId).toBe('about');
  });

  it('küçültülen pencere odağı bir alttakine bırakır, geri getirilince öne çıkar', () => {
    let s = run(
      { type: 'open', appId: 'files', rect },
      { type: 'open', appId: 'editor', rect },
      { type: 'minimize', id: 'w2' },
    );
    expect(focusedWindow(s)?.id).toBe('w1');
    s = wmReducer(s, { type: 'restore', id: 'w2' });
    expect(s.windows.find((w) => w.id === 'w2')?.minimized).toBe(false);
    expect(focusedWindow(s)?.id).toBe('w2');
  });

  it('tıklanan pencere öne gelir', () => {
    const s = run(
      { type: 'open', appId: 'files', rect },
      { type: 'open', appId: 'editor', rect },
      { type: 'focus', id: 'w1' },
    );
    expect(focusedWindow(s)?.id).toBe('w1');
  });

  it('zaten öndeki pencereye odaklanmak durumu değiştirmez', () => {
    const s = run({ type: 'open', appId: 'files', rect });
    expect(wmReducer(s, { type: 'focus', id: 'w1' })).toBe(s);
  });

  it('büyüt / önceki boyut arasında geçer, serbest konum korunur', () => {
    let s = run({ type: 'open', appId: 'files', rect }, { type: 'toggleMax', id: 'w1' });
    expect(s.windows[0]?.snap).toBe('max');
    expect(s.windows[0]?.rect).toEqual(rect);
    s = wmReducer(s, { type: 'toggleMax', id: 'w1' });
    expect(s.windows[0]?.snap).toBeNull();
  });

  it('yaslı pencerenin boyutu elle değişince yaslama kalkar', () => {
    const s = run(
      { type: 'open', appId: 'files', rect },
      { type: 'snap', id: 'w1', snap: 'left' },
      { type: 'setRect', id: 'w1', rect: { x: 0, y: 0, w: 500, h: 300 } },
    );
    expect(s.windows[0]?.snap).toBeNull();
    expect(s.windows[0]?.rect.w).toBe(500);
  });

  it('taşıma yalnızca konumu değiştirir', () => {
    const s = run({ type: 'open', appId: 'files', rect }, { type: 'move', id: 'w1', x: 50, y: 60 });
    expect(s.windows[0]?.rect).toEqual({ x: 50, y: 60, w: 400, h: 300 });
  });

  it('kapatma ve tümünü küçültme', () => {
    let s = run(
      { type: 'open', appId: 'files', rect },
      { type: 'open', appId: 'editor', rect },
      { type: 'close', id: 'w1' },
    );
    expect(s.windows.map((w) => w.id)).toEqual(['w2']);
    s = wmReducer(s, { type: 'minimizeAll' });
    expect(focusedWindow(s)).toBeUndefined();
  });

  it('olmayan pencereye yapılan işlem durumu değiştirmez', () => {
    const s = run({ type: 'open', appId: 'files', rect });
    expect(wmReducer(s, { type: 'minimize', id: 'yok' })).toBe(s);
    expect(wmReducer(s, { type: 'restore', id: 'yok' })).toBe(s);
  });
});
