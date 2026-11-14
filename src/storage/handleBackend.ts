import {
  StorageError,
  type Entry,
  type EntryKind,
  type Path,
  type StorageBackend,
} from './types.ts';

// Gerçek klasör tutamağı (handle) üzerinden çalışan depolama:
//  - 'device': kullanıcının seçtiği cihaz klasörü (File System Access API)
//  - 'opfs':   tarayıcının siteye ayırdığı gizli dosya alanı (Origin Private File System)
export class HandleBackend implements StorageBackend {
  constructor(
    private readonly root: FileSystemDirectoryHandle,
    public readonly kind: 'device' | 'opfs',
  ) {}

  get rootName(): string {
    return this.root.name;
  }

  private async dir(path: Path, create = false): Promise<FileSystemDirectoryHandle> {
    let handle = this.root;
    for (const part of path) {
      try {
        handle = await handle.getDirectoryHandle(part, { create });
      } catch (e) {
        throw toStorageError(e);
      }
    }
    return handle;
  }

  private async parentAndName(path: Path): Promise<[FileSystemDirectoryHandle, string]> {
    const name = path[path.length - 1];
    if (name === undefined) throw new StorageError('invalidName', 'kök klasör');
    return [await this.dir(path.slice(0, -1)), name];
  }

  async list(dirPath: Path): Promise<Entry[]> {
    const dir = await this.dir(dirPath);
    const entries: Entry[] = [];
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === 'directory') {
        entries.push({ name, kind: 'dir', size: 0, modified: 0 });
      } else {
        const file = await (handle as FileSystemFileHandle).getFile();
        entries.push({ name, kind: 'file', size: file.size, modified: file.lastModified });
      }
    }
    return entries;
  }

  async stat(path: Path): Promise<EntryKind | null> {
    if (path.length === 0) return 'dir';
    try {
      const [parent, name] = await this.parentAndName(path);
      for await (const [entryName, handle] of parent.entries()) {
        if (entryName === name) return handle.kind === 'directory' ? 'dir' : 'file';
      }
      return null;
    } catch (e) {
      if (e instanceof StorageError && (e.code === 'notFound' || e.code === 'notDir')) return null;
      throw e;
    }
  }

  async read(path: Path): Promise<Blob> {
    const [parent, name] = await this.parentAndName(path);
    try {
      return await (await parent.getFileHandle(name)).getFile();
    } catch (e) {
      throw toStorageError(e);
    }
  }

  async write(path: Path, data: Blob | string): Promise<void> {
    const [parent, name] = await this.parentAndName(path);
    try {
      const handle = await parent.getFileHandle(name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    } catch (e) {
      throw toStorageError(e);
    }
  }

  async mkdir(path: Path): Promise<void> {
    await this.dir(path, true);
  }

  async remove(path: Path): Promise<void> {
    const [parent, name] = await this.parentAndName(path);
    try {
      await parent.removeEntry(name, { recursive: true });
    } catch (e) {
      throw toStorageError(e);
    }
  }
}

/** Tarayıcının DOMException hatalarını kendi hata kodlarımıza çevirir */
function toStorageError(e: unknown): unknown {
  if (e instanceof DOMException) {
    if (e.name === 'NotFoundError') return new StorageError('notFound', e.message);
    if (e.name === 'TypeMismatchError') return new StorageError('notDir', e.message);
    if (e.name === 'InvalidModificationError') return new StorageError('exists', e.message);
  }
  return e;
}
