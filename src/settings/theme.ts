import { createContext, useContext } from 'react';
import { readPref, writePref } from '../lib/prefs.ts';

// Renk teması. MehburOS gibi varsayılan koyu; açık tema hızlı ayarlardan seçilebilir.
export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'vmos:theme';

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function readSavedTheme(): Theme {
  const saved = readPref(THEME_STORAGE_KEY);
  return isTheme(saved) ? saved : 'dark';
}

export function saveTheme(theme: Theme): void {
  writePref(THEME_STORAGE_KEY, theme);
}

export interface ThemeValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeValue | null>(null);

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme, ThemeProvider içinde kullanılmalı');
  return value;
}
