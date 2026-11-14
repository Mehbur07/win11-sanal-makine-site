import { pathKey } from './names.ts';
import {
  StorageError,
  type Entry,
  type EntryKind,
  type Path,
  type StorageBackend,
} from './types.ts';

// Klasör tutamağı olmayan tarayıcılar için: her dosya/klasör bir "kayıt" olarak saklanır.
// Kayıtlar IndexedDB'de (kalıcı) ya da bellekte (geçici, testler için) tutulur.

export interface FileRecord {
  /** 'Belgeler/not.txt' */
  path: string;
  /** 'Belgeler' (kökteyse '') */
  parent: string;
  name: string;
  kind: EntryKind;
  size: number;
  modified: number;
  /** Dosya içeriği. Blob yerine ArrayBuffer: her tarayıcıda IndexedDB'ye sorunsuz yazılır */
  data?: ArrayBuffer;
  type?: string;
}

export interface RecordStore {
  get(path: string): Promise<FileRecord | undefined>;
  put(record: FileRecord): Promise<void>;
  children(parent: string): Promise<FileRecord[]>;
  /** Kaydı ve altındaki her şeyi siler */
  deleteTree(path: string): Promise<void>;
}

export class RecordBackend implements StorageBackend {
  constructor(
    private readonly store: RecordStore,
    public readonly kind: 'idb' | 'memory',
  ) {}

  private async requireDir(key: string): Promise<void> {
    if (key === '') return;
    const rec = await this.store.get(key);
    if (!rec) throw new StorageError('notFound', key);
    if (rec.kind !== 'dir') throw new StorageError('notDir', key);
  }

  async list(dir: Path): Promise<Entry[]> {
    const key = pathKey(dir);
    await this.requireDir(key);
    const records = await this.store.children(key);
    return records.map(({ name, kind, size, modified }) => ({ name, kind, size, modified }));
  }

  async stat(path: Path): Promise<EntryKind | null> {
    if (path.length === 0) return 'dir';
    return (await this.store.get(pathKey(path)))?.kind ?? null;
  }

  async read(path: Path): Promise<Blob> {
    const rec = await this.store.get(pathKey(path));
    if (!rec) throw new StorageError('notFound', pathKey(path));
    if (rec.kind !== 'file') throw new StorageError('notDir', pathKey(path));
    return new Blob([rec.data ?? new ArrayBuffer(0)], { type: rec.type ?? '' });
  }

  async write(path: Path, data: Blob | string): Promise<void> {
    const name = path[path.length - 1];
    if (name === undefined) throw new StorageError('invalidName', 'kök klasör');
    const parent = pathKey(path.slice(0, -1));
    await this.requireDir(parent);
    const existing = await this.store.get(pathKey(path));
    if (existing?.kind === 'dir') throw new StorageError('exists', pathKey(path));
    const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : data;
    const buffer = await blob.arrayBuffer();
    await this.store.put({
      path: pathKey(path),
      parent,
      name,
      kind: 'file',
      size: buffer.byteLength,
      modified: Date.now(),
      data: buffer,
      type: blob.type,
    });
  }

  async mkdir(path: Path): Promise<void> {
    for (let i = 1; i <= path.length; i++) {
      const part = path.slice(0, i);
      const key = pathKey(part);
      const rec = await this.store.get(key);
      if (rec?.kind === 'file') throw new StorageError('notDir', key);
      if (!rec) {
        await this.store.put({
          path: key,
          parent: pathKey(part.slice(0, -1)),
          name: part[part.length - 1] as string,
          kind: 'dir',
          size: 0,
          modified: Date.now(),
        });
      }
    }
  }

  async remove(path: Path): Promise<void> {
    const key = pathKey(path);
    if (!(await this.store.get(key))) throw new StorageError('notFound', key);
    await this.store.deleteTree(key);
  }
}

/** Bellekte tutulan kayıtlar: sayfa kapanınca silinir. Testlerde ve son çare olarak kullanılır. */
export class MemoryRecordStore implements RecordStore {
  private readonly map = new Map<string, FileRecord>();

  async get(path: string) {
    return this.map.get(path);
  }

  async put(record: FileRecord) {
    this.map.set(record.path, record);
  }

  async children(parent: string) {
    return [...this.map.values()].filter((r) => r.parent === parent);
  }

  async deleteTree(path: string) {
    for (const key of [...this.map.keys()]) {
      if (key === path || key.startsWith(`${path}/`)) this.map.delete(key);
    }
  }
}

const DB_NAME = 'vmos-files';
const STORE = 'entries';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** IndexedDB'de tutulan kayıtlar: tarayıcı verisi silinmedikçe kalıcı */
export class IdbRecordStore implements RecordStore {
  private constructor(private readonly db: IDBDatabase) {}

  static open(name = DB_NAME): Promise<IdbRecordStore> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'path' });
        store.createIndex('parent', 'parent');
      };
      req.onsuccess = () => resolve(new IdbRecordStore(req.result));
      req.onerror = () => reject(req.error);
    });
  }

  private store(mode: IDBTransactionMode) {
    return this.db.transaction(STORE, mode).objectStore(STORE);
  }

  async get(path: string) {
    return (await request(this.store('readonly').get(path))) as FileRecord | undefined;
  }

  async put(record: FileRecord) {
    await request(this.store('readwrite').put(record));
  }

  async children(parent: string) {
    return (await request(this.store('readonly').index('parent').getAll(parent))) as FileRecord[];
  }

  async deleteTree(path: string) {
    const store = this.store('readwrite');
    await request(store.delete(path));
    // Alt kayıtlar: 'yol/' ile başlayan tüm anahtarlar
    await request(store.delete(IDBKeyRange.bound(`${path}/`, `${path}/￿`)));
  }
}
