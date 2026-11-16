import { Bell, SlidersHorizontal } from 'lucide-react';
import { AppIcon } from '../../apps/AppIcon.tsx';
import { APPS, PINNED_APPS } from '../../apps/registry.ts';
import type { AppId } from '../../apps/types.ts';
import { useI18n } from '../../i18n/context.ts';
import { useNotifications } from '../notifications/context.ts';
import { useNow } from '../useNow.ts';
import { useWM } from '../wm/context.ts';
import './Panel.css';

export type PanelPopover = 'menu' | 'quick' | 'notifications' | 'calendar';

// Alt panel: solda uygulama menüsü ve uygulamalar, sağda bildirim, hızlı ayarlar ve saat
export function Panel({
  open,
  onToggle,
}: {
  open: PanelPopover | null;
  onToggle: (popover: PanelPopover) => void;
}) {
  const { t, locale } = useI18n();
  const wm = useWM();
  const { unread } = useNotifications();
  const now = useNow();
  const phone = wm.mode === 'phone';

  // Telefonda yalnızca açık uygulamalar, diğerlerinde sabitlenmişler + açık olanlar
  const running = [...new Set(wm.windows.map((w) => w.appId))];
  const shown: AppId[] = phone
    ? running
    : [...PINNED_APPS, ...running.filter((id) => !PINNED_APPS.includes(id))];

  const focusedApp = wm.windows.find((w) => w.id === wm.focusedId)?.appId;

  return (
    <nav className="panel" aria-label={t('panel.label')}>
      <button
        type="button"
        className="panel__launcher"
        aria-label={t('menu.open')}
        aria-expanded={open === 'menu'}
        onClick={() => onToggle('menu')}
      >
        <img src="/brand/mehburos-icon-256.png" alt="" width={30} height={30} />
      </button>

      <ul className="panel__tasks">
        {shown.map((id) => {
          const count = wm.windows.filter((w) => w.appId === id).length;
          const title = t(APPS[id].titleKey);
          const label =
            count === 0
              ? title
              : `${title} — ${count > 1 ? t('panel.windows', { count }) : t('panel.running')}`;
          return (
            <li key={id}>
              <button
                type="button"
                className="panel__task"
                data-running={count > 0}
                data-active={focusedApp === id}
                aria-label={label}
                title={title}
                onClick={() => wm.activate(id)}
              >
                <AppIcon app={APPS[id]} size="sm" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="panel__tray">
        <button
          type="button"
          className="panel__tray-btn"
          aria-label={
            unread ? t('panel.notificationsUnread', { count: unread }) : t('panel.notifications')
          }
          aria-expanded={open === 'notifications'}
          onClick={() => onToggle('notifications')}
        >
          <Bell aria-hidden="true" />
          {/* Görünen sayı adın içinde de geçer ("Bildirimler: 1 okunmamış"); parantez kullanılmaz,
              çünkü ekran okuyucu araçları parantez içini adın parçası saymayabilir */}
          {unread > 0 && <span className="panel__badge">{unread}</span>}
        </button>
        <button
          type="button"
          className="panel__tray-btn"
          aria-label={t('panel.quickSettings')}
          aria-expanded={open === 'quick'}
          onClick={() => onToggle('quick')}
        >
          <SlidersHorizontal aria-hidden="true" />
        </button>
        <button
          type="button"
          className="panel__clock"
          aria-expanded={open === 'calendar'}
          onClick={() => onToggle('calendar')}
        >
          {/* Ekran okuyucu görünen saati de okusun (WCAG 2.5.3: görünen metin adın içinde olmalı) */}
          <span>{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
          {!phone && <small>{now.toLocaleDateString(locale)}</small>}
          <span className="visually-hidden">{t('panel.clock')}</span>
        </button>
      </div>
    </nav>
  );
}
