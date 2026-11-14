// Küçük kullanıcı tercihleri (dil, tema) için localStorage sarmalayıcısı.
// Gizli pencere veya kapalı depolamada localStorage hata verebilir; o zaman sessizce yok sayılır.

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* depolama kapalıysa tercih yalnızca bu oturumda geçerli */
  }
}
