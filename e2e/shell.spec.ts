import { expect, test, type Page } from '@playwright/test';

// Her test Türkçe ve koyu temayla, açılış animasyonu bitmiş masaüstünde başlar
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('vmos:lang')) localStorage.setItem('vmos:lang', 'tr');
    // Depolama sorusu bu testlerin konusu değil (files.spec.ts'te deneniyor)
    if (!localStorage.getItem('vmos:storage')) localStorage.setItem('vmos:storage', 'browser');
  });
});

async function gotoDesktop(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
}

async function openFromMenu(page: Page, name: string) {
  await page.getByRole('button', { name: 'Uygulama menüsü' }).click();
  await page.getByRole('dialog', { name: 'Uygulama menüsü' }).getByRole('button', { name }).click();
  const win = page.getByRole('dialog', { name });
  await expect(win).toBeVisible();
  return win;
}

test('açılış animasyonundan sonra masaüstü, panel ve hoş geldin bildirimi gelir', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/');
  await expect(page.getByTestId('boot')).toBeVisible();
  await expect(page.getByText('VirtualMOS başlatılıyor…')).toBeVisible();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });

  const expectedMode =
    info.project.name === 'pc' ? 'desktop' : info.project.name === 'tablet' ? 'tablet' : 'phone';
  await expect(page.getByTestId('desktop')).toHaveAttribute('data-mode', expectedMode);
  await expect(page.getByRole('navigation', { name: 'Panel' })).toBeVisible();
  await expect(page.getByText("VirtualMOS'a hoş geldin")).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test('menüden arama ile uygulama açılır ve panelde görünür', async ({ page }) => {
  await gotoDesktop(page);
  await page.getByRole('button', { name: 'Uygulama menüsü' }).click();
  const search = page.getByRole('searchbox', { name: 'Uygulama ara' });
  await search.fill('hakk');
  await search.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Hakkında' })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Panel' })
      .getByRole('button', { name: 'Hakkında — açık' }),
  ).toBeVisible();
});

test('pencere sürüklenip sol kenara yaslanır, tekrar sürüklenince serbest kalır', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'telefon', 'Telefonda pencereler hep tam ekran');
  await gotoDesktop(page);
  const win = await openFromMenu(page, 'Hakkında');
  const title = win.locator('.window__titlebar');
  const box = (await title.boundingBox())!;
  const viewport = page.viewportSize()!;

  await page.mouse.move(box.x + 80, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(200, 200, { steps: 5 });
  await page.mouse.move(2, 300, { steps: 10 });
  await expect(page.getByTestId('snap-preview')).toBeVisible();
  await page.mouse.up();

  await expect(win).toHaveAttribute('data-snap', 'left');
  const snapped = (await win.boundingBox())!;
  expect(snapped.x).toBe(0);
  expect(Math.abs(snapped.width - viewport.width / 2)).toBeLessThanOrEqual(1);

  // Yaslı pencereyi ortaya sürükleyince eski boyutuna döner
  const t2 = (await title.boundingBox())!;
  await page.mouse.move(t2.x + 60, t2.y + t2.height / 2);
  await page.mouse.down();
  await page.mouse.move(viewport.width / 2, 250, { steps: 10 });
  await page.mouse.up();
  await expect(win).toHaveAttribute('data-snap', 'none');
  expect((await win.boundingBox())!.width).toBeLessThan(viewport.width / 2 + 100);
});

test('başlığa çift tıklama büyütür, kenardan boyutlandırılır', async ({ page }, info) => {
  test.skip(info.project.name === 'telefon', 'Telefonda pencereler hep tam ekran');
  await gotoDesktop(page);
  const win = await openFromMenu(page, 'Dosyalar');
  const before = (await win.boundingBox())!;

  // Sağ alt köşeden büyüt
  const handle = win.locator('.window__handle--se');
  const h = (await handle.boundingBox())!;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + 60, h.y + 40, { steps: 5 });
  await page.mouse.up();
  const after = (await win.boundingBox())!;
  expect(after.width).toBeGreaterThan(before.width + 40);

  await win.locator('.window__title').dblclick();
  await expect(win).toHaveAttribute('data-snap', 'max');
  await win.getByRole('button', { name: 'Önceki boyut' }).click();
  await expect(win).toHaveAttribute('data-snap', 'none');
});

