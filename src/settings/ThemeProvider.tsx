import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { writePref } from '../lib/prefs.ts';
import { kvGet, kvSet } from '../storage/kv.ts';
import {
  ACCENT_STORAGE_KEY,
  CUSTOM_WALLPAPER_KEY,
  readSavedAccent,
  readSavedTheme,
  readSavedWallpaper,
  saveTheme,
  ThemeContext,
  WALLPAPER_STORAGE_KEY,
  type Accent,
  type Theme,
  type ThemeValue,
  type Wallpaper,
} from './theme.ts';

const THEME_COLOR: Record<Theme, string> = { dark: '#05090C', light: '#EEFCFE' };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readSavedTheme);
  const [accent, setAccentState] = useState<Accent>(readSavedAccent);
  const [wallpaper, setWallpaperState] = useState<Wallpaper>(readSavedWallpaper);
  const [customBlob, setCustomBlob] = useState<Blob | null>(null);
  const customUrl = useMemo(
    () => (customBlob ? URL.createObjectURL(customBlob) : null),
    [customBlob],
  );

  // Tema ve vurgu rengi <html data-theme data-accent> üzerinden CSS değişkenlerini değiştirir
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme, accent]);

  // Kendi duvar kâğıdın seçiliyse resmi IndexedDB'den yükle
  useEffect(() => {
    if (wallpaper !== 'custom' || customBlob) return;
    let cancelled = false;
    kvGet<Blob>(CUSTOM_WALLPAPER_KEY).then((blob) => {
      if (cancelled) return;
      if (blob) setCustomBlob(blob);
      else setWallpaperState('mehburos');
    });
    return () => {
      cancelled = true;
    };
  }, [wallpaper, customBlob]);

  // Eski resim adresini bırak (bellek sızmasın)
  useEffect(() => {
    return () => {
      if (customUrl) URL.revokeObjectURL(customUrl);
    };
  }, [customUrl]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    saveTheme(next);
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
    writePref(ACCENT_STORAGE_KEY, next);
  }, []);

  const setWallpaper = useCallback((next: Wallpaper) => {
    setWallpaperState(next);
    writePref(WALLPAPER_STORAGE_KEY, next);
  }, []);

  const setCustomWallpaper = useCallback(
    async (image: Blob) => {
      await kvSet(CUSTOM_WALLPAPER_KEY, image);
      setCustomBlob(image);
      setWallpaper('custom');
    },
    [setWallpaper],
  );

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      setTheme,
      accent,
      setAccent,
      wallpaper,
      customWallpaperUrl: wallpaper === 'custom' ? customUrl : null,
      setWallpaper,
      setCustomWallpaper,
    }),
    [theme, setTheme, accent, setAccent, wallpaper, customUrl, setWallpaper, setCustomWallpaper],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
