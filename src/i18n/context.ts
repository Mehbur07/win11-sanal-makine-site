import { createContext, useContext } from 'react';
import type { Lang } from './lang.ts';
import type { MessageKey } from './messages.ts';

export interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);

// Bileşenlerde metinlere erişmek için: const { t } = useI18n();
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n, I18nProvider içinde kullanılmalı');
  return value;
}
