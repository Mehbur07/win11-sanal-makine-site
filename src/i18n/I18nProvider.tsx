import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fillVars, I18nContext, type I18nValue } from './context.ts';
import { detectLang, localeOf, readSavedLang, saveLang, type Lang } from './lang.ts';
import { messages } from './messages.ts';

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
    () => ({
      lang,
      locale: localeOf(lang),
      setLang,
      t: (key, vars) => fillVars(messages[lang][key], vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
