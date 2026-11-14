import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNotifications } from '../shell/notifications/context.ts';
import { StorageContext, type StorageValue } from './context.ts';
import { ensureBaseFolders, mergeInto } from './fileOps.ts';
import {
  canPickFolder,
  chooseBrowserStorage,
  initStorage,
  pickDeviceFolder,
  requestDeviceAccess,
  type StorageLocation,
  type StorageStatus,
} from './manager.ts';
import type { StorageBackend } from './types.ts';

export function StorageProvider({ children }: { children: ReactNode }) {
  const { notify } = useNotifications();
  const [status, setStatus] = useState<StorageStatus>({ state: 'loading' });
  const [rev, setRev] = useState(0);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const changed = useCallback(() => setRev((r) => r + 1), []);

  /** Yeni depolamayı kullanıma al; konum değiştiyse eski dosyaları yenisine kopyala */
  const activate = useCallback(
    async (backend: StorageBackend, location: StorageLocation) => {
      const previous = statusRef.current;
      if (previous.state === 'ready' && previous.backend !== backend) {
        try {
          const copied = await mergeInto(previous.backend, backend);
          if (copied > 0) notify({ titleKey: 'storage.copied', vars: { count: copied } });
        } catch {
          notify({ titleKey: 'storage.copyFailed' });
        }
      }
      await ensureBaseFolders(backend);
      setStatus({ state: 'ready', backend, location });
      changed();
    },
    [notify, changed],
  );

  useEffect(() => {
    let cancelled = false;
    initStorage().then(async (result) => {
      if (cancelled) return;
      if (result.state === 'ready') {
        await ensureBaseFolders(result.backend).catch(() => undefined);
        if (!cancelled) setStatus(result);
      } else {
        setStatus(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<StorageValue>(
    () => ({
      status,
      rev,
      changed,
      canPickFolder: canPickFolder(),
      chooseDevice: async () => {
        const backend = await pickDeviceFolder();
        if (!backend) return false;
        await activate(backend, 'device');
        notify({ titleKey: 'storage.readyDevice' });
        return true;
      },
      chooseBrowser: async () => {
        await activate(await chooseBrowserStorage(), 'browser');
        notify({ titleKey: 'storage.readyBrowser' });
      },
      grantAccess: async () => {
        const backend = await requestDeviceAccess();
        if (!backend) return false;
        await activate(backend, 'device');
        return true;
      },
    }),
    [status, rev, changed, activate, notify],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
