import type { Lang } from '../../i18n/lang.ts';
import { copyEntry, isHidden, moveEntry, moveToTrash, renameEntry } from '../../storage/fileOps.ts';
import { baseName, parentOf, validateName } from '../../storage/names.ts';
import { StorageError, type Path, type StorageBackend } from '../../storage/types.ts';
import { appForFile } from '../openWith.ts';
import type { AppArgs, AppId } from '../types.ts';

// "msh" — VirtualMOS'un küçük kabuğu (shell). Ekrandan bağımsızdır: bir komut satırı alır,
// dosyalar üzerinde çalışır ve yazdırılacak satırları döndürür. Birim testlerle denetlenir.

export interface OutLine {
  text: string;
  kind?: 'error' | 'accent' | 'muted' | 'art';
}

export interface ShellIO {
  backend: StorageBackend;
  cwd: Path;
  lang: Lang;
  history: string[];
  storageLabel: string;
  startedAt: number;
  openApp?: (app: AppId, args?: AppArgs) => void;
  setTheme?: (theme: 'dark' | 'light') => void;
  setLang?: (lang: Lang) => void;
  closeWindow?: () => void;
}

export interface ShellResult {
  lines: OutLine[];
  cwd?: Path;
  clear?: boolean;
}

export const USER = 'mehbur';
export const HOST = 'virtualmos';

const APP_IDS: AppId[] = [
  'files',
  'editor',
  'calculator',
  'paint',
  'photos',
  'terminal',
  'browser',
  'settings',
  'about',
  'mehburmc',
];

const MSG = {
  tr: {
    welcome: "VirtualMOS Terminal (msh) — komutları görmek için 'help' yaz.",
    notFound: 'komut bulunamadı',
    noSuch: 'böyle bir dosya ya da klasör yok',
    notDir: 'bir klasör değil',
    isDir: 'bir klasör',
    exists: 'zaten var',
    missing: 'eksik bilgi. Kullanım',
    tooBig: 'dosya çok büyük (en fazla 100 KB gösterilir)',
    badName: 'geçersiz ad',
    trashed: 'çöp kutusuna taşındı',
    unknownApp: 'açılacak uygulama ya da dosya bulunamadı',
    noApp: 'bu dosya türünü açan uygulama yok',
    themeSet: 'tema değişti',
    langSet: 'dil değişti',
    intoItself: 'bir klasör kendi içine taşınamaz',
    help: [
      ['help', 'bu listeyi gösterir'],
      ['ls [klasör]', 'klasörün içindekileri listeler (dir de olur, -a gizlileri de gösterir)'],
      ['cd [klasör]', 'klasöre girer (cd .. üst klasör, cd ~ ana klasör)'],
      ['pwd', 'bulunduğun klasörü yazar'],
      ['cat <dosya>', 'dosyanın içeriğini yazar (type de olur)'],
      ['echo <metin> [> dosya]', 'metni yazar; > ile dosyaya kaydeder, >> ile sonuna ekler'],
      ['mkdir <ad>', 'yeni klasör oluşturur'],
      ['touch <dosya>', 'boş dosya oluşturur'],
      ['rm <yol>', 'çöp kutusuna taşır (del de olur)'],
      ['cp <kaynak> <hedef>', 'kopyalar'],
      ['mv <kaynak> <hedef>', 'taşır ya da yeniden adlandırır'],
      ['open <uygulama|dosya>', 'uygulama ya da dosya açar (ör. open paint, open not.txt)'],
      ['neofetch', 'sistem bilgisi'],
      ['date, whoami, history', 'tarih, kullanıcı, komut geçmişi'],
      ['theme dark|light', 'temayı değiştirir'],
      ['lang tr|en', 'dili değiştirir'],
      ['clear', 'ekranı temizler (Ctrl+L)'],
      ['exit', 'terminali kapatır'],
    ],
    tips: 'İpucu: Tab tuşu dosya adlarını tamamlar, ↑ ↓ önceki komutları getirir.',
    fetch: {
      os: 'İşletim sistemi',
      shell: 'Kabuk',
      screen: 'Ekran',
      theme: 'Tema',
      lang: 'Dil',
      storage: 'Depolama',
      uptime: 'Açık kalma',
      minutes: 'dk',
    },
  },
  en: {
    welcome: "VirtualMOS Terminal (msh) — type 'help' to see the commands.",
    notFound: 'command not found',
    noSuch: 'no such file or folder',
    notDir: 'not a folder',
    isDir: 'is a folder',
    exists: 'already exists',
    missing: 'missing operand. Usage',
    tooBig: 'file is too big (up to 100 KB is shown)',
    badName: 'invalid name',
    trashed: 'moved to trash',
    unknownApp: 'no app or file to open',
    noApp: 'no app opens this file type',
    themeSet: 'theme changed',
    langSet: 'language changed',
    intoItself: 'a folder cannot be moved into itself',
    help: [
      ['help', 'shows this list'],
      ['ls [folder]', 'lists a folder (also dir; -a shows hidden items)'],
      ['cd [folder]', 'enters a folder (cd .. parent, cd ~ home)'],
      ['pwd', 'prints the current folder'],
      ['cat <file>', 'prints a file (also type)'],
      ['echo <text> [> file]', 'prints text; > saves to a file, >> appends'],
      ['mkdir <name>', 'creates a folder'],
      ['touch <file>', 'creates an empty file'],
      ['rm <path>', 'moves to trash (also del)'],
      ['cp <source> <target>', 'copies'],
      ['mv <source> <target>', 'moves or renames'],
      ['open <app|file>', 'opens an app or a file (e.g. open paint, open note.txt)'],
      ['neofetch', 'system information'],
      ['date, whoami, history', 'date, user, command history'],
      ['theme dark|light', 'changes the theme'],
      ['lang tr|en', 'changes the language'],
      ['clear', 'clears the screen (Ctrl+L)'],
      ['exit', 'closes the terminal'],
    ],
    tips: 'Tip: Tab completes file names, ↑ ↓ bring back earlier commands.',
    fetch: {
      os: 'OS',
      shell: 'Shell',
      screen: 'Resolution',
      theme: 'Theme',
      lang: 'Language',
      storage: 'Storage',
      uptime: 'Uptime',
      minutes: 'min',
    },
  },
} as const;

