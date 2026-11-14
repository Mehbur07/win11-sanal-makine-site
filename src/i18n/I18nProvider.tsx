import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nValue } from './context.ts';
import { detectLang, readSavedLang, saveLang, type Lang } from './lang.ts';
import { messages, type MessageKey } from './messages.ts';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    detectLang(readSavedLang(), navigator.language),
  );

  // <html lang="..."> ekran okuyucuların doğru telaffuzu için güncel tutulur
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveLang(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key: MessageKey) => messages[lang][key] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
