import { RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { AppIcon } from '../../apps/AppIcon.tsx';
import { ALL_APP_IDS, APPS } from '../../apps/registry.ts';
import type { AppId } from '../../apps/types.ts';
import { useI18n } from '../../i18n/context.ts';
import { Popover } from '../popover/Popover.tsx';
import { useWM } from '../wm/context.ts';

// Uygulama menüsü: arama + tüm uygulamalar + yeniden başlat
export function AppMenu({ onClose, onRestart }: { onClose: () => void; onRestart: () => void }) {
  const { t, locale } = useI18n();
  const wm = useWM();
  const [query, setQuery] = useState('');
  const touch = wm.mode !== 'desktop';

  const q = query.trim().toLocaleLowerCase(locale);
  const results = ALL_APP_IDS.filter((id) =>
    t(APPS[id].titleKey).toLocaleLowerCase(locale).includes(q),
  );

  const launch = (id: AppId) => {
    wm.open(id);
    onClose();
  };

  return (
    <Popover label={t('menu.open')} side="left" className="app-menu" autoFocus={!touch}>
      <label className="app-menu__search">
        <Search aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder={t('menu.search')}
          aria-label={t('menu.search')}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            const first = results[0];
            if (e.key === 'Enter' && first) launch(first);
          }}
        />
      </label>

      {results.length === 0 ? (
        <p className="popover__empty">{t('menu.noResults')}</p>
      ) : (
        <ul className="app-menu__grid">
          {results.map((id) => (
            <li key={id}>
              <button type="button" className="app-menu__app" onClick={() => launch(id)}>
                <AppIcon app={APPS[id]} size="lg" />
                <span>{t(APPS[id].titleKey)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="app-menu__foot">
        <span className="app-menu__brand">
          <img src="/brand/mehburos-icon-32.png" alt="" width={20} height={20} />
          VirtualMOS
        </span>
        <button type="button" className="chip-button" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          {t('menu.restart')}
        </button>
      </footer>
    </Popover>
  );
}
