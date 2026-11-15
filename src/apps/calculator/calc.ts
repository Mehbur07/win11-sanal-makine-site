// Hesap makinesi mantığı (ekrandan bağımsız, birim testli). eval kullanılmaz:
// her tuş durumu adım adım değiştirir, tıpkı cep hesap makinesi gibi.

export type Op = '+' | '-' | '×' | '÷';

export interface CalcState {
  /** Ekranda görünen sayı (iç biçim: nokta ondalık ayıracı) */
  display: string;
  /** Bekleyen işlemin sol tarafı */
  acc: number | null;
  op: Op | null;
  /** true ise bir sonraki rakam yeni sayı başlatır */
  fresh: boolean;
  /** Üst satırdaki işlem özeti, ör. "12 + 7 =" */
  expr: string;
  error: boolean;
}

export type CalcAction =
  | { type: 'digit'; digit: string }
  | { type: 'dot' }
  | { type: 'op'; op: Op }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'clearEntry' }
  | { type: 'backspace' }
  | { type: 'negate' }
  | { type: 'percent' };

export const initialCalc: CalcState = {
  display: '0',
  acc: null,
  op: null,
  fresh: true,
  expr: '',
  error: false,
};

const MAX_DIGITS = 16;

/** Kayan nokta hatalarını gizler: 0.1 + 0.2 → 0.3 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  const rounded = Number.parseFloat(n.toPrecision(12));
  const abs = Math.abs(rounded);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9))
    return rounded.toExponential(6).replace(/\.?0+e/, 'e');
  return String(rounded);
}

export function compute(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? Number.NaN : a / b;
  }
}

const value = (s: CalcState) => Number.parseFloat(s.display);

export function calcReducer(state: CalcState, action: CalcAction): CalcState {
  // Hatadan sonra herhangi bir tuş baştan başlatır
  const s = state.error && action.type !== 'clear' ? initialCalc : state;

  switch (action.type) {
    case 'digit': {
      if (s.fresh) return { ...s, display: action.digit, fresh: false };
      if (s.display.replace(/[-.]/g, '').length >= MAX_DIGITS) return s;
      return { ...s, display: s.display === '0' ? action.digit : s.display + action.digit };
    }
    case 'dot': {
      if (s.fresh) return { ...s, display: '0.', fresh: false };
      if (s.display.includes('.')) return s;
      return { ...s, display: `${s.display}.` };
    }
    case 'op': {
      // Art arda işlem tuşu: önceki işlemi hesapla (12 + 7 × → 19 ×)
      if (s.op !== null && s.acc !== null && !s.fresh) {
        const result = compute(s.acc, s.op, value(s));
        if (Number.isNaN(result)) return { ...initialCalc, display: 'Error', error: true };
        const shown = formatNumber(result);
        return {
          ...s,
          display: shown,
          acc: result,
          op: action.op,
          fresh: true,
          expr: `${shown} ${action.op}`,
        };
      }
      return {
        ...s,
        acc: value(s),
        op: action.op,
        fresh: true,
        expr: `${formatNumber(value(s))} ${action.op}`,
      };
    }
    case 'equals': {
      if (s.op === null || s.acc === null) return { ...s, fresh: true };
      const b = value(s);
      const result = compute(s.acc, s.op, b);
      const expr = `${formatNumber(s.acc)} ${s.op} ${formatNumber(b)} =`;
      if (Number.isNaN(result)) return { ...initialCalc, display: 'Error', expr, error: true };
      return { ...initialCalc, display: formatNumber(result), expr };
    }
    case 'clear':
      return initialCalc;
    case 'clearEntry':
      return { ...s, display: '0', fresh: true };
    case 'backspace': {
      if (s.fresh) return s;
      const next = s.display.slice(0, -1);
      return { ...s, display: next === '' || next === '-' ? '0' : next };
    }
    case 'negate':
      if (s.display === '0') return s;
      return {
        ...s,
        display: s.display.startsWith('-') ? s.display.slice(1) : `-${s.display}`,
      };
    case 'percent': {
      // 200 + 10 % → 200 + 20 (toplama/çıkarmada sol tarafın yüzdesi); tek başına → /100
      const v = value(s);
      const n = s.acc !== null && (s.op === '+' || s.op === '-') ? (s.acc * v) / 100 : v / 100;
      return { ...s, display: formatNumber(n), fresh: true };
    }
  }
}
