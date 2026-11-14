import type { LucideIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface ContextMenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
}

// Sağ tık / uzun basma menüsü. Ekrandan taşmayacak şekilde konumlanır; ok tuşlarıyla gezilir.
export function ContextMenu({
  x,
  y,
  label,
  items,
  onClose,
}: {
  x: number;
  y: number;
  label: string;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
    });
    el.querySelector<HTMLButtonElement>('button')?.focus();
  }, [x, y]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const buttons = [...(ref.current?.querySelectorAll('button') ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = (index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }

  return (
    <ul
      ref={ref}
      className="context-menu"
      role="menu"
      aria-label={label}
      style={{ left: pos.x, top: pos.y }}
      onKeyDown={onKeyDown}
    >
      {items.map(({ label: text, icon: Icon, onSelect }) => (
        <li key={text} role="none">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onSelect();
              onClose();
            }}
          >
            <Icon aria-hidden="true" />
            {text}
          </button>
        </li>
      ))}
    </ul>
  );
}
