// Launcher demosunun profilleri (gerçek launcher'daki "instance"lar). Oyun indirilmediği için
// yalnızca arayüzde görünen bilgiler tutulur; tarayıcıda localStorage'a kaydedilir.

export const LOADERS = ['vanilla', 'fabric', 'quilt', 'forge', 'neoforge'] as const;
export type Loader = (typeof LOADERS)[number];

export const LOADER_LABELS: Record<Loader, string> = {
  vanilla: 'Vanilla',
  fabric: 'Fabric',
  quilt: 'Quilt',
  forge: 'Forge',
  neoforge: 'NeoForge',
};

/** Profil oluştururken seçilebilen Minecraft sürümleri (yeniden eskiye) */
export const MC_VERSIONS = [
  '26.2',
  '26.1',
  '1.21.11',
  '1.21.10',
  '1.21.8',
  '1.21.4',
  '1.21.1',
  '1.20.6',
  '1.20.4',
  '1.20.1',
  '1.19.4',
  '1.18.2',
  '1.16.5',
  '1.12.2',
  '1.8.9',
  '1.7.10',
];

export const ICONS = ['grass', 'diamond', 'stone', 'redstone', 'gold'] as const;
export type ProfileIcon = (typeof ICONS)[number];

export const MEMORY_CHOICES = [2048, 4096, 6144, 8192];

export interface Profile {
  id: string;
  name: string;
  version: string;
  loader: Loader;
  icon: ProfileIcon;
  memoryMb: number;
  playSecs: number;
  /** Son oynama zamanı (ms); hiç oynanmadıysa null */
  lastPlayed: number | null;
}

export interface ProfilesState {
  profiles: Profile[];
  selected: string | null;
}

const KEY = 'vmos:mmc:profiles';
const HOUR = 3600;
const DAY = 24 * HOUR * 1000;

/** İlk açılışta görünen örnek profiller */
export function defaultProfiles(now = Date.now()): ProfilesState {
  return {
    selected: 'smp',
    profiles: [
      {
        id: 'smp',
        name: 'MehburMC SMP',
        version: '26.2',
        loader: 'fabric',
        icon: 'grass',
        memoryMb: 6144,
        playSecs: 42 * HOUR + 18 * 60,
        lastPlayed: now - DAY,
      },
      {
        id: 'perf',
        name: 'Fabric Performans',
        version: '1.21.11',
        loader: 'fabric',
        icon: 'diamond',
        memoryMb: 4096,
        playSecs: 12 * HOUR + 5 * 60,
        lastPlayed: now - 6 * DAY,
      },
      {
        id: 'vanilla',
        name: 'Vanilla',
        version: '26.2',
        loader: 'vanilla',
        icon: 'stone',
        memoryMb: 4096,
        playSecs: 0,
        lastPlayed: null,
      },
    ],
  };
}

const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback;

/** Kayıttan okunan bilinmeyen veriyi doğrular; bozuksa null döner */
export function parseProfiles(raw: unknown): ProfilesState | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as { profiles?: unknown; selected?: unknown };
  if (!Array.isArray(data.profiles)) return null;
  const profiles: Profile[] = [];
  for (const p of data.profiles as Record<string, unknown>[]) {
    if (!p || typeof p.id !== 'string' || typeof p.name !== 'string') continue;
    profiles.push({
      id: p.id,
      name: p.name.slice(0, 40),
      version: typeof p.version === 'string' ? p.version : (MC_VERSIONS[0] ?? '26.2'),
      loader: oneOf(LOADERS, p.loader, 'vanilla'),
      icon: oneOf(ICONS, p.icon, 'grass'),
      memoryMb: typeof p.memoryMb === 'number' ? p.memoryMb : 4096,
      playSecs: typeof p.playSecs === 'number' ? p.playSecs : 0,
      lastPlayed: typeof p.lastPlayed === 'number' ? p.lastPlayed : null,
    });
  }
  const selected =
    typeof data.selected === 'string' && profiles.some((p) => p.id === data.selected)
      ? data.selected
      : (profiles[0]?.id ?? null);
  return { profiles, selected };
}

export function loadProfiles(): ProfilesState {
  try {
    const parsed = parseProfiles(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
    if (parsed) return parsed;
  } catch {
    /* bozuk kayıt: örnek profillerle başla */
  }
  return defaultProfiles();
}

export function saveProfiles(state: ProfilesState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* depolama kapalıysa değişiklik yalnızca bu oturumda kalır */
  }
}

export interface NewProfile {
  name: string;
  version: string;
  loader: Loader;
  memoryMb: number;
}

/** Yeni profil ekler ve onu seçili yapar */
export function addProfile(state: ProfilesState, input: NewProfile, id: string): ProfilesState {
  const icon = ICONS[state.profiles.length % ICONS.length] ?? 'grass';
  const profile: Profile = {
    id,
    name: input.name.trim().slice(0, 40) || input.version,
    version: input.version,
    loader: input.loader,
    icon,
    memoryMb: input.memoryMb,
    playSecs: 0,
    lastPlayed: null,
  };
  return { profiles: [...state.profiles, profile], selected: id };
}

export function removeProfile(state: ProfilesState, id: string): ProfilesState {
  const profiles = state.profiles.filter((p) => p.id !== id);
  const selected = state.selected === id ? (profiles[0]?.id ?? null) : state.selected;
  return { profiles, selected };
}

/** "42 sa 18 dk" gibi oynama süresi için saat ve dakika */
export function splitDuration(secs: number): { h: number; m: number } {
  const total = Math.max(0, Math.floor(secs / 60));
  return { h: Math.floor(total / 60), m: total % 60 };
}