export function welcome(lang: Lang): OutLine[] {
  return [{ text: MSG[lang].welcome, kind: 'accent' }];
}

/** Komut satırını parçalara ayırır; "çift tırnak" içindeki boşluklar korunur */
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) tokens.push(m[1] ?? m[2] ?? m[3] ?? '');
  return tokens;
}

/** "Belgeler/../Resimler", "~/x", "/x" gibi yolları çözer */
export function resolvePath(cwd: Path, arg: string): Path {
  const absolute = arg.startsWith('/') || arg === '~' || arg.startsWith('~/');
  const parts = absolute ? [] : [...cwd];
  for (const part of arg.replace(/^~/, '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts;
}

export function formatPath(path: Path): string {
  return path.length ? `~/${path.join('/')}` : '~';
}

export function prompt(cwd: Path): string {
  return `${USER}@${HOST}:${formatPath(cwd)}$`;
}

const NEOFETCH_ART = [
  '  ███╗   ███╗ ██████╗ ███████╗',
  '  ████╗ ████║██╔═══██╗██╔════╝',
  '  ██╔████╔██║██║   ██║███████╗',
  '  ██║╚██╔╝██║██║   ██║╚════██║',
  '  ██║ ╚═╝ ██║╚██████╔╝███████║',
  '  ╚═╝     ╚═╝ ╚═════╝ ╚══════╝',
];

export async function runCommand(line: string, io: ShellIO): Promise<ShellResult> {
  const m = MSG[io.lang];
  const tokens = tokenize(line.trim());
  const [cmd = '', ...args] = tokens;
  const err = (text: string): ShellResult => ({
    lines: [{ text: `${cmd}: ${text}`, kind: 'error' }],
  });
  const out = (...texts: string[]): ShellResult => ({ lines: texts.map((text) => ({ text })) });
  const usage = (u: string) => err(`${m.missing}: ${u}`);
  const fs = io.backend;

  try {
    switch (cmd.toLowerCase()) {
      case '':
        return { lines: [] };

      case 'help':
        return {
          lines: [
            ...m.help.map(([c, d]) => ({ text: `  ${c.padEnd(24)} ${d}` })),
            { text: '' },
            { text: m.tips, kind: 'muted' as const },
          ],
        };

      case 'clear':
      case 'cls':
        return { lines: [], clear: true };

      case 'pwd':
        return out(formatPath(io.cwd));

      case 'whoami':
        return out(USER);

      case 'date':
        return out(new Date().toLocaleString(io.lang === 'tr' ? 'tr-TR' : 'en-US'));

      case 'history':
        return out(...io.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`));

      case 'ls':
      case 'dir': {
        const showAll = args.includes('-a');
        const target = args.find((a) => !a.startsWith('-'));
        const dir = target ? resolvePath(io.cwd, target) : io.cwd;
        const kind = await fs.stat(dir);
        if (!kind) return err(`${target}: ${m.noSuch}`);
        if (kind === 'file') return out(baseName(dir));
        const entries = (await fs.list(dir))
          .filter((e) => showAll || !isHidden(e.name))
          .sort((a, b) =>
            a.kind !== b.kind ? (a.kind === 'dir' ? -1 : 1) : a.name.localeCompare(b.name),
          );
        return {
          lines: entries.map((e) => ({
            text: e.kind === 'dir' ? `${e.name}/` : e.name,
            kind: e.kind === 'dir' ? ('accent' as const) : undefined,
          })),
        };
      }

      case 'cd': {
        const dir = resolvePath(io.cwd, args[0] ?? '~');
        const kind = await fs.stat(dir);
        if (!kind) return err(`${args[0]}: ${m.noSuch}`);
        if (kind !== 'dir') return err(`${args[0]}: ${m.notDir}`);
        return { lines: [], cwd: dir };
      }

      case 'cat':
      case 'type': {
        if (!args[0]) return usage(`${cmd} <dosya>`);
        const file = resolvePath(io.cwd, args[0]);
        const kind = await fs.stat(file);
        if (!kind) return err(`${args[0]}: ${m.noSuch}`);
        if (kind === 'dir') return err(`${args[0]}: ${m.isDir}`);
        const blob = await fs.read(file);
        if (blob.size > 100 * 1024) return err(`${args[0]}: ${m.tooBig}`);
        return out(...(await blob.text()).replace(/\n$/, '').split('\n'));
      }

      case 'echo': {
        const redirect = args.findIndex((a) => a === '>' || a === '>>');
        if (redirect === -1) return out(args.join(' '));
        const target = args[redirect + 1];
        if (!target) return usage('echo <metin> > <dosya>');
        const text = `${args.slice(0, redirect).join(' ')}\n`;
        const file = resolvePath(io.cwd, target);
        if (validateName(baseName(file))) return err(`${target}: ${m.badName}`);
        const existing = await fs.stat(file);
        if (existing === 'dir') return err(`${target}: ${m.isDir}`);
        const before =
          args[redirect] === '>>' && existing ? await (await fs.read(file)).text() : '';
        await fs.write(file, before + text);
        return { lines: [] };
      }

      case 'mkdir': {
        if (args.length === 0) return usage('mkdir <ad>');
        for (const a of args) {
          const dir = resolvePath(io.cwd, a);
          if (dir.some((part) => validateName(part))) return err(`${a}: ${m.badName}`);
          if (await fs.stat(dir)) return err(`${a}: ${m.exists}`);
          await fs.mkdir(dir);
        }
        return { lines: [] };
      }

      case 'touch': {
        if (args.length === 0) return usage('touch <dosya>');
        for (const a of args) {
          const file = resolvePath(io.cwd, a);
          if (validateName(baseName(file))) return err(`${a}: ${m.badName}`);
          if (!(await fs.stat(file))) await fs.write(file, '');
        }
        return { lines: [] };
      }

      case 'rm':
      case 'del': {
        const targets = args.filter((a) => !a.startsWith('-'));
        if (targets.length === 0) return usage(`${cmd} <yol>`);
        const lines: OutLine[] = [];
        for (const a of targets) {
          const path = resolvePath(io.cwd, a);
          if (path.length === 0 || !(await fs.stat(path))) {
            lines.push({ text: `${cmd}: ${a}: ${m.noSuch}`, kind: 'error' });
            continue;
          }
          await moveToTrash(fs, path);
          lines.push({ text: `${a}: ${m.trashed}`, kind: 'muted' });
        }
        return { lines };
      }

      case 'cp':
      case 'mv': {
        const [srcArg, dstArg] = args;
        if (!srcArg || !dstArg) return usage(`${cmd} <kaynak> <hedef>`);
        const src = resolvePath(io.cwd, srcArg);
        if (src.length === 0 || !(await fs.stat(src))) return err(`${srcArg}: ${m.noSuch}`);
        const dst = resolvePath(io.cwd, dstArg);
        const dstKind = await fs.stat(dst);
        if (dstKind === 'dir') {
          if (cmd === 'cp') await copyEntry(fs, src, fs, dst);
          else await moveEntry(fs, src, dst);
          return { lines: [] };
        }
        if (dstKind === 'file') return err(`${dstArg}: ${m.exists}`);
        const dstDir = parentOf(dst);
        if ((await fs.stat(dstDir)) !== 'dir') return err(`${dstArg}: ${m.noSuch}`);
        if (validateName(baseName(dst))) return err(`${dstArg}: ${m.badName}`);
        if (cmd === 'cp') {
          await copyEntry(fs, src, fs, dstDir, baseName(dst));
        } else if (dstDir.join('/') === parentOf(src).join('/')) {
          await renameEntry(fs, src, baseName(dst));
        } else {
          const moved = await moveEntry(fs, src, dstDir);
          if (moved !== baseName(dst)) await renameEntry(fs, [...dstDir, moved], baseName(dst));
        }
        return { lines: [] };
      }

      case 'open': {
        const target = args.join(' ');
        if (!target) return usage('open <uygulama|dosya>');
        const app = APP_IDS.find((id) => id === target.toLowerCase());
        if (app) {
          io.openApp?.(app);
          return { lines: [] };
        }
        const path = resolvePath(io.cwd, target);
        const kind = await fs.stat(path);
        if (kind === 'dir') {
          return err(`${target}: ${m.isDir}`);
        }
        if (kind === 'file') {
          const opener = appForFile(baseName(path));
          if (!opener) return err(`${target}: ${m.noApp}`);
          io.openApp?.(opener, { path });
          return { lines: [] };
        }
        return err(`${target}: ${m.unknownApp}`);
      }

      case 'theme': {
        const value = args[0];
        if (value !== 'dark' && value !== 'light') return usage('theme dark|light');
        io.setTheme?.(value);
        return { lines: [{ text: m.themeSet, kind: 'muted' }] };
      }

      case 'lang': {
        const value = args[0];
        if (value !== 'tr' && value !== 'en') return usage('lang tr|en');
        io.setLang?.(value);
        return { lines: [{ text: MSG[value].langSet, kind: 'muted' }] };
      }

      case 'neofetch': {
        const f = m.fetch;
        const minutes = Math.max(0, Math.round((Date.now() - io.startedAt) / 60_000));
        const screen =
          typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '-';
        const info = [
          `${USER}@${HOST}`,
          '─'.repeat(18),
          `${f.os}: VirtualMOS (MehburOS web)`,
          `${f.shell}: msh`,
          `${f.screen}: ${screen}`,
          `${f.theme}: ${document.documentElement.dataset.theme ?? 'dark'}`,
          `${f.lang}: ${io.lang}`,
          `${f.storage}: ${io.storageLabel}`,
          `${f.uptime}: ${minutes} ${f.minutes}`,
        ];
        const rows = Math.max(NEOFETCH_ART.length, info.length);
        return {
          lines: Array.from({ length: rows }, (_, i) => ({
            text: `${(NEOFETCH_ART[i] ?? '').padEnd(34)}${info[i] ?? ''}`,
            kind: 'art' as const,
          })),
        };
      }

      case 'exit':
        io.closeWindow?.();
        return { lines: [] };

      default:
        return err(m.notFound);
    }
  } catch (e) {
    if (e instanceof StorageError) {
      if (e.code === 'intoItself') return err(m.intoItself);
      if (e.code === 'exists') return err(m.exists);
      if (e.code === 'notFound') return err(m.noSuch);
    }
    return err(e instanceof Error ? e.message : String(e));
  }
}

/** Tab tamamlama: son kelimeyi bulunduğun klasördeki adlarla tamamlar */
export async function complete(line: string, io: ShellIO): Promise<string | null> {
  const match = /(\S*)$/.exec(line);
  const word = match?.[1] ?? '';
  const slash = word.lastIndexOf('/');
  const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
  const prefix = slash >= 0 ? word.slice(slash + 1) : word;
  const dir = dirPart ? resolvePath(io.cwd, dirPart) : io.cwd;
  try {
    const entries = (await io.backend.list(dir)).filter(
      (e) =>
        !isHidden(e.name) &&
        e.name.toLocaleLowerCase('tr').startsWith(prefix.toLocaleLowerCase('tr')),
    );
    if (entries.length !== 1) return null;
    const entry = entries[0]!;
    const name = entry.name.includes(' ') ? `"${entry.name}"` : entry.name;
    return (
      line.slice(0, line.length - word.length) + dirPart + name + (entry.kind === 'dir' ? '/' : ' ')
    );
  } catch {
    return null;
  }
}
