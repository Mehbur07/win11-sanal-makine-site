// Adres çubuğuna yazılanı güvenli bir adrese çevirir.
//  - "home" / boş → başlangıç sayfası
//  - "ornek.com" → https://ornek.com
//  - adres gibi görünmeyen yazılar → Google araması (igu=1: sayfa içinde açılabilen sürüm)
//  - javascript:, data:, file: gibi tehlikeli adresler asla açılmaz

export const HOME = 'vmos:home';
const SEARCH = 'https://www.google.com/search?igu=1&q=';

export function toUrl(input: string): string {
  const text = input.trim();
  if (!text || text === HOME) return HOME;

  if (/^https?:\/\//i.test(text)) return safe(text);
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^localhost:\d+/i.test(text)) {
    // Başka bir şema (javascript:, data:, file: ...) → arama olarak ele al
    return SEARCH + encodeURIComponent(text);
  }
  const looksLikeHost =
    !/\s/.test(text) &&
    (/^[^/]+\.[a-z]{2,}(\/|$|:|\?)/i.test(text) || /^localhost(:\d+)?/i.test(text));
  if (looksLikeHost) return safe(`https://${text}`);
  return SEARCH + encodeURIComponent(text);
}

function safe(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return HOME;
    return parsed.href;
  } catch {
    return SEARCH + encodeURIComponent(url);
  }
}

/** Adres çubuğunda gösterilecek metin */
export function displayUrl(url: string): string {
  return url === HOME ? '' : url;
}
