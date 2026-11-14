// Depolama katmanının ortak dili. Dosyalar uygulaması yalnızca bu arayüzü bilir;
// dosyanın cihaz klasöründe mi, tarayıcıda mı durduğunu bilmesi gerekmez.

/** Kök klasörden itibaren yol parçaları: ['Belgeler', 'not.txt'] */
export type Path = string[];

export type EntryKind = 'file' | 'dir';

export interface Entry {
  name: string;
  kind: EntryKind;
  /** Bayt cinsinden boyut (klasörde 0) */
  size: number;
  /** Son değişiklik zamanı (ms); bilinmiyorsa 0 */
  modified: number;
}

/** Dosyaların fiilen yazıldığı yer */
export type BackendKind = 'device' | 'opfs' | 'idb' | 'memory';

export interface StorageBackend {
  readonly kind: BackendKind;
  /** Klasörün içeriği; klasör yoksa StorageError('notFound') */
  list(dir: Path): Promise<Entry[]>;
  /** Yolda ne var: dosya, klasör ya da hiçbir şey (null) */
  stat(path: Path): Promise<EntryKind | null>;
  read(file: Path): Promise<Blob>;
  /** Dosyayı oluşturur ya da üzerine yazar; üst klasör var olmalı */
  write(file: Path, data: Blob | string): Promise<void>;
  /** Klasörü (gerekirse ara klasörleriyle) oluşturur; zaten varsa sorun değil */
  mkdir(dir: Path): Promise<void>;
  /** Dosyayı ya da klasörü içindekilerle birlikte siler */
  remove(path: Path): Promise<void>;
}

export type StorageErrorCode = 'notFound' | 'exists' | 'notDir' | 'intoItself' | 'invalidName';

export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'StorageError';
  }
}