test('panel düğmesi pencereyi küçültür ve geri getirir', async ({ page }) => {
  await gotoDesktop(page);
  const win = await openFromMenu(page, 'Hakkında');
  const task = page
    .getByRole('navigation', { name: 'Panel' })
    .getByRole('button', { name: 'Hakkında — açık' });
  await task.click();
  await expect(win).toBeHidden();
  await task.click();
  await expect(win).toBeVisible();
});

test('telefonda uygulama tam ekran açılır; masaüstü ana ekran gibi tüm uygulamaları gösterir', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'telefon', 'Yalnızca telefon');
  await gotoDesktop(page);
  await expect(page.locator('.desktop-icon')).toHaveCount(10);
  await page.locator('.desktop-icon', { hasText: 'Hesap Makinesi' }).click();
  const win = page.getByRole('dialog', { name: 'Hesap Makinesi' });
  await expect(win).toBeVisible();
  // Açılış animasyonu (hafif büyüme) bitince pencere ekranı tam kaplamalı
  await expect
    .poll(async () => {
      const box = (await win.boundingBox())!;
      return [box.x, box.y, box.width];
    })
    .toEqual([0, 0, page.viewportSize()!.width]);
});

test('tablette "yan yana" düğmesi pencereyi sola, sonra sağa yaslar', async ({ page }, info) => {
  test.skip(info.project.name !== 'tablet', 'Yalnızca tablet');
  await gotoDesktop(page);
  const win = await openFromMenu(page, 'Hakkında');
  const split = win.getByRole('button', { name: 'Yan yana yerleştir' });
  await split.click();
  await expect(win).toHaveAttribute('data-snap', 'left');
  await split.click();
  await expect(win).toHaveAttribute('data-snap', 'right');
});

test('masaüstü menüsü (sağ tık) ve klavye kısayolları çalışır', async ({ page }) => {
  await gotoDesktop(page);
  const viewport = page.viewportSize()!;
  await page.mouse.click(viewport.width / 2, viewport.height - 140, { button: 'right' });
  const menu = page.getByRole('menu', { name: 'Masaüstü menüsü' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'VirtualMOS hakkında' }).click();
  const win = page.getByRole('dialog', { name: 'Hakkında' });
  await expect(win).toBeVisible();

  await page.keyboard.press('Alt+KeyQ');
  await expect(win).toHaveCount(0);
  await page.keyboard.press('Alt+KeyM');
  await expect(page.getByRole('dialog', { name: 'Uygulama menüsü' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Uygulama menüsü' })).toHaveCount(0);
});

test('hızlı ayarlarda dil ve tema değişir, yenileyince hatırlanır', async ({ page }) => {
  await gotoDesktop(page);
  await page.getByRole('button', { name: 'Hızlı ayarlar' }).click();
  await page.getByRole('button', { name: /Koyu tema/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /^Dil/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Quick settings' })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'App menu' })).toBeVisible();
});

test('saat düğmesi takvimi açar', async ({ page }) => {
  await gotoDesktop(page);
  await page.getByRole('button', { name: 'Saat ve takvim' }).click();
  const cal = page.getByRole('dialog', { name: 'Saat ve takvim' });
  await expect(cal).toBeVisible();
  await expect(cal.locator('td[aria-current="date"]')).toHaveCount(1);
  await cal.getByRole('button', { name: 'Sonraki ay' }).click();
  await expect(cal.locator('td[aria-current="date"]')).toHaveCount(0);
});

test('404 sayfası dosyası yerinde', async ({ page }) => {
  // vite preview 404.html'i sunmaz; dosyanın kendisini kontrol ediyoruz
  const res = await page.goto('/404.html');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'VirtualMOS' })).toHaveAttribute('href', '/');
});
