import { createContext, useContext } from 'react';
import type { StorageStatus } from './manager.ts';

export interface StorageValue {
  status: StorageStatus;
  /** Her dosya değişikliğinde artar; açık Dosyalar pencereleri listelerini yeniler */
  rev: number;
  /** Bir işlemden sonra çağrılır: "dosyalar değişti" */
  changed: () => void;
  canPickFolder: boolean;
  /** Cihazda klasör seç (vazgeçilirse false) */
  chooseDevice: () => Promise<boolean>;
  chooseBrowser: () => Promise<void>;
  /** Daha önce seçilen cihaz klasörü için izin iste */
  grantAccess: () => Promise<boolean>;
}

export const StorageContext = createContext<StorageValue | null>(null);

export function useStorage(): StorageValue {
  const value = useContext(StorageContext);
  if (!value) throw new Error('useStorage, StorageProvider içinde kullanılmalı');
  return value;
}
