// MehburMC Launcher'ın sürüm bilgisi GitHub Releases'ten okunur.
// Windows sürümü normal sürüm olarak (v0.32.0), Linux sürümü ayrı bir ön sürüm olarak
// (v0.32.0-linux) yayınlanıyor; ikisi burada tek bir özet bilgide birleştirilir.

export const LAUNCHER_REPO = 'Mehbur07/MehburMC-Launcher';
export const RELEASES_API = `https://api.github.com/repos/${LAUNCHER_REPO}/releases?per_page=20`;
export const RELEASES_PAGE = `https://github.com/${LAUNCHER_REPO}/releases/latest`;
export const OFFICIAL_SITE = 'https://mehburmc.github.io/';

const CACHE_KEY = 'vmos:mmc:releases';
/** GitHub, giriş yapılmadan saatte 60 istek veriyor; 10 dakikalık önbellek bu sınırı korur */
export const CACHE_MS = 10 * 60 * 1000;

const PATTERNS = { windows: /_x64-setup\.exe$/i, linux: /_amd64\.deb$/i };

export interface ReleaseAsset {
  name: string;
  size: number;
  url: string;
}

export interface Release {
  tag: string;
  name: string;
  /** Baştaki "v" ve sondaki "-linux" atılmış sürüm: 0.32.0 */
  version: string;
  date: string;
  notes: string;
  url: string;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

export interface LauncherInfo {
  version: string;
  date: string;
  windows?: ReleaseAsset;
  linux?: ReleaseAsset;
  /** "Yenilikler" sayfası için: Linux kopyaları çıkarılmış, yeniden eskiye sürümler */
  releases: Release[];
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export function versionOf(tag: string): string {
  return tag.replace(/^v/i, '').replace(/-linux$/i, '');
}

/** GitHub API'nin cevabını (bilinmeyen veri) güvenli biçimde Release listesine çevirir */
export function parseReleases(raw: unknown): Release[] {
  if (!Array.isArray(raw)) return [];
  const out: Release[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    if (!r || typeof r !== 'object' || r.draft === true) continue;
    const tag = str(r.tag_name);
    if (!tag) continue;
    const assets = Array.isArray(r.assets) ? (r.assets as Record<string, unknown>[]) : [];
    out.push({
      tag,
      name: str(r.name) || tag,
      version: versionOf(tag),
      date: str(r.published_at),
      notes: str(r.body),
      url: str(r.html_url),
      prerelease: r.prerelease === true,
      assets: assets
        .map((a) => ({
          name: str(a.name),
          size: typeof a.size === 'number' ? a.size : 0,
          url: str(a.browser_download_url),
        }))
        // Yalnızca GitHub'ın kendi indirme adresleri kabul edilir
        .filter((a) => a.name && a.url.startsWith('https://github.com/')),
    });
  }
  return out;
}

const findAsset = (releases: Release[], pattern: RegExp) => {
  for (const r of releases) {
    const asset = r.assets.find((a) => pattern.test(a.name));
    if (asset) return { release: r, asset };
  }
  return undefined;
};

/** Sürüm listesinden en güncel Windows/Linux dosyalarını ve sürüm numarasını çıkarır */
export function summarize(releases: Release[]): LauncherInfo | null {
  const win = findAsset(releases, PATTERNS.windows);
  const linux = findAsset(releases, PATTERNS.linux);
  const main = win?.release ?? releases.find((r) => !r.prerelease) ?? releases[0];
  if (!main) return null;
  return {
    version: main.version,
    date: main.date,
    windows: win?.asset,
    linux: linux?.asset,
    releases: releases.filter((r) => !/-linux$/i.test(r.tag)),
  };
}

interface Cached {
  at: number;
  releases: Release[];
}

function readCache(): Cached | null {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cached | null;
    if (value && typeof value.at === 'number' && Array.isArray(value.releases)) return value;
  } catch {
    /* bozuk veya erişilemeyen önbellek yok sayılır */
  }
  return null;
}

function writeCache(releases: Release[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), releases }));
  } catch {
    /* depolama kapalıysa önbelleksiz devam edilir */
  }
}

let pending: Promise<LauncherInfo | null> | null = null;

/**
 * Sürüm bilgisini getirir. 10 dakikadan yeni önbellek varsa ağa çıkmaz; ağ hatasında
 * eski önbellek kullanılır. Aynı anda gelen istekler tek bir isteği paylaşır.
 */
export function loadLauncherInfo(fetcher: typeof fetch = fetch): Promise<LauncherInfo | null> {
  const cached = readCache();
  if (cached && Date.now() - cached.at < CACHE_MS)
    return Promise.resolve(summarize(cached.releases));
  pending ??= fetcher(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(async (res) => {
      if (!res.ok) throw new Error(`GitHub ${res.status}`);
      const releases = parseReleases(await res.json());
      if (releases.length === 0) throw new Error('empty');
      writeCache(releases);
      return summarize(releases);
    })
    .catch(() => (cached ? summarize(cached.releases) : null))
    .finally(() => {
      pending = null;
    });
  return pending;
}

export type Platform = 'windows' | 'linux' | 'mac' | 'mobile' | 'unknown';

/** Ziyaretçinin sistemi (önerilen indirmeyi öne çıkarmak için) */
export function detectPlatform(
  nav: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> & {
    platform?: string;
    userAgentData?: { platform?: string };
  },
): Platform {
  const ua = nav.userAgent || '';
  const platform = nav.userAgentData?.platform || nav.platform || '';
  // Telefon önce: Android'in tanıtım yazısında da "Linux" geçer; iPad kendini Mac gösterir
  if (/Android|iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(platform) && nav.maxTouchPoints > 1))
    return 'mobile';
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';
  if (/Mac/i.test(platform) || /Mac OS X/i.test(ua)) return 'mac';
  if (/Linux|X11|CrOS/i.test(`${platform} ${ua}`)) return 'linux';
  return 'unknown';
}

export function formatSize(bytes: number, locale: string): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
}
