import { useEffect, useRef, type ReactNode } from 'react';
import './Popover.css';

// Panelden açılan küçük pencereler (menü, hızlı ayarlar, bildirimler, takvim) için ortak kutu.
// Açılınca içindeki ilk düğmeye/alana klavye odağı verir.
export function Popover({
  label,
  side,
  className = '',
  autoFocus = true,
  children,
}: {
  label: string;
  side: 'left' | 'right';
  className?: string;
  autoFocus?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const first = ref.current?.querySelector<HTMLElement>(
      'input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    (first ?? ref.current)?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <section
      ref={ref}
      className={`popover popover--${side} ${className}`}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
    >
      {children}
    </section>
  );
}
