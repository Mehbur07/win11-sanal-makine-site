import type { MessageKey } from '../i18n/messages.ts';
import type { Path } from './types.ts';

// Dosya/klasör adı kuralları. Windows, Android ve macOS'ta sorun çıkarmayan adlara izin verilir,
// çünkü cihaz klasörü seçildiğinde dosyalar gerçekten o işletim sistemine yazılır.

// eslint-disable-next-line no-control-regex -- kontrol karakterleri bilerek yasaklanıyor
const FORBIDDEN = /[\\/:*?"<>|\u0000-\u001f]/;
const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i;
export const MAX_NAME = 200;

/** Ad geçerliyse null, değilse hata metninin anahtarı */
export function validateName(raw: string): MessageKey | null {
  const name = raw.trim();
  if (!name) return 'files.err.empty';
  if (name.length > MAX_NAME) return 'files.err.long';
  if (FORBIDDEN.test(name)) return 'files.err.chars';
  if (name.startsWith('.')) return 'files.err.dot';
  if (name.endsWith('.')) return 'files.err.chars';
  if (RESERVED.test(name)) return 'files.err.reserved';
  return null;
}

/** "rapor.txt" → ["rapor", ".txt"]; "klasör" → ["klasör", ""] */
export function splitExt(name: string): [string, string] {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return [name, ''];
  return [name.slice(0, dot), name.slice(dot)];
}

export function extOf(name: string): string {
  return splitExt(name)[1].slice(1).toLowerCase();
}

/** Aynı adda öğe varsa "ad (2).uzantı", "ad (3).uzantı"... dener */
export function nextFreeName(existing: Iterable<string>, name: string): string {
  const taken = new Set([...existing].map((n) => n.toLocaleLowerCase('tr')));
  if (!taken.has(name.toLocaleLowerCase('tr'))) return name;
  const [base, ext] = splitExt(name);
  const clean = base.replace(/ \(\d+\)$/, '');
  for (let i = 2; ; i++) {
    const candidate = `${clean} (${i})${ext}`;
    if (!taken.has(candidate.toLocaleLowerCase('tr'))) return candidate;
  }
}

export function pathKey(path: Path): string {
  return path.join('/');
}

export function parentOf(path: Path): Path {
  return path.slice(0, -1);
}

export function baseName(path: Path): string {
  return path[path.length - 1] ?? '';
}

/** a, b'nin kendisi ya da içindeyse true (klasörü kendi içine taşımayı engellemek için) */
export function isSameOrInside(inner: Path, outer: Path): boolean {
  return outer.length <= inner.length && outer.every((part, i) => part === inner[i]);
}
