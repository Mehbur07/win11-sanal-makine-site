import { baseName, isSameOrInside, nextFreeName, parentOf, validateName } from './names.ts';
import { StorageError, type EntryKind, type Path, type StorageBackend } from './types.ts';

// Depolama arayüzü üzerine kurulu üst düzey dosya işlemleri.
// Hepsi her depolama türünde (cihaz klasörü, OPFS, IndexedDB, bellek) aynı çalışır.

export const TRASH = '.trash';
const META = '.meta.json';

/** İlk açılışta oluşturulan klasörler */
export const BASE_FOLDERS = ['Belgeler', 'Resimler'];

/** Gizli öğeler ('.' ile başlayanlar, örn. çöp kutusu) Dosyalar'da gösterilmez */
export function isHidden(name: string): boolean {
  return name.startsWith('.');
}

async function namesIn(backend: StorageBackend, dir: Path): Promise<string[]> {
  return (await backend.list(dir)).map((e) => e.name);
}

/** Klasörde bu ad boşsa onu, doluysa "ad (2)" gibi boş bir adı verir */
export async function freeName(backend: StorageBackend, dir: Path, name: string): Promise<string> {
  return nextFreeName(await namesIn(backend, dir), name);
}

function assertValid(name: string) {
  if (validateName(name)) throw new StorageError('invalidName', name);
}

export async function ensureBaseFolders(backend: StorageBackend): Promise<void> {
  for (const name of BASE_FOLDERS) {
    if (!(await backend.stat([name]))) await backend.mkdir([name]);
  }
}

export async function createFolder(backend: StorageBackend, dir: Path, name: string) {
  assertValid(name);
  if (await backend.stat([...dir, name])) throw new StorageError('exists', name);
  await backend.mkdir([...dir, name]);
}

export async function createFile(
  backend: StorageBackend,
  dir: Path,
  name: string,
  data: Blob | string = '',
) {
  assertValid(name);
  if (await backend.stat([...dir, name])) throw new StorageError('exists', name);
  await backend.write([...dir, name], data);
}

/**
 * Bir öğeyi (klasörse içindekilerle) başka bir klasöre kopyalar. İki farklı depolama
 * arasında da çalışır (konum değiştirirken). Hedefte aynı ad varsa "ad (2)" olur.
 * Kopyanın son adını döndürür.
 */
export async function copyEntry(
  src: StorageBackend,
  from: Path,
  dst: StorageBackend,
  toDir: Path,
  name = baseName(from),
): Promise<string> {
  if (src === dst && isSameOrInside(toDir, from)) throw new StorageError('intoItself');
  const kind = await src.stat(from);
  if (!kind) throw new StorageError('notFound', from.join('/'));
  const finalName = await freeName(dst, toDir, name);
  await copyTree(src, from, kind, dst, [...toDir, finalName]);
  return finalName;
}

async function copyTree(
  src: StorageBackend,
  from: Path,
  kind: EntryKind,
  dst: StorageBackend,
  to: Path,
) {
  if (kind === 'file') {
    await dst.write(to, await src.read(from));
    return;
  }
  await dst.mkdir(to);
  for (const entry of await src.list(from)) {
    await copyTree(src, [...from, entry.name], entry.kind, dst, [...to, entry.name]);
  }
}

/** Taşıma = kopyala + eskisini sil. Aynı klasöre taşımak hiçbir şey yapmaz. */
export async function moveEntry(backend: StorageBackend, from: Path, toDir: Path): Promise<string> {
  if (parentOf(from).join('/') === toDir.join('/')) return baseName(from);
  const name = await copyEntry(backend, from, backend, toDir);
  await backend.remove(from);
  return name;
}

