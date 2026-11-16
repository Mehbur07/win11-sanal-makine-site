import { Component, Suspense, type ReactNode } from 'react';
import { APPS } from '../../apps/registry.ts';
import type { AppArgs, AppId } from '../../apps/types.ts';
import { useI18n } from '../../i18n/context.ts';

interface Props {
  windowId: string;
  appId: AppId;
  args?: AppArgs;
}

/**
 * Pencerenin içindeki uygulama. Uygulamanın kodu ilk açılışta indirilir; bu sırada
 * "yükleniyor" gösterilir. İndirilemezse (ör. internet yok ya da site yeni sürüme geçti)
 * pencere çökmez, sayfayı yenileme düğmesi çıkar.
 */
export function AppBody({ windowId, appId, args }: Props) {
  const { t } = useI18n();
  const Body = APPS[appId].component;
  return (
    <LoadBoundary
      fallback={
        <div className="app-load app-load--error" role="alert">
          <p>{t('app.loadFailed')}</p>
          <button type="button" className="btn primary" onClick={() => location.reload()}>
            {t('app.reload')}
          </button>
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="app-load" role="status" aria-label={t('app.loading')}>
            <span className="app-load__spinner" aria-hidden="true" />
          </div>
        }
      >
        <Body windowId={windowId} appId={appId} args={args} />
      </Suspense>
    </LoadBoundary>
  );
}

// Hata yakalayıcı (error boundary): React'te yalnızca sınıf bileşeniyle yazılabilir
class LoadBoundary extends Component<{ fallback: ReactNode; children: ReactNode }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
