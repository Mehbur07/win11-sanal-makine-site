import { readPref, writePref } from '../lib/prefs.ts';

// Dil seçimi: önce kullanıcının daha önce seçtiği dil, yoksa tarayıcının dili
export type Lang = 'tr' | 'en';

export const LANG_STORAGE_KEY = 'vmos:lang';

export function isLang(value: unknown): value is Lang {
  return value === 'tr' || value === 'en';
}

export function detectLang(saved: string | null, browserLang: string | undefined): Lang {
  if (isLang(saved)) return saved;
  return (browserLang ?? 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

// Tarih/saat biçimlendirme için dil kodu
export function localeOf(lang: Lang): string {
  return lang === 'tr' ? 'tr-TR' : 'en-US';
}

export function readSavedLang(): string | null {
  return readPref(LANG_STORAGE_KEY);
}

export function saveLang(lang: Lang): void {
  writePref(LANG_STORAGE_KEY, lang);
}
