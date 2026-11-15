import {
  Check,
  Globe,
  HardDrive,
  Info,
  Languages,
  Palette,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/messages.ts';
import {
  ACCENT_COLORS,
  ACCENTS,
  useTheme,
  type Accent,
  type Wallpaper,
} from '../../settings/theme.ts';
import { useWM } from '../../shell/wm/context.ts';
import { useStorage } from '../../storage/context.ts';
import { HandleBackend } from '../../storage/handleBackend.ts';
import { StorageChooser } from '../../storage/StorageChooser.tsx';
import './Settings.css';

type Page = 'appearance' | 'language' | 'storage' | 'about';

const PAGES: { id: Page; icon: LucideIcon; key: MessageKey }[] = [
  { id: 'appearance', icon: Palette, key: 'settings.appearance' },
  { id: 'language', icon: Languages, key: 'settings.language' },
  { id: 'storage', icon: HardDrive, key: 'settings.storage' },
  { id: 'about', icon: Info, key: 'settings.about' },
];

const WALLPAPER_OPTIONS: { id: Exclude<Wallpaper, 'custom'>; key: MessageKey }[] = [
  { id: 'mehburos', key: 'wallpaper.mehburos' },
  { id: 'grid', key: 'wallpaper.grid' },
  { id: 'aurora', key: 'wallpaper.aurora' },
  { id: 'midnight', key: 'wallpaper.midnight' },
];

const ACCENT_KEYS: Record<Accent, MessageKey> = {
  cyan: 'accent.cyan',
  magenta: 'accent.magenta',
  amber: 'accent.amber',
  green: 'accent.green',
};

export function Settings() {
  const { t } = useI18n();
  const [page, setPage] = useState<Page>('appearance');

  return (
    <div className="settings">
      <nav className="settings__nav" aria-label={t('app.settings')}>
        {PAGES.map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            type="button"
            aria-current={page === id ? 'page' : undefined}
            onClick={() => setPage(id)}
          >
            <Icon aria-hidden="true" />
            {t(key)}
          </button>
        ))}
      </nav>
      <section className="settings__page" aria-labelledby="settings-title">
        {page === 'appearance' && <Appearance />}
        {page === 'language' && <LanguagePage />}
        {page === 'storage' && <StoragePage />}
        {page === 'about' && <AboutPage />}
      </section>
    </div>
  );
}

function Appearance() {
  const { t } = useI18n();
  const theme = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <h2 id="settings-title">{t('settings.appearance')}</h2>

      <h3>{t('settings.theme')}</h3>
      <div className="settings__choices" role="radiogroup" aria-label={t('settings.theme')}>
        {(['dark', 'light'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme.theme === value}
            className={`theme-card theme-card--${value}`}
            onClick={() => theme.setTheme(value)}
          >
            <span className="theme-card__preview" aria-hidden="true" />
            {value === 'dark' ? t('settings.dark') : t('settings.light')}
          </button>
        ))}
      </div>

      <h3>{t('settings.accent')}</h3>
      <div className="settings__accents" role="radiogroup" aria-label={t('settings.accent')}>
        {ACCENTS.map((accent) => (
          <button
            key={accent}
            type="button"
            role="radio"
            aria-checked={theme.accent === accent}
            aria-label={t(ACCENT_KEYS[accent])}
            title={t(ACCENT_KEYS[accent])}
            className="accent-dot"
            style={{ '--dot': ACCENT_COLORS[accent] } as CSSProperties}
            onClick={() => theme.setAccent(accent)}
          >
            {theme.accent === accent && <Check aria-hidden="true" />}
          </button>
        ))}
      </div>

      <h3>{t('settings.wallpaper')}</h3>
      <div className="settings__wallpapers" role="radiogroup" aria-label={t('settings.wallpaper')}>
        {WALLPAPER_OPTIONS.map(({ id, key }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={theme.wallpaper === id}
            className="wallpaper-card"
            onClick={() => theme.setWallpaper(id)}
          >
            <span
              className={`wallpaper-card__preview desktop`}
              data-wallpaper={id}
              aria-hidden="true"
            />
            {t(key)}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={theme.wallpaper === 'custom'}
          className="wallpaper-card"
          onClick={() => fileRef.current?.click()}
        >
          <span
            className="wallpaper-card__preview wallpaper-card__preview--custom"
            style={
              theme.customWallpaperUrl
                ? { backgroundImage: `url(${JSON.stringify(theme.customWallpaperUrl)})` }
                : undefined
            }
            aria-hidden="true"
          >
            {!theme.customWallpaperUrl && <Upload />}
          </span>
          {t('wallpaper.custom')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          data-testid="wallpaper-upload"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            if (file.size > 15 * 1024 * 1024) {
              setError(t('settings.wallpaperTooBig'));
              return;
            }
            setError(null);
            await theme.setCustomWallpaper(file);
          }}
        />
      </div>
      {error && <p className="field__error">{error}</p>}
    </>
  );
}

