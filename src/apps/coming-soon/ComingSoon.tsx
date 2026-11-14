import { useI18n } from '../../i18n/context.ts';
import { AppIcon } from '../AppIcon.tsx';
import { APPS } from '../registry.ts';
import type { AppProps } from '../types.ts';
import './ComingSoon.css';

// Henüz yazılmamış uygulamalar için yer tutucu pencere içeriği
export function ComingSoon({ appId }: AppProps) {
  const { t } = useI18n();
  const app = APPS[appId];

  return (
    <div className="coming-soon">
      <AppIcon app={app} size="lg" />
      <h2>{t('comingSoon.title', { app: t(app.titleKey) })}</h2>
      <p>{t('comingSoon.body', { phase: app.comingInPhase ?? '?' })}</p>
    </div>
  );
}
