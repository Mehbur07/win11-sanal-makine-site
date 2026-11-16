import { ArrowLeft, ArrowRight, ExternalLink, Home, Info, RotateCw, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { readPref, writePref } from '../../lib/prefs.ts';
import '../shared/AppToolbar.css';
import './Browser.css';
import { displayUrl, HOME, toUrl } from './url.ts';

const HINT_PREF = 'vmos:browser:hintClosed';

const SHORTCUTS = [
  { name: 'Mehbur07', url: 'https://mehbur07.github.io/', color: '#ffc25a' },
  {
    name: 'VirtualMOS GitHub',
    url: 'https://github.com/virtualmos/virtualmos.github.io',
    color: '#2de2f5',
  },
  {
    name: 'MehburMC Launcher',
    url: 'https://github.com/Mehbur07/MehburMC-Launcher',
    color: '#3cf59a',
  },
  { name: 'Wikipedia', url: 'https://tr.wikipedia.org/', color: '#8fa9b0' },
  {
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/export/embed.html',
    color: '#ff7a3c',
  },
];

// Basit web tarayıcı: siteleri pencere içinde (iframe) açar. Birçok büyük site güvenlik
// nedeniyle başka sayfa içinde açılmayı reddeder; o zaman ↗ ile gerçek tarayıcıda açılır.
export function Browser() {
  const { t } = useI18n();
  const [history, setHistory] = useState({ stack: [HOME], index: 0 });
  const [address, setAddress] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [hintClosed, setHintClosed] = useState(() => readPref(HINT_PREF) === '1');
  const url = history.stack[history.index] ?? HOME;

  function go(input: string) {
    const next = toUrl(input);
    setHistory((h) => ({ stack: [...h.stack.slice(0, h.index + 1), next], index: h.index + 1 }));
    setAddress(displayUrl(next));
  }

  function move(delta: number) {
    const index = Math.min(Math.max(history.index + delta, 0), history.stack.length - 1);
    setHistory({ ...history, index });
    setAddress(displayUrl(history.stack[index] ?? HOME));
  }

  return (
    <div className="browser">
      <div className="app-toolbar browser__bar">
        <button
          type="button"
          className="tool"
          aria-label={t('browser.back')}
          title={t('browser.back')}
          disabled={history.index === 0}
          onClick={() => move(-1)}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className="tool"
          aria-label={t('browser.forward')}
          title={t('browser.forward')}
          disabled={history.index >= history.stack.length - 1}
          onClick={() => move(1)}
        >
          <ArrowRight aria-hidden="true" />
        </button>
        <button
          type="button"
          className="tool"
          aria-label={t('browser.reload')}
          title={t('browser.reload')}
          onClick={() => setReloadKey((k) => k + 1)}
        >
          <RotateCw aria-hidden="true" />
        </button>
        <button
          type="button"
          className="tool"
          aria-label={t('browser.home')}
          title={t('browser.home')}
          onClick={() => go(HOME)}
        >
          <Home aria-hidden="true" />
        </button>
        <form
          className="browser__address"
          onSubmit={(e) => {
            e.preventDefault();
            go(address);
          }}
        >
          <input
            value={address}
            placeholder={t('browser.placeholder')}
            aria-label={t('browser.address')}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </form>
        {url === HOME ? (
          // Başlangıç sayfasında dışarıda açılacak bir adres yok: devre dışı düğme
          <button
            type="button"
            className="tool"
            disabled
            aria-label={t('browser.external')}
            title={t('browser.external')}
          >
            <ExternalLink aria-hidden="true" />
          </button>
        ) : (
          <a
            className="tool"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('browser.external')}
            title={t('browser.external')}
          >
            <ExternalLink aria-hidden="true" />
          </a>
        )}
      </div>

      {!hintClosed && url !== HOME && (
        <div className="browser__hint" role="note">
          <Info aria-hidden="true" />
          <span>{t('browser.hint')}</span>
          <button
            type="button"
            aria-label={t('files.close')}
            onClick={() => {
              setHintClosed(true);
              writePref(HINT_PREF, '1');
            }}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      {url === HOME ? (
        <div className="browser__home">
          <img src="/brand/mehburos-icon-256.png" alt="" width={84} height={84} />
          <h2>VirtualMOS</h2>
          <form
            className="browser__search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get('q');
              if (typeof q === 'string' && q.trim()) go(q);
            }}
          >
            <Search aria-hidden="true" />
            <input name="q" placeholder={t('browser.search')} aria-label={t('browser.search')} />
          </form>
          <ul className="browser__tiles">
            {SHORTCUTS.map((s) => (
              <li key={s.url}>
                <button type="button" onClick={() => go(s.url)}>
                  <span
                    className="browser__tile-icon"
                    style={{ color: s.color, borderColor: s.color }}
                  >
                    {s.name[0]}
                  </span>
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <iframe
          key={`${url}-${reloadKey}`}
          className="browser__frame"
          src={url}
          title={t('browser.page')}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
