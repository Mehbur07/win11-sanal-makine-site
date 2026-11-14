import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { BOOT_MS } from './shell/BootScreen.tsx';

function renderApp() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem('vmos:lang', 'tr');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('önce açılış ekranını, süre dolunca masaüstünü gösterir', () => {
    renderApp();
    expect(screen.getByTestId('boot')).toBeTruthy();
    expect(screen.queryByTestId('desktop')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(BOOT_MS);
    });

    expect(screen.queryByTestId('boot')).toBeNull();
    expect(screen.getByTestId('desktop')).toBeTruthy();
  });

  it('dil düğmesi metinleri İngilizceye çevirir ve seçimi kaydeder', () => {
    renderApp();
    act(() => {
      vi.advanceTimersByTime(BOOT_MS);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }));

    expect(screen.getByText('Desktop ready — windows and apps are coming soon.')).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('vmos:lang')).toBe('en');
  });
});
