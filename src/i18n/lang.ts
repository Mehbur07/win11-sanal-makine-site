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

// Gizli pencere veya kapalı depolamada localStorage hata verebilir; sessizce yok say
export function readSavedLang(): string | null {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* depolama kapalıysa seçim yalnızca bu oturumda geçerli */
  }
}
