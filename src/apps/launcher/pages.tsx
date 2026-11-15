import {
  Clock,
  CloudDownload,
  ExternalLink,
  CodeXml,
  Globe,
  MemoryStick,
  Newspaper,
  Play,
  Plus,
  Trash2,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/messages.ts';
import type { InfoState, Profiles, View } from './Launcher.tsx';
import { parseNotes, type Inline } from './notes.ts';
import {
  LOADER_LABELS,
  LOADERS,
  MC_VERSIONS,
  MEMORY_CHOICES,
  splitDuration,
  type Loader,
  type ProfileIcon,
} from './profiles.ts';
import {
  detectPlatform,
  formatSize,
  LAUNCHER_REPO,
  OFFICIAL_SITE,
  RELEASES_PAGE,
  type ReleaseAsset,
} from './releases.ts';

type Go = (view: View) => void;

function ProfileTile({ icon, size = 48 }: { icon: ProfileIcon; size?: number }) {
  return (
    <span
      className={`mmc-icon mmc-icon--${icon}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: 'accent' | 'ok' }) {
  return <span className={`mmc-badge${tone ? ` mmc-badge--${tone}` : ''}`}>{children}</span>;
}

function useFormatDate() {
  const { locale } = useI18n();
  return (value: string | number) =>
    new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function useDuration() {
  const { t } = useI18n();
  return (secs: number) => {
    const { h, m } = splitDuration(secs);
    return h > 0 ? t('mmc.home.hours', { h, m }) : t('mmc.home.minutes', { m });
  };
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

/* ------------------------------------------------------------------ Oyna */

const STAGES: { until: number; key: MessageKey }[] = [
  { until: 0.35, key: 'mmc.stage.version' },
  { until: 0.7, key: 'mmc.stage.libraries' },
  { until: 1.01, key: 'mmc.stage.assets' },
];

export function HomePage({ profiles, info, go }: { profiles: Profiles; info: InfoState; go: Go }) {
  const { t } = useI18n();
  const formatDate = useFormatDate();
  const duration = useDuration();
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'demo'>('idle');
  const [progress, setProgress] = useState(0);
  const { state } = profiles;
  const profile = state.profiles.find((p) => p.id === state.selected);

  // "Oyna": gerçek launcher gibi kısa bir hazırlık, ardından demo uyarısı
  useEffect(() => {
    if (phase !== 'preparing') return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(1, p + 0.08);
        if (next >= 1) {
          window.clearInterval(id);
          setPhase('demo');
        }
        return next;
      });
    }, 110);
    return () => window.clearInterval(id);
  }, [phase]);

  if (!profile) {
    return (
      <div className="mmc-page">
        <section className="mmc-hero mmc-hero--empty">
          <h1>
            MehburMC <span>Launcher</span>
          </h1>
          <p>{t('mmc.home.welcome')}</p>
          <button type="button" className="mmc-btn mmc-btn--primary" onClick={() => go('profiles')}>
            <Plus aria-hidden="true" />
            {t('mmc.profiles.create')}
          </button>
        </section>
        <News info={info} />
      </div>
    );
  }

  const stage = STAGES.find((s) => progress < s.until) ?? STAGES[STAGES.length - 1];

  return (
    <div className="mmc-page">
      <section className="mmc-hero" key={profile.id}>
        <div className="mmc-hero__info">
          <ProfileTile icon={profile.icon} size={84} />
          <div className="mmc-hero__text">
            <div className="mmc-hero__badges">
              <Badge tone="accent">{profile.version}</Badge>
              <Badge>{LOADER_LABELS[profile.loader]}</Badge>
            </div>
            <h1 title={profile.name}>{profile.name}</h1>
            <div className="mmc-hero__meta">
              <span title={t('mmc.home.lastPlayed')}>
                <Clock aria-hidden="true" />
                {profile.lastPlayed ? formatDate(profile.lastPlayed) : t('mmc.home.never')}
              </span>
              <span title={t('mmc.home.playTime')}>
                <Timer aria-hidden="true" />
                {duration(profile.playSecs)}
              </span>
              <span title={t('mmc.home.memory')}>
                <MemoryStick aria-hidden="true" />
                {(profile.memoryMb / 1024).toFixed(1)} GB
              </span>
            </div>
          </div>
        </div>

        <div className="mmc-hero__actions">
          <button type="button" className="mmc-account" onClick={() => go('accounts')}>
            <span className="mmc-avatar mmc-avatar--sm" aria-hidden="true" />
            {t('mmc.accounts.player')}
          </button>
          {phase === 'preparing' ? (
            <div className="mmc-prep" role="status">
              <div className="mmc-prep__row">
                <span>{t(stage?.key ?? 'mmc.home.preparing')}</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="mmc-progress">
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="mmc-play"
              onClick={() => {
                setProgress(0);
                setPhase('preparing');
              }}
            >
              <Play aria-hidden="true" />
              {t('mmc.home.play')}
            </button>
          )}
        </div>
      </section>

      {state.profiles.length > 1 && (
        <section>
          <h2 className="mmc-h2">{t('mmc.home.switch')}</h2>
          <div className="mmc-switch">
            {state.profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.id === profile.id}
                onClick={() => profiles.select(p.id)}
              >
                <ProfileTile icon={p.icon} size={26} />
                <span className="mmc-switch__name">{p.name}</span>
                <span className="mmc-muted">{p.version}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <News info={info} />

      {phase === 'demo' && <DemoNotice onClose={() => setPhase('idle')} onGet={() => go('get')} />}
    </div>
  );
}

function DemoNotice({ onClose, onGet }: { onClose: () => void; onGet: () => void }) {
  const { t } = useI18n();
  const titleId = useId();
  const getRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getRef.current?.focus();
  }, []);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  }

  return (
    <div className="mmc-modal" onKeyDown={onKeyDown}>
      <div
        className="mmc-modal__box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="mmc-modal__close"
          aria-label={t('mmc.close')}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
        <img src="/brand/mehburmc-128.webp" alt="" width={56} height={56} />
        <h2 id={titleId}>{t('mmc.demo.title')}</h2>
        <p>{t('mmc.demo.body')}</p>
        <div className="mmc-modal__actions">
          <button type="button" className="mmc-btn mmc-btn--ghost" onClick={onClose}>
            {t('mmc.close')}
          </button>
          <button ref={getRef} type="button" className="mmc-btn mmc-btn--primary" onClick={onGet}>
            <CloudDownload aria-hidden="true" />
            {t('mmc.demo.download')}
          </button>
        </div>
      </div>
    </div>
  );
}

function News({ info }: { info: InfoState }) {
  const { t } = useI18n();
  const formatDate = useFormatDate();
  const items = info.info?.releases.slice(0, 3) ?? [];
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mmc-h2">
        <Newspaper aria-hidden="true" />
        {t('mmc.home.news')}
      </h2>
      <div className="mmc-news">
        {items.map((r, i) => {
          const first = parseNotes(r.notes).find((b) => b.kind !== 'heading');
          return (
            <a key={r.tag} className="mmc-news__card" href={r.url || RELEASES_PAGE} {...external}>
              <span className="mmc-news__img" aria-hidden="true">
                v{r.version}
              </span>
              <span className="mmc-news__body">
                <span className="mmc-news__date">
                  {i === 0 && <span className="mmc-news__new">{t('mmc.whatsNew.latest')}</span>}
                  {r.date && formatDate(r.date)}
                </span>
                <span className="mmc-news__title">{r.name}</span>
                {first && (
                  <span className="mmc-news__text">{first.parts.map((p) => p.text).join('')}</span>
                )}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Profiller */

export function ProfilesPage({ profiles, go }: { profiles: Profiles; go: Go }) {
  const { t } = useI18n();
  const [creating, setCreating] = useState(false);
  const { state } = profiles;

  return (
    <div className="mmc-page">
      <div className="mmc-head">
        <h1>{t('mmc.nav.profiles')}</h1>
        {!creating && (
          <button
            type="button"
            className="mmc-btn mmc-btn--primary"
            onClick={() => setCreating(true)}
          >
            <Plus aria-hidden="true" />
            {t('mmc.profiles.create')}
          </button>
        )}
      </div>

      {creating && (
        <CreateForm
          onCancel={() => setCreating(false)}
          onCreate={(input) => {
            profiles.create(input);
            setCreating(false);
            go('home');
          }}
        />
      )}

      {state.profiles.length === 0 && !creating && (
        <p className="mmc-muted">{t('mmc.profiles.empty')}</p>
      )}

      <ul className="mmc-cards">
        {state.profiles.map((p) => {
          const selected = p.id === state.selected;
          return (
            <li key={p.id} className={`mmc-card${selected ? ' mmc-card--on' : ''}`}>
              <ProfileTile icon={p.icon} />
              <div className="mmc-card__text">
                <strong>{p.name}</strong>
                <span className="mmc-muted">
                  {p.version} · {LOADER_LABELS[p.loader]}
                </span>
              </div>
              <button
                type="button"
                className="mmc-btn mmc-btn--sm"
                disabled={selected}
                onClick={() => profiles.select(p.id)}
              >
                {selected ? t('mmc.profiles.selected') : t('mmc.profiles.select')}
              </button>
              <button
                type="button"
                className="mmc-icon-btn"
                aria-label={t('mmc.profiles.delete', { name: p.name })}
                title={t('mmc.profiles.delete', { name: p.name })}
                onClick={() => profiles.remove(p.id)}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CreateForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (input: { name: string; version: string; loader: Loader; memoryMb: number }) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [version, setVersion] = useState(MC_VERSIONS[0] ?? '26.2');
  const [loader, setLoader] = useState<Loader>('fabric');
  const [memoryMb, setMemoryMb] = useState(4096);

  function submit(e: FormEvent) {
    e.preventDefault();
    const fallback = `${LOADER_LABELS[loader]} ${version}`;
    onCreate({ name: name.trim() || fallback, version, loader, memoryMb });
  }

  return (
    <form className="mmc-form" onSubmit={submit} aria-label={t('mmc.profiles.create')}>
      <label>
        <span>{t('mmc.profiles.name')}</span>
        <input
          value={name}
          maxLength={40}
          placeholder={`${LOADER_LABELS[loader]} ${version}`}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </label>
      <label>
        <span>{t('mmc.profiles.version')}</span>
        <select value={version} onChange={(e) => setVersion(e.target.value)}>
          {MC_VERSIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('mmc.profiles.loader')}</span>
        <select value={loader} onChange={(e) => setLoader(e.target.value as Loader)}>
          {LOADERS.map((l) => (
            <option key={l} value={l}>
              {LOADER_LABELS[l]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('mmc.profiles.memory')}</span>
        <select value={memoryMb} onChange={(e) => setMemoryMb(Number(e.target.value))}>
          {MEMORY_CHOICES.map((m) => (
            <option key={m} value={m}>
              {m / 1024} GB
            </option>
          ))}
        </select>
      </label>
      <div className="mmc-form__actions">
        <button type="button" className="mmc-btn mmc-btn--ghost" onClick={onCancel}>
          {t('mmc.cancel')}
        </button>
        <button type="submit" className="mmc-btn mmc-btn--primary">
          {t('mmc.profiles.save')}
        </button>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------- Hesaplar */

export function AccountsPage() {
  const { t } = useI18n();
  return (
    <div className="mmc-page">
      <div className="mmc-head">
        <h1>{t('mmc.nav.accounts')}</h1>
      </div>
      <ul className="mmc-cards">
        <li className="mmc-card mmc-card--on">
          <span className="mmc-avatar" aria-hidden="true" />
          <div className="mmc-card__text">
            <strong>{t('mmc.accounts.player')}</strong>
            <span className="mmc-muted">{t('mmc.accounts.demo')}</span>
          </div>
          <Badge>{t('mmc.accounts.offline')}</Badge>
          <Badge tone="ok">{t('mmc.accounts.active')}</Badge>
        </li>
      </ul>
      <div className="mmc-panel">
        <button type="button" className="mmc-btn" disabled>
          <span className="mmc-ms" aria-hidden="true" />
          {t('mmc.accounts.microsoft')}
        </button>
        <p className="mmc-muted">{t('mmc.accounts.hint')}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Launcher'ı indir */

function DownloadCard({
  os,
  title,
  desc,
  asset,
  recommended,
}: {
  os: 'windows' | 'linux';
  title: string;
  desc: string;
  asset?: ReleaseAsset;
  recommended: boolean;
}) {
  const { t, locale } = useI18n();
  return (
    <li className={`mmc-dl${recommended ? ' mmc-dl--rec' : ''}`} data-os={os}>
      <div className="mmc-dl__head">
        <strong>{title}</strong>
        {recommended && <Badge tone="accent">{t('mmc.get.recommended')}</Badge>}
      </div>
      <p className="mmc-muted">{desc}</p>
      {asset ? (
        <>
          <a
            className={`mmc-btn ${recommended ? 'mmc-btn--primary' : 'mmc-btn--ghost'}`}
            href={asset.url}
            rel="noopener noreferrer"
          >
            <CloudDownload aria-hidden="true" />
            {t('mmc.get.download', { os: title })}
          </a>
          <span className="mmc-dl__file">
            {asset.name} · {formatSize(asset.size, locale)}
          </span>
        </>
      ) : (
        <a className="mmc-btn mmc-btn--ghost" href={RELEASES_PAGE} {...external}>
          <ExternalLink aria-hidden="true" />
          {t('mmc.get.allReleases')}
        </a>
      )}
    </li>
  );
}

export function GetPage({ info }: { info: InfoState }) {
  const { t } = useI18n();
  const formatDate = useFormatDate();
  const platform = detectPlatform(navigator);
  const data = info.info;

  return (
    <div className="mmc-page">
      <section className="mmc-hero mmc-hero--empty">
        <img src="/brand/mehburmc-128.webp" alt="" width={64} height={64} />
        <h1>
          MehburMC <span>Launcher</span>
        </h1>
        <p>{t('mmc.get.lead')}</p>
        <p className="mmc-get__status" role="status">
          {info.status === 'loading' && t('mmc.loading')}
          {info.status === 'error' && t('mmc.get.error')}
          {data &&
            t('mmc.get.latest', {
              version: data.version,
              date: data.date ? formatDate(data.date) : '',
            })}
        </p>
      </section>

      {platform === 'mobile' && <p className="mmc-note">{t('mmc.get.mobile')}</p>}

      <ul className="mmc-dls">
        <DownloadCard
          os="windows"
          title="Windows"
          desc={t('mmc.get.windowsDesc')}
          asset={data?.windows}
          recommended={platform === 'windows'}
        />
        <DownloadCard
          os="linux"
          title="Linux"
          desc={t('mmc.get.linuxDesc')}
          asset={data?.linux}
          recommended={platform === 'linux'}
        />
      </ul>

      <div className="mmc-links">
        <a href={RELEASES_PAGE} {...external}>
          <ExternalLink aria-hidden="true" />
          {t('mmc.get.allReleases')}
        </a>
        <a href={OFFICIAL_SITE} {...external}>
          <Globe aria-hidden="true" />
          {t('mmc.get.site')}
        </a>
        <a href={`https://github.com/${LAUNCHER_REPO}`} {...external}>
          <CodeXml aria-hidden="true" />
          {t('mmc.get.source')}
        </a>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Yenilikler */

function Parts({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i}>{p.text}</strong>
        ) : p.code ? (
          <code key={i}>{p.text}</code>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

export function WhatsNewPage({ info }: { info: InfoState }) {
  const { t } = useI18n();
  const formatDate = useFormatDate();
  const releases = info.info?.releases.slice(0, 5) ?? [];

  return (
    <div className="mmc-page">
      <div className="mmc-head">
        <h1>{t('mmc.nav.whatsNew')}</h1>
      </div>
      {info.status === 'loading' && <p className="mmc-muted">{t('mmc.loading')}</p>}
      {info.status === 'error' && (
        <p className="mmc-note">
          {t('mmc.get.error')}{' '}
          <a href={RELEASES_PAGE} {...external}>
            {t('mmc.get.allReleases')}
          </a>
        </p>
      )}
      {releases.map((r, i) => (
        <article key={r.tag} className="mmc-release">
          <header>
            <h2>{r.name}</h2>
            {i === 0 && <Badge tone="accent">{t('mmc.whatsNew.latest')}</Badge>}
            <span className="mmc-muted">{r.date && formatDate(r.date)}</span>
          </header>
          <div className="mmc-notes">
            {parseNotes(r.notes).map((b, j) =>
              b.kind === 'heading' ? (
                <h3 key={j}>
                  <Parts parts={b.parts} />
                </h3>
              ) : b.kind === 'item' ? (
                <p key={j} className="mmc-notes__item">
                  <Parts parts={b.parts} />
                </p>
              ) : (
                <p key={j}>
                  <Parts parts={b.parts} />
                </p>
              ),
            )}
          </div>
          {r.url && (
            <a className="mmc-link" href={r.url} {...external}>
              <ExternalLink aria-hidden="true" />
              {t('mmc.whatsNew.onGitHub')}
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------- Demoda olmayan sayfalar */

export function LockedPage({ title, icon: Icon, go }: { title: string; icon: LucideIcon; go: Go }) {
  const { t } = useI18n();
  return (
    <div className="mmc-page mmc-locked">
      <Icon aria-hidden="true" />
      <h1>{t('mmc.locked.title', { page: title })}</h1>
      <p className="mmc-muted">{t('mmc.locked.body', { page: title })}</p>
      <button type="button" className="mmc-btn mmc-btn--primary" onClick={() => go('get')}>
        <CloudDownload aria-hidden="true" />
        {t('mmc.demo.download')}
      </button>
    </div>
  );
}
