import { useSyncExternalStore } from 'react';
import type { Path } from '../../storage/types.ts';

// Dosyalar uygulamasının "kopyala / kes" panosu. Tüm Dosyalar pencereleri aynı panoyu paylaşır:
// bir pencerede kopyalanan, diğerine yapıştırılabilir.

export interface FileClip {
  mode: 'copy' | 'cut';
  paths: Path[];
}

let clip: FileClip | null = null;
const listeners = new Set<() => void>();

export function setClip(next: FileClip | null) {
  clip = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useClip(): FileClip | null {
  return useSyncExternalStore(subscribe, () => clip);
}
