import { readPref, writePref } from '../lib/prefs.ts';
import { HandleBackend } from './handleBackend.ts';
import { kvGet, kvSet } from './kv.ts';
import { IdbRecordStore, MemoryRecordStore, RecordBackend } from './recordBackend.ts';
import type { StorageBackend } from './types.ts';

// Depolama yerinin seçimi ve açılışta hazırlanması.
//  - 'device':  kullanıcının seçtiği yerde "VirtualMOS" klasörü (Chrome/Edge/Opera, Android Chrome)
//  - 'browser': tarayıcının bu cihazdaki alanı (OPFS, yoksa IndexedDB) — her tarayıcıda çalışır

export type StorageLocation = 'device' | 'browser';

export const STORAGE_PREF = 'vmos:storage';
export const DEVICE_FOLDER = 'VirtualMOS';
const HANDLE_KEY = 'deviceFolder';

export type StorageStatus =
  | { state: 'loading' }
  | { state: 'choose' }
  | { state: 'permission'; folderName: string }
  | { state: 'ready'; backend: StorageBackend; location: StorageLocation }
  | { state: 'error'; message: string };

/** Bu tarayıcı cihazda klasör seçtirebiliyor mu? (iPhone/iPad ve Firefox: hayır) */
export function canPickFolder(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

function supportsOpfsWrite(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function' &&
    typeof FileSystemFileHandle !== 'undefined' &&
    'createWritable' in FileSystemFileHandle.prototype
  );
}

/** Tarayıcı depolaması: önce OPFS, olmazsa IndexedDB, o da olmazsa geçici bellek */
export async function openBrowserBackend(): Promise<StorageBackend> {
  if (supportsOpfsWrite()) {
    try {
      return new HandleBackend(await navigator.storage.getDirectory(), 'opfs');
    } catch {
      /* gizli pencere vb. → bir sonrakini dene */
    }
  }
  try {
    return new RecordBackend(await IdbRecordStore.open(), 'idb');
  } catch {
    return new RecordBackend(new MemoryRecordStore(), 'memory');
  }
}

async function hasPermission(handle: FileSystemDirectoryHandle, ask: boolean): Promise<boolean> {
  const descriptor = { mode: 'readwrite' } as const;
  const query = await handle.queryPermission?.(descriptor);
  if (query === undefined || query === 'granted') return true;
  if (!ask || !handle.requestPermission) return false;
  return (await handle.requestPermission(descriptor)) === 'granted';
}

/** Açılışta: daha önceki seçime göre depolamayı hazırlar */
export async function initStorage(): Promise<StorageStatus> {
  try {
    const pref = readPref(STORAGE_PREF);
    if (pref === 'device' && canPickFolder()) {
      const handle = await kvGet<FileSystemDirectoryHandle>(HANDLE_KEY);
      if (!handle) return { state: 'choose' };
      if (await hasPermission(handle, false)) {
        return { state: 'ready', backend: new HandleBackend(handle, 'device'), location: 'device' };
      }
      return { state: 'permission', folderName: handle.name };
    }
    // Klasör seçilemeyen tarayıcılarda soru sormadan tarayıcı depolaması kullanılır
    if (pref === 'browser' || !canPickFolder()) {
      return { state: 'ready', backend: await openBrowserBackend(), location: 'browser' };
    }
    return { state: 'choose' };
  } catch (e) {
    return { state: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

/** "İzin ver" düğmesiyle (kullanıcı tıklaması gerekir) cihaz klasörüne yeniden erişim */
export async function requestDeviceAccess(): Promise<StorageBackend | null> {
  const handle = await kvGet<FileSystemDirectoryHandle>(HANDLE_KEY);
  if (!handle || !(await hasPermission(handle, true))) return null;
  return new HandleBackend(handle, 'device');
}

/**
 * Klasör seçme penceresini açar ve seçilen yerde "VirtualMOS" klasörünü oluşturur
 * (seçilen klasörün adı zaten VirtualMOS ise onu kullanır). Vazgeçilirse null döner.
 */
export async function pickDeviceFolder(): Promise<StorageBackend | null> {
  if (!window.showDirectoryPicker) return null;
  let parent: FileSystemDirectoryHandle;
  try {
    parent = await window.showDirectoryPicker({
      id: 'virtualmos',
      mode: 'readwrite',
      startIn: 'documents',
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null;
    throw e;
  }
  const root =
    parent.name === DEVICE_FOLDER
      ? parent
      : await parent.getDirectoryHandle(DEVICE_FOLDER, { create: true });
  await kvSet(HANDLE_KEY, root);
  writePref(STORAGE_PREF, 'device');
  return new HandleBackend(root, 'device');
}

export async function chooseBrowserStorage(): Promise<StorageBackend> {
  writePref(STORAGE_PREF, 'browser');
  // Tarayıcıdan, yer darlığında bu sitenin verisini silmemesini iste (izin vermeyebilir)
  await navigator.storage?.persist?.().catch(() => false);
  return openBrowserBackend();
}
