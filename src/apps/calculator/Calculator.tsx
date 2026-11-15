import { Delete } from 'lucide-react';
import { useEffect, useReducer, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { calcReducer, initialCalc, type CalcAction, type Op } from './calc.ts';
import './Calculator.css';

type Key = { label: ReactNode; aria?: string; action: CalcAction; kind?: 'op' | 'fn' | 'eq' };

const OP_KEYS: Record<string, Op> = { '+': '+', '-': '-', '*': '×', x: '×', '/': '÷' };

export function Calculator() {
  const { t, lang } = useI18n();
  const [state, dispatch] = useReducer(calcReducer, initialCalc);
  const ref = useRef<HTMLDivElement>(null);

  // Açılınca klavyeyle hemen yazılabilsin
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  // Türkçede ondalık ayıracı virgül
  const show = (s: string) =>
    s === 'Error' ? t('calc.error') : lang === 'tr' ? s.replaceAll('.', ',') : s;

  const keys: Key[] = [
    { label: '%', action: { type: 'percent' }, kind: 'fn' },
    { label: 'CE', aria: t('calc.clearEntry'), action: { type: 'clearEntry' }, kind: 'fn' },
    { label: 'C', aria: t('calc.clear'), action: { type: 'clear' }, kind: 'fn' },
    {
      label: <Delete aria-hidden="true" />,
      aria: t('calc.backspace'),
      action: { type: 'backspace' },
      kind: 'fn',
    },
    ...(['7', '8', '9'] as const).map((d) => ({
      label: d,
      action: { type: 'digit', digit: d } as CalcAction,
    })),
    { label: '÷', aria: t('calc.divide'), action: { type: 'op', op: '÷' }, kind: 'op' },
    ...(['4', '5', '6'] as const).map((d) => ({
      label: d,
      action: { type: 'digit', digit: d } as CalcAction,
    })),
    { label: '×', aria: t('calc.multiply'), action: { type: 'op', op: '×' }, kind: 'op' },
    ...(['1', '2', '3'] as const).map((d) => ({
      label: d,
      action: { type: 'digit', digit: d } as CalcAction,
    })),
    { label: '−', aria: t('calc.subtract'), action: { type: 'op', op: '-' }, kind: 'op' },
    { label: '±', aria: t('calc.negate'), action: { type: 'negate' }, kind: 'fn' },
    { label: '0', action: { type: 'digit', digit: '0' } },
    { label: lang === 'tr' ? ',' : '.', aria: t('calc.decimal'), action: { type: 'dot' } },
    { label: '+', aria: t('calc.add'), action: { type: 'op', op: '+' }, kind: 'op' },
  ] as Key[];

  // Klavye: rakamlar, + - * / , . Enter = Backspace Esc Delete %
  function onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let action: CalcAction | null = null;
    if (/^\d$/.test(e.key)) action = { type: 'digit', digit: e.key };
    else if (e.key === '.' || e.key === ',') action = { type: 'dot' };
    else if (OP_KEYS[e.key]) action = { type: 'op', op: OP_KEYS[e.key] as Op };
    else if (e.key === 'Enter' || e.key === '=') action = { type: 'equals' };
    else if (e.key === 'Backspace') action = { type: 'backspace' };
    else if (e.key === 'Escape') action = { type: 'clear' };
    else if (e.key === 'Delete') action = { type: 'clearEntry' };
    else if (e.key === '%') action = { type: 'percent' };
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      dispatch(action);
    }
  }

  return (
    <div
      ref={ref}
      className="calc"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={t('app.calculator')}
    >
      <div className="calc__screen">
        <div className="calc__expr">{show(state.expr)}</div>
        <output className="calc__display" data-testid="calc-display" aria-live="polite">
          {show(state.display)}
        </output>
      </div>
      <div className="calc__keys">
        {keys.map((k, i) => (
          <button
            key={i}
            type="button"
            className={`calc__key ${k.kind ? `calc__key--${k.kind}` : ''}`}
            aria-label={k.aria}
            onClick={() => dispatch(k.action)}
          >
            {k.label}
          </button>
        ))}
        <button
          type="button"
          className="calc__key calc__key--eq"
          aria-label={t('calc.equals')}
          onClick={() => dispatch({ type: 'equals' })}
        >
          =
        </button>
      </div>
    </div>
  );
}
