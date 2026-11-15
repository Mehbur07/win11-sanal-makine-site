import {
  Boxes,
  Compass,
  Download,
  CloudDownload,
  Play,
  Server,
  Settings,
  Shirt,
  Sparkles,
  SquareTerminal,
  ToggleRight,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/messages.ts';
import './Launcher.css';
import {
  AccountsPage,
  GetPage,
  HomePage,
  LockedPage,
  ProfilesPage,
  WhatsNewPage,
} from './pages.tsx';
import {
  addProfile,
  loadProfiles,
  removeProfile,
  saveProfiles,
  type NewProfile,
  type ProfilesState,
} from './profiles.ts';
import { loadLauncherInfo, type LauncherInfo } from './releases.ts';

export type View =
  | 'home'
  | 'profiles'
  | 'browse'
  | 'modToggle'
  | 'accounts'
  | 'skins'
  | 'friends'
  | 'servers'
  | 'downloads'
  | 'console'
  | 'get'
  | 'whatsNew'
  | 'settings';

// Kenar çubuğu gerçek launcher'daki sırayla; demoda olmayan sayfalar LockedPage gösterir
const TOP: { view: View; icon: LucideIcon; key: MessageKey }[] = [
  { view: 'home', icon: Play, key: 'mmc.nav.home' },
  { view: 'profiles', icon: Boxes, key: 'mmc.nav.profiles' },
  { view: 'browse', icon: Compass, key: 'mmc.nav.browse' },
  { view: 'modToggle', icon: ToggleRight, key: 'mmc.nav.modToggle' },
  { view: 'accounts', icon: UserRound, key: 'mmc.nav.accounts' },
  { view: 'skins', icon: Shirt, key: 'mmc.nav.skins' },
  { view: 'friends', icon: Users, key: 'mmc.nav.friends' },
  { view: 'servers', icon: Server, key: 'mmc.nav.servers' },
  { view: 'downloads', icon: Download, key: 'mmc.nav.downloads' },
  { view: 'console', icon: SquareTerminal, key: 'mmc.nav.console' },
];
const BOTTOM: { view: View; icon: LucideIcon; key: MessageKey }[] = [
  { view: 'get', icon: CloudDownload, key: 'mmc.nav.get' },
  { view: 'whatsNew', icon: Sparkles, key: 'mmc.nav.whatsNew' },
  { view: 'settings', icon: Settings, key: 'mmc.nav.settings' },
];
const NAV = [...TOP, ...BOTTOM];
const DEMO_PAGES = new Set<View>(['home', 'profiles', 'accounts', 'get', 'whatsNew']);

export type InfoState = { status: 'loading' | 'ok' | 'error'; info: LauncherInfo | null };

// MehburMC Launcher demosu: gerçek launcher'ın arayüzünü taklit eder. Oyun tarayıcıda
// başlatılamaz; "Oyna" bunu söyler ve gerçek launcher'ın indirme sayfasına yönlendirir.
export function Launcher() {
  const { t } = useI18n();
  const [view, setView] = useState<View>('home');
  const [state, setState] = useState<ProfilesState>(loadProfiles);
  const [info, setInfo] = useState<InfoState>({ status: 'loading', info: null });

  useEffect(() => {
    let alive = true;
    void loadLauncherInfo().then((result) => {
      if (alive) setInfo({ status: result ? 'ok' : 'error', info: result });
    });
    return () => {
      alive = false;
    };
  }, []);

  function update(next: ProfilesState) {
    setState(next);
    saveProfiles(next);
  }

  const profiles = {
    state,
    select: (id: string) => update({ ...state, selected: id }),
    create: (input: NewProfile) => update(addProfile(state, input, `p${Date.now().toString(36)}`)),
    remove: (id: string) => update(removeProfile(state, id)),
  };

  const navButton = ({ view: v, icon: Icon, key }: (typeof NAV)[number]) => (
    <li key={v}>
      <button
        type="button"
        className={`mmc-nav__item${v === 'get' ? ' mmc-nav__item--get' : ''}`}
        aria-current={view === v ? 'page' : undefined}
        onClick={() => setView(v)}
      >
        <Icon aria-hidden="true" />
        <span>{t(key)}</span>
      </button>
    </li>
  );

  const current = NAV.find((n) => n.view === view);

  return (
    <div className="mmc">
      <header className="mmc-brand">
        <img src="/brand/mehburmc-128.webp" alt="" width={24} height={24} />
        <span className="mmc-brand__name">
          MehburMC <span>Launcher</span>
        </span>
        {info.info && <span className="mmc-brand__ver">v{info.info.version}</span>}
        <span className="mmc-brand__demo" title={t('mmc.demoHint')}>
          {t('mmc.demo')}
        </span>
      </header>

      <div className="mmc-body">
        <nav className="mmc-nav" aria-label={t('mmc.nav.label')}>
          <ul>{TOP.map(navButton)}</ul>
          <ul className="mmc-nav__bottom">{BOTTOM.map(navButton)}</ul>
        </nav>

        <main className="mmc-main" key={view}>
          {view === 'home' && <HomePage profiles={profiles} info={info} go={setView} />}
          {view === 'profiles' && <ProfilesPage profiles={profiles} go={setView} />}
          {view === 'accounts' && <AccountsPage />}
          {view === 'get' && <GetPage info={info} />}
          {view === 'whatsNew' && <WhatsNewPage info={info} />}
          {!DEMO_PAGES.has(view) && current && (
            <LockedPage title={t(current.key)} icon={current.icon} go={setView} />
          )}
        </main>
      </div>
    </div>
  );
}

export type Profiles = {
  state: ProfilesState;
  select: (id: string) => void;
  create: (input: NewProfile) => void;
  remove: (id: string) => void;
};
