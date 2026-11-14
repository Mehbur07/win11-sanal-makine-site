import { useEffect } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { Popover } from '../popover/Popover.tsx';
import { useNotifications } from './context.ts';
import { NotificationItem } from './NotificationItem.tsx';

export function NotificationCenter() {
  const { t } = useI18n();
  const { items, dismiss, clear, markAllRead } = useNotifications();

  // Merkez açılınca bildirimler okunmuş sayılır
  useEffect(() => {
    markAllRead();
  }, [markAllRead, items.length]);

  return (
    <Popover label={t('notif.title')} side="right" className="notif-center">
      <header className="popover__head">
        <h2>{t('notif.title')}</h2>
        {items.length > 0 && (
          <button type="button" className="link-button" onClick={clear}>
            {t('notif.clear')}
          </button>
        )}
      </header>
      {items.length === 0 ? (
        <p className="popover__empty">{t('notif.empty')}</p>
      ) : (
        <div className="notif-list">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </div>
      )}
    </Popover>
  );
}
