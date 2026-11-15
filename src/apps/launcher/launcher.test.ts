import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseInline, parseNotes } from './notes.ts';
import {
  addProfile,
  defaultProfiles,
  loadProfiles,
  parseProfiles,
  removeProfile,
  saveProfiles,
  splitDuration,
} from './profiles.ts';
import {
  CACHE_MS,
  detectPlatform,
  loadLauncherInfo,
  parseReleases,
  summarize,
  versionOf,
} from './releases.ts';

// GitHub API cevabının sadeleştirilmiş örneği (yeniden eskiye)
const RAW = [
  {
    tag_name: 'v0.32.0-linux',
    name: 'MehburMC Launcher v0.32.0 (Linux)',
    prerelease: true,
    published_at: '2026-11-10T20:41:06Z',
    html_url: 'https://github.com/Mehbur07/MehburMC-Launcher/releases/tag/v0.32.0-linux',
    body: 'Linux',
    assets: [
      {
        name: 'MehburMC-Launcher_0.32.0_amd64.deb',
        size: 7_000_000,
        browser_download_url: 'https://github.com/x/releases/download/v0.32.0-linux/a.deb',
      },
    ],
  },
  {
    tag_name: 'v0.32.0',
    name: 'MehburMC Launcher v0.32.0',
    prerelease: false,
    published_at: '2026-11-10T20:40:58Z',
    html_url: 'https://github.com/Mehbur07/MehburMC-Launcher/releases/tag/v0.32.0',
    body: '### Eklendi\n- **Admine yaz:** yeni sayfa',
    assets: [
      {
        name: 'MehburMC-Launcher_0.32.0_x64-setup.exe',
        size: 5_827_282,
        browser_download_url: 'https://github.com/x/releases/download/v0.32.0/a.exe',
      },
      { name: 'kötü.exe', size: 1, browser_download_url: 'https://evil.example/a.exe' },
    ],
  },
  { tag_name: 'v0.33.0-taslak', draft: true, assets: [] },
  {
    tag_name: 'v0.31.2',
    name: 'MehburMC Launcher v0.31.2',
    prerelease: false,
    published_at: '2026-11-03T19:42:41Z',
    body: '',
    assets: [],
  },
];

describe('releases', () => {
  it('sürüm etiketinden numarayı çıkarır', () => {
    expect(versionOf('v0.32.0')).toBe('0.32.0');
    expect(versionOf('v0.32.0-linux')).toBe('0.32.0');
  });

  it('taslakları ve GitHub dışı indirme adreslerini atar', () => {
    const list = parseReleases(RAW);
    expect(list.map((r) => r.tag)).toEqual(['v0.32.0-linux', 'v0.32.0', 'v0.31.2']);
    expect(list[1]?.assets.map((a) => a.name)).toEqual(['MehburMC-Launcher_0.32.0_x64-setup.exe']);
    expect(parseReleases({ message: 'rate limit' })).toEqual([]);
  });

  it('Windows ve Linux dosyalarını birleştirir, Yenilikler listesinden Linux kopyasını çıkarır', () => {
    const info = summarize(parseReleases(RAW));
    expect(info?.version).toBe('0.32.0');
    expect(info?.windows?.name).toMatch(/_x64-setup\.exe$/);
    expect(info?.linux?.name).toMatch(/_amd64\.deb$/);
    expect(info?.releases.map((r) => r.tag)).toEqual(['v0.32.0', 'v0.31.2']);
    expect(summarize([])).toBeNull();
  });

  it('sistemi tanır (telefon önce)', () => {
    const nav = (userAgent: string, platform = '', maxTouchPoints = 0) => ({
      userAgent,
      platform,
      maxTouchPoints,
    });
    expect(detectPlatform(nav('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32'))).toBe(
      'windows',
    );
    expect(detectPlatform(nav('Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64'))).toBe('linux');
    expect(detectPlatform(nav('Mozilla/5.0 (Linux; Android 14)', 'Linux armv8l', 5))).toBe(
      'mobile',
    );
    expect(detectPlatform(nav('Mozilla/5.0 (Macintosh)', 'MacIntel', 5))).toBe('mobile');
    expect(detectPlatform(nav('Mozilla/5.0 (Macintosh)', 'MacIntel'))).toBe('mac');
  });

  describe('loadLauncherInfo', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => vi.useRealTimers());

    const ok = () =>
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(RAW), { status: 200 })));

    it('ilk istekte ağa çıkar, sonra 10 dakika önbellekten okur', async () => {
      const fetcher = ok();
      expect((await loadLauncherInfo(fetcher))?.version).toBe('0.32.0');
      expect((await loadLauncherInfo(fetcher))?.version).toBe('0.32.0');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('ağ hatasında eski önbelleği kullanır, önbellek yoksa null döner', async () => {
      const failing = vi.fn(() => Promise.reject(new Error('offline')));
      expect(await loadLauncherInfo(failing)).toBeNull();

      await loadLauncherInfo(ok());
      vi.useFakeTimers({ now: Date.now() + CACHE_MS + 1000 });
      expect((await loadLauncherInfo(failing))?.version).toBe('0.32.0');
      expect(failing).toHaveBeenCalledTimes(2);
    });
  });
});

