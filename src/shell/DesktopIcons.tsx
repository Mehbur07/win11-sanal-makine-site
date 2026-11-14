import { useRef, useState } from 'react';
import { AppIcon } from '../apps/AppIcon.tsx';
import { ALL_APP_IDS, APPS, DESKTOP_APPS } from '../apps/registry.ts';
import type { AppId } from '../apps/types.ts';
import { useI18n } from '../i18n/context.ts';
import { useWM } from './wm/context.ts';

// Masaüstü simgeleri. Farede: tek tık seçer, çift tık açar. Dokunmatikte: tek dokunuş açar.
// Telefonda tüm uygulamalar ana ekran gibi ızgara hâlinde görünür.
export function DesktopIcons() {
  const { t } = useI18n();
  const wm = useWM();
  const [selected, setSelected] = useState<AppId | null>(null);
  const lastPointer = useRef<string>('mouse');
  const ids = wm.mode === 'phone' ? ALL_APP_IDS : DESKTOP_APPS;

  return (
    <ul className="desktop-icons" data-layout={wm.mode === 'phone' ? 'grid' : 'column'}>
      {ids.map((id) => (
        <li key={id}>
          <button
            type="button"
            className="desktop-icon"
            data-selected={selected === id}
            onPointerDown={(e) => {
              lastPointer.current = e.pointerType;
            }}
            onClick={() => {
              if (lastPointer.current === 'mouse' && wm.mode === 'desktop') setSelected(id);
              else wm.open(id);
            }}
            onDoubleClick={() => {
              if (wm.mode === 'desktop') wm.open(id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                wm.open(id);
              }
            }}
            onBlur={() => setSelected((s) => (s === id ? null : s))}
          >
            <AppIcon app={APPS[id]} size="lg" />
            <span>{t(APPS[id].titleKey)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
