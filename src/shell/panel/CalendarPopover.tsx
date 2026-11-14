import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { Popover } from '../popover/Popover.tsx';
import { useNow } from '../useNow.ts';
import { monthGrid, weekdayNames } from './calendar.ts';

export function CalendarPopover() {
  const { t, locale } = useI18n();
  const now = useNow();
  const [view, setView] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));

  const cells = monthGrid(view.y, view.m);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const isThisMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <Popover label={t('panel.clock')} side="right" className="calendar">
      <button
        type="button"
        className="calendar__today"
        onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}
        aria-label={t('calendar.today')}
      >
        <span className="calendar__time">
          {now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span>
          {now.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </button>

      <div className="calendar__nav">
        <button type="button" aria-label={t('calendar.prev')} onClick={() => shift(-1)}>
          <ChevronLeft />
        </button>
        <strong aria-live="polite">{monthLabel}</strong>
        <button type="button" aria-label={t('calendar.next')} onClick={() => shift(1)}>
          <ChevronRight />
        </button>
      </div>

      <table className="calendar__table" aria-label={monthLabel}>
        <thead>
          <tr>
            {weekdayNames(locale).map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, d) => {
                const today = isThisMonth && day === now.getDate();
                return (
                  <td key={d} data-today={today} aria-current={today ? 'date' : undefined}>
                    {day ?? ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Popover>
  );
}
