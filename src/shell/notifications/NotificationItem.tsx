import { Bell, X } from 'lucide-react';
import { useI18n } from '../../i18n/context.ts';
import type { AppNotification } from './context.ts';

export function NotificationItem({
  item,
  onDismiss,
}: {
  item: AppNotification;
  onDismiss: () => void;
}) {
  const { t, locale } = useI18n();
  const time = item.time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <article className="notif">
      <Bell className="notif__icon" aria-hidden="true" />
      <div className="notif__text">
        <header>
          <strong>{t(item.titleKey, item.vars)}</strong>
          <time dateTime={item.time.toISOString()}>{time}</time>
        </header>
        {item.bodyKey && <p>{t(item.bodyKey, item.vars)}</p>}
        {item.action && (
          <button type="button" className="btn primary notif__action" onClick={item.action.run}>
            {t(item.action.labelKey)}
          </button>
        )}
      </div>
      <button
        type="button"
        className="notif__close"
        aria-label={t('notif.dismiss')}
        onClick={onDismiss}
      >
        <X />
      </button>
    </article>
  );
}
