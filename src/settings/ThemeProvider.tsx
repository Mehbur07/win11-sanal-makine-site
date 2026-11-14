import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readSavedTheme, saveTheme, ThemeContext, type Theme } from './theme.ts';

const THEME_COLOR: Record<Theme, string> = { dark: '#05090C', light: '#EEFCFE' };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readSavedTheme);

  // Tema <html data-theme="..."> üzerinden CSS değişkenlerini değiştirir
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    saveTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
