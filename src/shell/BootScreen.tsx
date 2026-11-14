import { useEffect, type CSSProperties } from 'react';
import { useI18n } from '../i18n/context.ts';
import './BootScreen.css';

// Açılış animasyonunun süresi (ms). Hareket azaltma tercih edilmişse kısa tutulur.
export const BOOT_MS = 1800;
export const BOOT_MS_REDUCED = 300;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function BootScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const timer = window.setTimeout(onDone, prefersReducedMotion() ? BOOT_MS_REDUCED : BOOT_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="boot"
      data-testid="boot"
      style={{ '--boot-ms': `${BOOT_MS}ms` } as CSSProperties}
    >
      <img
        className="boot__logo"
        src="/brand/mehburos-icon-256.png"
        alt=""
        width={128}
        height={128}
      />
      <h1 className="boot__title">VirtualMOS</h1>
      <div className="boot__bar" aria-hidden="true">
        <span />
      </div>
      <p className="boot__text" role="status">
        {t('boot.loading')}
      </p>
    </div>
  );
}
