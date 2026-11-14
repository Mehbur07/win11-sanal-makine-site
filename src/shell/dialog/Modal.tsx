import { useEffect, useId, useRef, type ReactNode } from 'react';
import './Modal.css';

// Soru/onay pencereleri. scope='window': yalnızca bulunduğu uygulama penceresini kaplar
// (diğer pencereler kullanılabilir kalır); scope='screen': tüm ekranı kaplar.
export function Modal({
  title,
  scope = 'window',
  onClose,
  children,
  actions,
  wide = false,
}: {
  title: string;
  scope?: 'window' | 'screen';
  onClose?: () => void;
  children?: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    const first = box?.querySelector<HTMLElement>('input, textarea, button.primary, button');
    (first ?? box)?.focus({ preventScroll: true });
    if (first instanceof HTMLInputElement) {
      // Dosya adında uzantıdan öncesini seç: "not.txt" → "not"
      const dot = first.value.lastIndexOf('.');
      first.setSelectionRange(0, dot > 0 ? dot : first.value.length);
    }
  }, []);

  return (
    <div
      className={`modal modal--${scope}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClose) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        ref={ref}
        className={`modal__box${wide ? ' modal__box--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className="modal__title">
          {title}
        </h2>
        {children}
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
