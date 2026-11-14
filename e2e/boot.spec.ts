import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Testler her zaman Türkçe başlasın
    if (!localStorage.getItem('vmos:lang')) localStorage.setItem('vmos:lang', 'tr');
  });
});

test('açılış animasyonundan sonra masaüstü açılır', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/');
  await expect(page.getByTestId('boot')).toBeVisible();
  await expect(page.getByText('VirtualMOS başlatılıyor…')).toBeVisible();

  const desktop = page.getByTestId('desktop');
  await expect(desktop).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('boot')).toHaveCount(0);

  // Duvar kâğıdı yüklenmiş olmalı
  const bg = await desktop.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('wallpaper');

  // Sayfa yatay kaymamalı (telefonda taşma kontrolü)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);

  expect(errors).toEqual([]);
});

test('dil değiştirilir ve sayfa yenilenince hatırlanır', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.getByText('Desktop ready — windows and apps are coming soon.')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.reload();
  await expect(page.getByText('Starting VirtualMOS…')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Türkçeye geç' })).toBeVisible({ timeout: 5000 });
});

test('olmayan adreste 404 sayfası gösterilir', async ({ page }) => {
  // vite preview 404.html'i sunmaz; dosyanın kendisini kontrol ediyoruz
  const res = await page.goto('/404.html');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'VirtualMOS' })).toHaveAttribute('href', '/');
});
