import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { ThemeProvider } from './settings/ThemeProvider.tsx';
import { BOOT_MS } from './shell/BootScreen.tsx';

function renderDesktop() {
  render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
  act(() => {
    vi.advanceTimersByTime(BOOT_MS);
  });
}

function openFromMenu(name: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Uygulama menüsü' }));
  const menu = screen.getByRole('dialog', { name: 'Uygulama menüsü' });
  fireEvent.click(within(menu).getByRole('button', { name }));
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem('vmos:lang', 'tr');
  });
  afterEach(() => {
    vi.useRealTimers();
    delete document.documentElement.dataset.theme;
  });

  it('önce açılış ekranını, süre dolunca masaüstünü ve hoş geldin bildirimini gösterir', () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('boot')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(BOOT_MS);
    });
    expect(screen.queryByTestId('boot')).toBeNull();
    expect(screen.getByTestId('desktop')).toBeTruthy();
    expect(screen.getByText("VirtualMOS'a hoş geldin")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bildirimler (1 okunmamış)' })).toBeTruthy();
  });

  it('menüden uygulama açar, panelde görünür ve kapatılır', () => {
    renderDesktop();
    openFromMenu('Hakkında');

    const win = screen.getByRole('dialog', { name: 'Hakkında' });
    expect(within(win).getByText('Klavye kısayolları')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hakkında — açık' })).toBeTruthy();

    fireEvent.click(within(win).getByRole('button', { name: 'Kapat' }));
    expect(screen.queryByRole('dialog', { name: 'Hakkında' })).toBeNull();
  });

  it('menüde arama sonuçları süzer, Enter ilk sonucu açar', () => {
    renderDesktop();
    fireEvent.click(screen.getByRole('button', { name: 'Uygulama menüsü' }));
    const input = screen.getByRole('searchbox', { name: 'Uygulama ara' });
    fireEvent.change(input, { target: { value: 'hesap' } });
    const menu = screen.getByRole('dialog', { name: 'Uygulama menüsü' });
    expect(within(menu).getAllByRole('button', { name: /Hesap Makinesi/ })).toHaveLength(1);
    expect(within(menu).queryByRole('button', { name: 'Dosyalar' })).toBeNull();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('calc-display').textContent).toBe('0');
  });

  it('panel düğmesi pencereyi küçültür ve geri getirir', () => {
    renderDesktop();
    const panel = screen.getByRole('navigation', { name: 'Panel' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Dosyalar' }));
    const win = screen.getByRole('dialog', { name: 'Dosyalar' });
    expect(win.hidden).toBe(false);

    fireEvent.click(within(panel).getByRole('button', { name: 'Dosyalar — açık' }));
    expect(win.hidden).toBe(true);
    fireEvent.click(within(panel).getByRole('button', { name: 'Dosyalar — açık' }));
    expect(win.hidden).toBe(false);
  });

  it('hızlı ayarlardan dil ve tema değişir', () => {
    renderDesktop();
    fireEvent.click(screen.getByRole('button', { name: 'Hızlı ayarlar' }));
    fireEvent.click(screen.getByRole('button', { name: /Koyu tema/ }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('vmos:theme')).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: /Dil/ }));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('button', { name: 'App menu' })).toBeTruthy();
  });

  it('Alt+M menüyü açar, Esc kapatır; Alt+Q etkin pencereyi kapatır', () => {
    renderDesktop();
    fireEvent.keyDown(window, { code: 'KeyM', key: 'm', altKey: true });
    expect(screen.getByRole('dialog', { name: 'Uygulama menüsü' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Uygulama menüsü' })).toBeNull();

    openFromMenu('Hakkında');
    fireEvent.keyDown(window, { code: 'KeyQ', key: 'q', altKey: true });
    expect(screen.queryByRole('dialog', { name: 'Hakkında' })).toBeNull();
  });

  it('sağ tık menüsünden Hakkında açılır', () => {
    renderDesktop();
    fireEvent.contextMenu(screen.getByRole('main', { name: 'Masaüstü' }), {
      clientX: 400,
      clientY: 300,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'VirtualMOS hakkında' }));
    expect(screen.getByRole('dialog', { name: 'Hakkında' })).toBeTruthy();
  });

  it('yeniden başlat açılış ekranına döner ve pencereleri kapatır', () => {
    renderDesktop();
    openFromMenu('Hakkında');
    fireEvent.click(screen.getByRole('button', { name: 'Uygulama menüsü' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yeniden başlat' }));
    expect(screen.getByTestId('boot')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(BOOT_MS);
    });
    expect(screen.queryByRole('dialog', { name: 'Hakkında' })).toBeNull();
  });
});
