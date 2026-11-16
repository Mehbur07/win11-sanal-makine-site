import { expect, test } from '@playwright/test';

// Faz 6: PWA. Site ana ekrana eklenebiliyor mu, internet yokken açılıyor mu?
// Diğer testlerde service worker kapalı; burada açılır.
test.use({ serviceWorkers: 'allow' });

test.beforeEach(async ({ page }, info) => {
  test.skip(
    info.project.name !== 'pc',
    'Çevrimdışı çalışma cihazdan bağımsız; bilgisayarda denemek yeterli',
  );
  await page.addInitScript(() => {
    if (!localStorage.getItem('vmos:lang')) localStorage.setItem('vmos:lang', 'tr');
    if (!localStorage.getItem('vmos:storage')) localStorage.setItem('vmos:storage', 'browser');
  });
});

test('uygulama tanımı (manifest) ve simgeleri yerinde', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');

  const manifest = await (await request.get(href!)).json();
  expect(manifest.name).toBe('VirtualMOS');
  expect(manifest.display).toBe('standalone');
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  for (const icon of manifest.icons as { src: string }[]) {
    const res = await request.get(icon.src);
    expect(res.ok(), icon.src).toBe(true);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});

test('internet kesilince site yine açılıyor ve uygulamalar çalışıyor', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });

  // Service worker kurulup dosyaları önbelleğe alınca bildirim çıkar
  const ready = page.getByText('İnternetsiz kullanıma hazır');
  await expect(ready.first()).toBeVisible({ timeout: 15_000 });
  // Bildirim bir kez çıkmalı (service worker iki yoldan izlenip iki bildirim üretmesin)
  await page.waitForTimeout(500);
  await expect(ready).toHaveCount(1);
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 10_000 });

  // Uygulamanın kodu da önbellekten gelmeli (ilk kez açılıyor olsa bile)
  await page.getByRole('button', { name: 'Uygulama menüsü' }).click();
  await page
    .getByRole('dialog', { name: 'Uygulama menüsü' })
    .getByRole('button', { name: 'Hesap Makinesi' })
    .click();
  const calc = page.getByRole('dialog', { name: 'Hesap Makinesi' });
  await expect(calc).toBeVisible();
  await expect(calc.locator('.app-load')).toHaveCount(0);
  await expect(calc.getByRole('alert')).toHaveCount(0);

  await context.setOffline(false);
});