function LanguagePage() {
  const { t, lang, setLang } = useI18n();
  return (
    <>
      <h2 id="settings-title">{t('settings.language')}</h2>
      <p className="settings__hint">{t('settings.languageHint')}</p>
      <div className="settings__list" role="radiogroup" aria-label={t('settings.language')}>
        {(
          [
            ['tr', 'Türkçe'],
            ['en', 'English'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={lang === value}
            className="settings__option"
            onClick={() => setLang(value)}
          >
            <span>{label}</span>
            {lang === value && <Check aria-hidden="true" />}
          </button>
        ))}
      </div>
    </>
  );
}

function StoragePage() {
  const { t } = useI18n();
  const storage = useStorage();
  const wm = useWM();
  const [choosing, setChoosing] = useState(false);
  const { status } = storage;

  let label = t('storage.loading');
  let Icon: LucideIcon = HardDrive;
  if (status.state === 'ready') {
    const b = status.backend;
    Icon = b.kind === 'device' ? HardDrive : Globe;
    label =
      b instanceof HandleBackend && b.kind === 'device'
        ? t('storage.where.device', { name: b.rootName })
        : t(
            b.kind === 'idb'
              ? 'storage.where.idb'
              : b.kind === 'memory'
                ? 'storage.where.memory'
                : 'storage.where.opfs',
          );
  } else if (status.state === 'choose') {
    label = t('files.needStorage');
  } else if (status.state === 'permission') {
    label = t('storage.permission.text', { name: status.folderName });
  }

  return (
    <>
      <h2 id="settings-title">{t('settings.storage')}</h2>
      <div className="settings__card">
        <Icon aria-hidden="true" />
        <div>
          <strong>{t('settings.storageNow')}</strong>
          <p data-testid="storage-label">{label}</p>
        </div>
      </div>
      <p className="settings__hint">{t('settings.storageHint')}</p>
      <div className="settings__actions">
        <button type="button" className="btn primary" onClick={() => setChoosing(true)}>
          {t('storage.change')}
        </button>
        {status.state === 'permission' && (
          <button type="button" className="btn" onClick={() => storage.grantAccess()}>
            {t('storage.permission.grant')}
          </button>
        )}
        <button type="button" className="btn" onClick={() => wm.open('files')}>
          {t('settings.openFiles')}
        </button>
      </div>
      {choosing && (
        <StorageChooser
          scope="window"
          onDone={() => setChoosing(false)}
          onCancel={() => setChoosing(false)}
        />
      )}
    </>
  );
}

function AboutPage() {
  const { t } = useI18n();
  const wm = useWM();
  return (
    <>
      <h2 id="settings-title">{t('settings.about')}</h2>
      <div className="settings__card">
        <img src="/brand/mehburos-icon-256.png" alt="" width={56} height={56} />
        <div>
          <strong>VirtualMOS</strong>
          <p>{t('about.desc')}</p>
        </div>
      </div>
      <div className="settings__actions">
        <button type="button" className="btn" onClick={() => wm.open('about')}>
          {t('settings.openAbout')}
        </button>
      </div>
    </>
  );
}
