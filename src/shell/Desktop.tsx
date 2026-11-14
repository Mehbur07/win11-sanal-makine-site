import { useI18n } from '../i18n/context.ts';
import './Desktop.css';

// Faz 1: duvar kâğıtlı boş masaüstü. Panel, pencereler ve uygulamalar Faz 2'de eklenecek.
export function Desktop() {
  const { t, lang, setLang } = useI18n();

  return (
    <main className="desktop" data-testid="desktop" aria-label={t('desktop.label')}>
      <button
        type="button"
        className="desktop__lang"
        aria-label={t('lang.switch')}
        onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
      >
        {t('lang.short')}
      </button>
      <p className="desktop__notice" role="status">
        {t('desktop.notice')}
      </p>
    </main>
  );
}
