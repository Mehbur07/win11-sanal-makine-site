import { createContext, useContext } from 'react';
import { readPref, writePref } from '../lib/prefs.ts';

// Görünüm ayarları: tema, vurgu rengi ve duvar kâğıdı. Hepsi bu cihazda hatırlanır.

export type Theme = 'dark' | 'light';
export type Accent = 'cyan' | 'magenta' | 'amber' | 'green';
export type Wallpaper = 'mehburos' | 'grid' | 'aurora' | 'midnight' | 'custom';

export const ACCENTS: Accent[] = ['cyan', 'magenta', 'amber', 'green'];
export const WALLPAPERS: Wallpaper[] = ['mehburos', 'grid', 'aurora', 'midnight', 'custom'];

/** Ayarlar'daki renk kutucukları için (koyu tema renkleri) */
export const ACCENT_COLORS: Record<Accent, string> = {
  cyan: '#2DE2F5',
  magenta: '#FF2DAA',
  amber: '#FFC25A',
  green: '#3CF59A',
};

export const THEME_STORAGE_KEY = 'vmos:theme';
export const ACCENT_STORAGE_KEY = 'vmos:accent';
export const WALLPAPER_STORAGE_KEY = 'vmos:wallpaper';
/** Kendi duvar kâğıdın IndexedDB'de bu anahtarla saklanır */
export const CUSTOM_WALLPAPER_KEY = 'customWallpaper';

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

function pick<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const saved = readPref(key);
  return allowed.includes(saved as T) ? (saved as T) : fallback;
}

export function readSavedTheme(): Theme {
  return pick(THEME_STORAGE_KEY, ['dark', 'light'], 'dark');
}

export function readSavedAccent(): Accent {
  return pick(ACCENT_STORAGE_KEY, ACCENTS, 'cyan');
}

export function readSavedWallpaper(): Wallpaper {
  return pick(WALLPAPER_STORAGE_KEY, WALLPAPERS, 'mehburos');
}

export function saveTheme(theme: Theme): void {
  writePref(THEME_STORAGE_KEY, theme);
}

export interface ThemeValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  wallpaper: Wallpaper;
  /** Kendi resmin seçiliyse onun adresi */
  customWallpaperUrl: string | null;
  setWallpaper: (wallpaper: Wallpaper) => void;
  /** Kendi resmini duvar kâğıdı yapar */
  setCustomWallpaper: (image: Blob) => Promise<void>;
}

export const ThemeContext = createContext<ThemeValue | null>(null);

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme, ThemeProvider içinde kullanılmalı');
  return value;
}
