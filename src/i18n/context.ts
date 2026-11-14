import { createContext, useContext } from 'react';
import type { Lang } from './lang.ts';
import type { MessageKey } from './messages.ts';

export type MessageVars = Record<string, string | number>;

export interface I18nValue {
  lang: Lang;
  /** Tarih/saat biçimlendirme için: 'tr-TR' veya 'en-US' */
  locale: string;
  setLang: (lang: Lang) => void;
  /** Metni getirir; {isim} yer tutucuları vars ile doldurulur */
  t: (key: MessageKey, vars?: MessageVars) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);

// Bileşenlerde metinlere erişmek için: const { t } = useI18n();
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n, I18nProvider içinde kullanılmalı');
  return value;
}

export function fillVars(text: string, vars?: MessageVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
