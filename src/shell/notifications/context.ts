import { createContext, useContext } from 'react';
import type { MessageVars } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/messages.ts';

// Bildirimler metin anahtarıyla saklanır; dil değişince bildirimler de yeni dilde görünür
export interface AppNotification {
  id: number;
  titleKey: MessageKey;
  bodyKey?: MessageKey;
  /** Metinlerdeki {isim} yer tutucularının değerleri */
  vars?: MessageVars;
  time: Date;
  read: boolean;
}

export interface NotifyInput {
  titleKey: MessageKey;
  bodyKey?: MessageKey;
  vars?: MessageVars;
}

export interface NotificationsValue {
  items: AppNotification[];
  /** Ekranın köşesinde kısa süre görünen bildirimlerin kimlikleri */
  toastIds: number[];
  unread: number;
  notify: (input: NotifyInput) => void;
  dismiss: (id: number) => void;
  hideToast: (id: number) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const NotificationsContext = createContext<NotificationsValue | null>(null);

export function useNotifications(): NotificationsValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications, NotificationProvider içinde kullanılmalı');
  return value;
}
