import { describe, expect, it } from 'vitest';
import { calcReducer, formatNumber, initialCalc, type CalcAction, type CalcState } from './calc.ts';

/** "12+7=" gibi tuş dizisini sırayla basar */
function press(keys: string, start: CalcState = initialCalc): CalcState {
  const map: Record<string, CalcAction> = {
    '+': { type: 'op', op: '+' },
    '-': { type: 'op', op: '-' },
    '*': { type: 'op', op: '×' },
    '/': { type: 'op', op: '÷' },
    '=': { type: 'equals' },
    '.': { type: 'dot' },
    '%': { type: 'percent' },
    C: { type: 'clear' },
    E: { type: 'clearEntry' },
    B: { type: 'backspace' },
    N: { type: 'negate' },
  };
  return [...keys].reduce((s, k) => calcReducer(s, map[k] ?? { type: 'digit', digit: k }), start);
}

describe('hesap makinesi', () => {
  it('dört işlemi yapar', () => {
    expect(press('12+7=').display).toBe('19');
    expect(press('9-12=').display).toBe('-3');
    expect(press('6*7=').display).toBe('42');
    expect(press('7/2=').display).toBe('3.5');
  });

  it('kayan nokta hatasını gizler: 0.1 + 0.2 = 0.3', () => {
    expect(press('.1+.2=').display).toBe('0.3');
  });

  it('art arda işlemlerde öncekini hesaplar (soldan sağa)', () => {
    const s = press('2+3*');
    expect(s.display).toBe('5');
    expect(press('4=', s).display).toBe('20');
  });

  it('sıfıra bölmede hata verir, sonraki tuş baştan başlatır', () => {
    const s = press('5/0=');
    expect(s.error).toBe(true);
    expect(press('3', s).display).toBe('3');
  });

  it('yüzde: toplamada sol tarafın yüzdesi, tek başına /100', () => {
    expect(press('200+10%=').display).toBe('220');
    expect(press('50%').display).toBe('0.5');
  });

  it('silme, işaret değiştirme ve tek ondalık nokta', () => {
    expect(press('123B').display).toBe('12');
    expect(press('5B').display).toBe('0');
    expect(press('5N').display).toBe('-5');
    expect(press('1..5').display).toBe('1.5');
    expect(press('12+3E').display).toBe('0');
    expect(press('12+3C').display).toBe('0');
  });

  it('işlem özetini gösterir', () => {
    expect(press('12+7=').expr).toBe('12 + 7 =');
  });

  it('çok büyük ve çok küçük sayıları üslü yazar', () => {
    expect(formatNumber(1e20)).toBe('1e+20');
    expect(formatNumber(123.456)).toBe('123.456');
  });
});
