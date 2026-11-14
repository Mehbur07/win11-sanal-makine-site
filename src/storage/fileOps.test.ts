import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  copyEntry,
  createFile,
  createFolder,
  deleteFromTrash,
  emptyTrash,
  ensureBaseFolders,
  importFiles,
  listTrash,
  mergeInto,
  moveEntry,
  moveToTrash,
  renameEntry,
  restoreFromTrash,
  safeName,
} from './fileOps.ts';
import { IdbRecordStore, MemoryRecordStore, RecordBackend } from './recordBackend.ts';
import { StorageError, type StorageBackend } from './types.ts';

async function text(backend: StorageBackend, path: string[]) {
  return (await backend.read(path)).text();
}

async function names(backend: StorageBackend, path: string[] = []) {
  return (await backend.list(path)).map((e) => e.name).sort();
}

let dbCount = 0;

// Aynı testler hem bellekte hem IndexedDB'de (sahte) çalışır
const backends: [string, () => Promise<StorageBackend>][] = [
  ['bellek', async () => new RecordBackend(new MemoryRecordStore(), 'memory')],
  [
    'IndexedDB',
    async () => new RecordBackend(await IdbRecordStore.open(`test-${dbCount++}`), 'idb'),
  ],
];

describe.each(backends)('depolama (%s)', (_label, make) => {
  let fs: StorageBackend;

  beforeEach(async () => {
    fs = await make();
    await ensureBaseFolders(fs);
  });

  it('başlangıç klasörlerini oluşturur, ikinci kez çağrılınca bozmaz', async () => {
    await ensureBaseFolders(fs);
    expect(await names(fs)).toEqual(['Belgeler', 'Resimler']);
  });

  it('dosya yazar, okur, listeler ve boyutunu bilir', async () => {
    await createFile(fs, ['Belgeler'], 'not.txt', 'merhaba');
    expect(await text(fs, ['Belgeler', 'not.txt'])).toBe('merhaba');
    const [entry] = await fs.list(['Belgeler']);
    expect(entry).toMatchObject({ name: 'not.txt', kind: 'file', size: 7 });
    expect(await fs.stat(['Belgeler', 'not.txt'])).toBe('file');
    expect(await fs.stat(['Belgeler'])).toBe('dir');
    expect(await fs.stat(['yok'])).toBeNull();
  });

  it('aynı adda öğe varken oluşturmayı reddeder', async () => {
    await createFolder(fs, [], 'Proje');
    await expect(createFolder(fs, [], 'Proje')).rejects.toMatchObject({ code: 'exists' });
    await expect(createFile(fs, [], 'kötü:ad.txt')).rejects.toBeInstanceOf(StorageError);
  });

  it('olmayan klasörü listelemek notFound hatası verir', async () => {
    await expect(fs.list(['yok'])).rejects.toMatchObject({ code: 'notFound' });
  });

  it('klasörü içindekilerle kopyalar; aynı ad varsa "(2)" ekler', async () => {
    await fs.mkdir(['Proje', 'alt']);
    await fs.write(['Proje', 'alt', 'a.txt'], 'A');
    const first = await copyEntry(fs, ['Proje'], fs, ['Belgeler']);
    const second = await copyEntry(fs, ['Proje'], fs, ['Belgeler']);
    expect([first, second]).toEqual(['Proje', 'Proje (2)']);
    expect(await text(fs, ['Belgeler', 'Proje (2)', 'alt', 'a.txt'])).toBe('A');
    expect(await fs.stat(['Proje'])).toBe('dir');
  });

  it('klasörü kendi içine kopyalamayı/taşımayı engeller', async () => {
    await fs.mkdir(['Proje', 'alt']);
    await expect(copyEntry(fs, ['Proje'], fs, ['Proje', 'alt'])).rejects.toMatchObject({
      code: 'intoItself',
    });
    await expect(moveEntry(fs, ['Proje'], ['Proje'])).rejects.toMatchObject({
      code: 'intoItself',
    });
  });

  it('taşır: yeni yerde olur, eskisi silinir', async () => {
    await fs.write(['a.txt'], 'A');
    await moveEntry(fs, ['a.txt'], ['Belgeler']);
    expect(await fs.stat(['a.txt'])).toBeNull();
    expect(await text(fs, ['Belgeler', 'a.txt'])).toBe('A');
  });

  it('yeniden adlandırır; yalnızca harf büyüklüğü değişse de çalışır', async () => {
    await fs.mkdir(['Proje']);
    await fs.write(['Proje', 'a.txt'], 'A');
    await renameEntry(fs, ['Proje'], 'Ödev');
    expect(await names(fs)).toEqual(['Belgeler', 'Resimler', 'Ödev']);
    expect(await text(fs, ['Ödev', 'a.txt'])).toBe('A');
    await renameEntry(fs, ['Ödev'], 'ÖDEV');
    expect(await names(fs)).toContain('ÖDEV');
    await expect(renameEntry(fs, ['ÖDEV'], 'Belgeler')).rejects.toMatchObject({ code: 'exists' });
  });

  it('çöp kutusuna atar, listeler, eski yerine geri yükler', async () => {
    await fs.write(['Belgeler', 'rapor.txt'], 'R');
    await moveToTrash(fs, ['Belgeler', 'rapor.txt']);
    expect(await names(fs, ['Belgeler'])).toEqual([]);

    const [item] = await listTrash(fs);
    expect(item).toMatchObject({ name: 'rapor.txt', kind: 'file' });
    expect(item?.originalPath).toEqual(['Belgeler', 'rapor.txt']);

    await restoreFromTrash(fs, item!);
    expect(await text(fs, ['Belgeler', 'rapor.txt'])).toBe('R');
    expect(await listTrash(fs)).toEqual([]);
  });

  it('geri yüklerken eski klasör silinmişse yeniden oluşturur, ad doluysa "(2)" yapar', async () => {
    await fs.mkdir(['Proje']);
    await fs.write(['Proje', 'x.txt'], '1');
    await moveToTrash(fs, ['Proje', 'x.txt']);
    await fs.remove(['Proje']);
    await fs.mkdir(['Proje']);
    await fs.write(['Proje', 'x.txt'], '2');
    const [item] = await listTrash(fs);
    expect(await restoreFromTrash(fs, item!)).toBe('x (2).txt');
    expect(await text(fs, ['Proje', 'x (2).txt'])).toBe('1');
  });

  it('kalıcı siler ve çöp kutusunu boşaltır', async () => {
    await fs.write(['a.txt'], 'A');
    await fs.write(['b.txt'], 'B');
    await moveToTrash(fs, ['a.txt']);
    await moveToTrash(fs, ['b.txt']);
    const items = await listTrash(fs);
    expect(items).toHaveLength(2);
    await deleteFromTrash(fs, items[0]!.id);
    expect(await listTrash(fs)).toHaveLength(1);
    await emptyTrash(fs);
    expect(await listTrash(fs)).toEqual([]);
  });

  it('cihazdan dosya ve klasör içe aktarır', async () => {
    const blob = (s: string) => new Blob([s]);
    await fs.write(['Belgeler', 'a.txt'], 'eski');
    const count = await importFiles(
      fs,
      ['Belgeler'],
      [
        { file: blob('yeni'), relativePath: 'a.txt' },
        { file: blob('1'), relativePath: 'Win11 Web/Belgeler/not.txt' },
        { file: blob('2'), relativePath: 'Win11 Web/saat:1.txt' },
      ],
    );
    expect(count).toBe(3);
    expect(await text(fs, ['Belgeler', 'a.txt'])).toBe('eski');
    expect(await text(fs, ['Belgeler', 'a (2).txt'])).toBe('yeni');
    expect(await text(fs, ['Belgeler', 'Win11 Web', 'Belgeler', 'not.txt'])).toBe('1');
    expect(await text(fs, ['Belgeler', 'Win11 Web', 'saat_1.txt'])).toBe('2');
  });

  it('konum değiştirirken eksik olanları kopyalar, var olanlara dokunmaz', async () => {
    const other = new RecordBackend(new MemoryRecordStore(), 'memory');
    await other.mkdir(['Belgeler']);
    await other.write(['Belgeler', 'a.txt'], 'hedefte');
    await fs.write(['Belgeler', 'a.txt'], 'kaynakta');
    await fs.write(['Belgeler', 'b.txt'], 'B');
    const copied = await mergeInto(fs, other);
    expect(copied).toBe(1);
    expect(await text(other, ['Belgeler', 'a.txt'])).toBe('hedefte');
    expect(await text(other, ['Belgeler', 'b.txt'])).toBe('B');
    expect(await other.stat(['Resimler'])).toBe('dir');
  });
});

describe('safeName', () => {
  it('başka sistemlerden gelen geçersiz karakterleri düzeltir', () => {
    expect(safeName('a:b?.txt')).toBe('a_b_.txt');
    expect(safeName('.gizli')).toBe('_gizli');
    expect(safeName('son.')).toBe('son');
    expect(safeName('   ')).toBe('_');
  });
});