describe('profiles', () => {
  beforeEach(() => localStorage.clear());

  it('ilk açılışta örnek profiller gelir, kaydedilen geri okunur', () => {
    expect(loadProfiles().profiles).toHaveLength(3);
    const state = addProfile(
      defaultProfiles(),
      { name: '  Deneme  ', version: '1.20.1', loader: 'forge', memoryMb: 2048 },
      'yeni',
    );
    saveProfiles(state);
    const back = loadProfiles();
    expect(back.selected).toBe('yeni');
    expect(back.profiles.at(-1)).toMatchObject({ name: 'Deneme', loader: 'forge', playSecs: 0 });
  });

  it('bozuk kaydı düzeltir veya yok sayar', () => {
    expect(parseProfiles(null)).toBeNull();
    const fixed = parseProfiles({
      selected: 'yok',
      profiles: [{ id: 'a', name: 'A', loader: 'hile', icon: 1 }, { name: 'kimliksiz' }],
    });
    expect(fixed?.profiles).toHaveLength(1);
    expect(fixed?.profiles[0]).toMatchObject({ loader: 'vanilla', icon: 'grass' });
    expect(fixed?.selected).toBe('a');
  });

  it('seçili profil silinince ilk profil seçilir', () => {
    const state = removeProfile(defaultProfiles(), 'smp');
    expect(state.selected).toBe('perf');
    expect(removeProfile({ profiles: [], selected: null }, 'x').selected).toBeNull();
  });

  it('oynama süresini saat ve dakikaya böler', () => {
    expect(splitDuration(42 * 3600 + 18 * 60 + 59)).toEqual({ h: 42, m: 18 });
    expect(splitDuration(-5)).toEqual({ h: 0, m: 0 });
  });
});

describe('notes', () => {
  it('kalın ve kod parçalarını ayırır', () => {
    expect(parseInline('**İndir:** `a.exe` dosyası')).toEqual([
      { text: 'İndir:', bold: true },
      { text: ' ' },
      { text: 'a.exe', code: true },
      { text: ' dosyası' },
    ]);
  });

  it('başlık, madde ve devam satırlarını bloklara ayırır', () => {
    const blocks = parseNotes('### Eklendi\n- Bir\n  devamı\n- İki\n\nSon paragraf');
    expect(blocks.map((b) => [b.kind, b.parts.map((p) => p.text).join('')])).toEqual([
      ['heading', 'Eklendi'],
      ['item', 'Bir devamı'],
      ['item', 'İki'],
      ['text', 'Son paragraf'],
    ]);
  });
});