export async function renameEntry(backend: StorageBackend, path: Path, newName: string) {
  const name = newName.trim();
  assertValid(name);
  if (name === baseName(path)) return;
  const dir = parentOf(path);
  const taken = (await namesIn(backend, dir)).filter((n) => n !== baseName(path));
  // Yalnızca büyük/küçük harf değişiyorsa (dosya → Dosya) çakışma sayılmaz
  if (taken.some((n) => n.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) {
    throw new StorageError('exists', name);
  }
  const kind = await backend.stat(path);
  if (!kind) throw new StorageError('notFound', path.join('/'));
  const caseOnly = name.toLocaleLowerCase('tr') === baseName(path).toLocaleLowerCase('tr');
  if (!caseOnly) {
    await copyTree(backend, path, kind, backend, [...dir, name]);
    await backend.remove(path);
    return;
  }
  // Windows klasörlerinde "dosya" ile "Dosya" aynı yerdir: önce geçici bir ada taşı
  const temp = [...dir, `.rename-${Date.now()}`];
  await copyTree(backend, path, kind, backend, temp);
  await backend.remove(path);
  await copyTree(backend, temp, kind, backend, [...dir, name]);
  await backend.remove(temp);
}

// ---------- Çöp kutusu ----------

export interface TrashItem {
  id: string;
  name: string;
  kind: EntryKind;
  /** Silinmeden önceki yeri (ad dahil) */
  originalPath: Path;
  deletedAt: number;
}

interface TrashMeta {
  originalPath: Path;
  deletedAt: number;
}

/** Öğeyi çöp kutusuna taşır: .trash/<kimlik>/<öğe> + .meta.json (eski yeri) */
export async function moveToTrash(backend: StorageBackend, path: Path): Promise<void> {
  const kind = await backend.stat(path);
  if (!kind) throw new StorageError('notFound', path.join('/'));
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const slot = [TRASH, id];
  await backend.mkdir(slot);
  const meta: TrashMeta = { originalPath: path, deletedAt: Date.now() };
  await backend.write([...slot, META], JSON.stringify(meta));
  await copyTree(backend, path, kind, backend, [...slot, baseName(path)]);
  await backend.remove(path);
}

export async function listTrash(backend: StorageBackend): Promise<TrashItem[]> {
  if ((await backend.stat([TRASH])) !== 'dir') return [];
  const items: TrashItem[] = [];
  for (const slot of await backend.list([TRASH])) {
    if (slot.kind !== 'dir') continue;
    try {
      const entries = await backend.list([TRASH, slot.name]);
      const item = entries.find((e) => e.name !== META);
      if (!item) continue;
      const meta = JSON.parse(await (await backend.read([TRASH, slot.name, META])).text());
      items.push({
        id: slot.name,
        name: item.name,
        kind: item.kind,
        originalPath: meta.originalPath,
        deletedAt: meta.deletedAt,
      });
    } catch {
      /* bozuk kayıt: atla */
    }
  }
  return items.sort((a, b) => b.deletedAt - a.deletedAt);
}

/** Öğeyi eski yerine geri koyar (eski klasör yoksa oluşturur, ad doluysa "ad (2)") */
export async function restoreFromTrash(backend: StorageBackend, item: TrashItem): Promise<string> {
  const dir = parentOf(item.originalPath);
  await backend.mkdir(dir);
  const name = await copyEntry(backend, [TRASH, item.id, item.name], backend, dir, item.name);
  await backend.remove([TRASH, item.id]);
  return name;
}

export async function deleteFromTrash(backend: StorageBackend, id: string): Promise<void> {
  await backend.remove([TRASH, id]);
}

export async function emptyTrash(backend: StorageBackend): Promise<void> {
  if (await backend.stat([TRASH])) await backend.remove([TRASH]);
}

// ---------- Cihazdan içe aktarma ----------

export interface ImportFile {
  file: Blob;
  /** Klasör seçildiyse dosyanın klasör içindeki yolu: 'Klasör/alt/dosya.png' */
  relativePath: string;
}

/**
 * Cihazdan seçilen dosyaları (ya da bir klasörün tamamını) hedef klasöre kopyalar.
 * Geçersiz karakterli adlar düzeltilir, aynı adlar "ad (2)" olur. Kopyalanan dosya sayısını verir.
 */
export async function importFiles(
  backend: StorageBackend,
  dir: Path,
  files: ImportFile[],
): Promise<number> {
  let count = 0;
  // Klasör içe aktarılırken en üst klasör adı çakışırsa tüm dosyalar aynı yeni ada gitsin
  const topRenames = new Map<string, string>();

  for (const { file, relativePath } of files) {
    const parts = relativePath.split('/').filter(Boolean).map(safeName);
    const fileName = parts.pop();
    if (!fileName) continue;

    let target = [...dir];
    if (parts.length > 0) {
      const top = parts[0] as string;
      if (!topRenames.has(top)) topRenames.set(top, await freeName(backend, dir, top));
      target = [...dir, topRenames.get(top) as string, ...parts.slice(1)];
      await backend.mkdir(target);
      await backend.write([...target, fileName], file);
    } else {
      await backend.write([...target, await freeName(backend, target, fileName)], file);
    }
    count++;
  }
  return count;
}

/** Diğer işletim sistemlerinden gelen, burada geçersiz olan karakterleri '_' yapar */
export function safeName(name: string): string {
  // eslint-disable-next-line no-control-regex -- kontrol karakterleri bilerek temizleniyor
  let clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  if (clean.startsWith('.')) clean = `_${clean.slice(1)}`;
  return clean.replace(/\.+$/, '') || '_';
}

// ---------- Konum değiştirme ----------

/** Kaynaktaki her şeyi hedefe kopyalar; hedefte aynı adda olanlar atlanır. Kopyalanan sayısını verir. */
export async function mergeInto(
  src: StorageBackend,
  dst: StorageBackend,
  dir: Path = [],
): Promise<number> {
  let count = 0;
  for (const entry of await src.list(dir)) {
    const path = [...dir, entry.name];
    const existing = await dst.stat(path);
    if (entry.kind === 'dir') {
      if (existing === 'file') continue;
      if (!existing) await dst.mkdir(path);
      count += await mergeInto(src, dst, path);
    } else if (!existing) {
      await dst.write(path, await src.read(path));
      count++;
    }
  }
  return count;
}
