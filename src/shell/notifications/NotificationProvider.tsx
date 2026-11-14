import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  NotificationsContext,
  type AppNotification,
  type NotificationsValue,
  type NotifyInput,
} from './context.ts';

/** Köşedeki bildirimin ekranda kalma süresi (ms) */
export const TOAST_MS = 5000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [toastIds, setToastIds] = useState<number[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const hideToast = useCallback((id: number) => {
    setToastIds((ids) => ids.filter((x) => x !== id));
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const notify = useCallback(
    (input: NotifyInput) => {
      const id = nextId.current++;
      setItems((list) => [{ id, ...input, time: new Date(), read: false }, ...list]);
      setToastIds((ids) => [id, ...ids].slice(0, 3));
      timers.current.set(
        id,
        window.setTimeout(() => hideToast(id), TOAST_MS),
      );
    },
    [hideToast],
  );

  const dismiss = useCallback(
    (id: number) => {
      setItems((list) => list.filter((n) => n.id !== id));
      hideToast(id);
    },
    [hideToast],
  );

  const markAllRead = useCallback(() => {
    setItems((list) =>
      list.some((n) => !n.read) ? list.map((n) => ({ ...n, read: true })) : list,
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setToastIds([]);
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo<NotificationsValue>(
    () => ({
      items,
      toastIds,
      unread: items.filter((n) => !n.read).length,
      notify,
      dismiss,
      hideToast,
      markAllRead,
      clear,
    }),
    [items, toastIds, notify, dismiss, hideToast, markAllRead, clear],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
