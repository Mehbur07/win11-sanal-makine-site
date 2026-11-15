import { expect, test, type Page } from '@playwright/test';

// Faz 4 uygulamalarının tarayıcı testleri. Depolama sorusu atlanır (tarayıcı depolaması),
// her test temiz bir profille başlar.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('vmos:lang')) localStorage.setItem('vmos:lang', 'tr');
    if (!localStorage.getItem('vmos:storage')) localStorage.setItem('vmos:storage', 'browser');
  });
  await page.goto('/');
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
});

async function openApp(page: Page, name: string) {
  await page.getByRole('button', { name: 'Uygulama menüsü' }).click();
  await page.getByRole('dialog', { name: 'Uygulama menüsü' }).getByRole('button', { name }).click();
}

/** OPFS'e (tarayıcı depolaması) doğrudan dosya koyar */
async function seedImages(page: Page) {
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const pics = await root.getDirectoryHandle('Resimler', { create: true });
    for (const [name, src] of [
      ['a-logo.png', '/brand/mehburos-icon-256.png'],
      ['b-mmc.webp', '/brand/mehburmc-128.webp'],
    ] as const) {
      const blob = await (await fetch(src)).blob();
      const w = await (await pics.getFileHandle(name, { create: true })).createWritable();
      await w.write(blob);
      await w.close();
    }
  });
}

test("Metin Düzenleyici: yaz, Ctrl+S ile kaydet, Dosyalar'dan yeniden aç", async ({
  page,
}, info) => {
  test.skip(info.project.name === 'telefon', 'Telefonda ayrı test');
  await openApp(page, 'Metin Düzenleyici');
  const editor = page.getByRole('dialog', { name: 'Adsız — Metin Düzenleyici' });
  const area = editor.getByRole('textbox', { name: 'Metin' });
  await area.fill('Merhaba VirtualMOS\nikinci satır');
  await expect(page.getByRole('dialog', { name: '• Adsız — Metin Düzenleyici' })).toBeVisible();

  await area.press('Control+s');
  const save = page.getByRole('dialog', { name: 'Farklı kaydet' });
  await expect(save.getByRole('textbox', { name: 'Ad' })).toHaveValue('Adsız.txt');
  await save.getByRole('textbox', { name: 'Ad' }).fill('deneme.txt');
  await save.getByRole('textbox', { name: 'Ad' }).press('Enter');
  const saved = page.getByRole('dialog', { name: 'deneme.txt — Metin Düzenleyici' });
  await expect(saved).toBeVisible();
  await expect(saved.getByText('"deneme.txt" kaydedildi')).toBeVisible();
  await saved.getByRole('button', { name: 'Kapat' }).click();
  await expect(saved).toHaveCount(0);

  // Dosyalar → Belgeler → deneme.txt açılır (fareyle çift tık, dokunmatikte tek dokunuş)
  await openApp(page, 'Dosyalar');
  const files = page.getByRole('dialog', { name: 'Dosyalar' });
  const openItem = (name: string) => {
    const target = files.locator('.file-item', { hasText: name }).locator('.file-item__main');
    return info.project.use.hasTouch ? target.tap() : target.dblclick();
  };
  await openItem('Belgeler');
  await openItem('deneme.txt');
  const reopened = page.getByRole('dialog', { name: 'deneme.txt — Metin Düzenleyici' });
  await expect(reopened.getByRole('textbox', { name: 'Metin' })).toHaveValue(
    'Merhaba VirtualMOS\nikinci satır',
  );
});

test('kaydedilmemiş değişiklikle kapatırken onay sorulur', async ({ page }) => {
  await openApp(page, 'Metin Düzenleyici');
  const editor = page.getByRole('dialog', { name: /Adsız — Metin Düzenleyici/ });
  await editor.getByRole('textbox', { name: 'Metin' }).fill('kaybolacak');
  await editor.getByRole('button', { name: 'Kapat' }).click();
  const confirm = page.getByRole('dialog', { name: 'Kaydedilmemiş değişiklikler var' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Vazgeç' }).click();
  await expect(editor).toBeVisible();
  await editor.getByRole('button', { name: 'Kapat' }).click();
  await page.getByRole('button', { name: 'Kaydetmeden kapat' }).click();
  await expect(editor).toHaveCount(0);
});

test('Hesap Makinesi: tıklama ve klavyeyle hesaplar', async ({ page }) => {
  await openApp(page, 'Hesap Makinesi');
  const calc = page.getByRole('dialog', { name: 'Hesap Makinesi' });
  const display = calc.getByTestId('calc-display');
  for (const name of ['1', '2', 'Topla', '7', 'Eşittir']) {
    await calc.getByRole('button', { name, exact: true }).click();
  }
  await expect(display).toHaveText('19');

  await calc.locator('.calc').press('Escape');
  await page.keyboard.type('6*7');
  await page.keyboard.press('Enter');
  await expect(display).toHaveText('42');

  await page.keyboard.type('1.5+1=');
  await expect(display).toHaveText('2,5');
  await page.keyboard.type('5/0=');
  await expect(display).toHaveText('Sıfıra bölünemez');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("Çizim: çizer, geri alır, Resimler'e PNG olarak kaydeder", async ({ page }, info) => {
  test.skip(info.project.name === 'telefon', 'Bir masaüstü ve tablette denemek yeterli');
  await openApp(page, 'Çizim');
  const paint = page.getByRole('dialog', { name: 'Adsız çizim — Çizim' });
  const canvas = paint.getByTestId('paint-canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(paint.getByRole('button', { name: 'Geri al' })).toBeEnabled();

  // Dikdörtgen + geri al
  await paint.getByRole('button', { name: 'Dikdörtgen' }).click();
  await page.mouse.move(box.x + 100, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 120, { steps: 4 });
  await page.mouse.up();
  await paint.getByRole('button', { name: 'Geri al' }).click();
  await expect(paint.getByRole('button', { name: 'Yinele' })).toBeEnabled();

  await page
    .getByRole('dialog', { name: /Adsız çizim — Çizim/ })
    .getByRole('button', { name: 'Kaydet', exact: true })
    .click();
  const save = page.getByRole('dialog', { name: 'Farklı kaydet' });
  await expect(save.getByRole('textbox', { name: 'Ad' })).toHaveValue('Çizim.png');
  await save.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByRole('dialog', { name: 'Çizim.png — Çizim' })).toBeVisible();

  const size = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const pics = await root.getDirectoryHandle('Resimler');
    const file = await (await pics.getFileHandle('Çizim.png')).getFile();
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    return { size: file.size, png: head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 };
  });
  expect(size.png).toBe(true);
  expect(size.size).toBeGreaterThan(1000);
});

test('Fotoğraflar: klasördeki resimler arasında gezinir', async ({ page }) => {
  await seedImages(page);
  await openApp(page, 'Fotoğraflar');
  const photos = page.getByRole('dialog', { name: 'a-logo.png — Fotoğraflar' });
  await expect(photos).toBeVisible();
  await expect(photos.getByText('1 / 2')).toBeVisible();
  await expect(photos.getByRole('img', { name: 'a-logo.png' })).toBeVisible();

  await photos.getByRole('button', { name: 'Sonraki resim' }).click();
  const second = page.getByRole('dialog', { name: 'b-mmc.webp — Fotoğraflar' });
  await expect(second.getByText('2 / 2')).toBeVisible();
  await second.getByRole('button', { name: 'Önceki resim' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('dialog', { name: 'a-logo.png — Fotoğraflar' })).toBeVisible();
});

test('Terminal: klasör/dosya komutları, neofetch ve open', async ({ page }, info) => {
  test.skip(info.project.name === 'telefon', 'Bir masaüstü ve tablette denemek yeterli');
  await openApp(page, 'Terminal');
  const term = page.getByRole('dialog', { name: 'Terminal' });
  const input = term.getByRole('textbox', { name: 'Komut' });
  for (const cmd of ['mkdir Deneme', 'cd Deneme', 'echo selam dünya > a.txt', 'cat a.txt']) {
    await input.fill(cmd);
    await input.press('Enter');
  }
  const log = term.getByRole('log');
  await expect(log.getByText('selam dünya', { exact: true })).toBeVisible();
  await expect(term.getByText('mehbur@virtualmos:~/Deneme$').last()).toBeVisible();

  await input.fill('neofetch');
  await input.press('Enter');
  await expect(log.getByText(/VirtualMOS \(MehburOS web\)/)).toBeVisible();

  await input.fill('cd ~');
  await input.press('Enter');
  await input.fill('cd Den');
  await input.press('Tab');
  await expect(input).toHaveValue('cd Deneme/');

  await input.fill('open calculator');
  await input.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Hesap Makinesi' })).toBeVisible();
});

test('Tarayıcı: başlangıç sayfası, adres açma, geri dönme', async ({ page }, info) => {
  await openApp(page, 'Tarayıcı');
  const browser = page.getByRole('dialog', { name: 'Tarayıcı' });
  await expect(browser.getByRole('heading', { name: 'VirtualMOS' })).toBeVisible();

  // exact: başlangıç sayfasındaki "Google'da ara ya da adres yaz" kutusuyla karışmasın
  const address = browser.getByRole('textbox', { name: 'Adres', exact: true });
  await address.fill(
    `${new URL(info.project.use.baseURL ?? 'http://localhost:4173').origin}/404.html`,
  );
  await address.press('Enter');
  const frame = browser.frameLocator('iframe[title="Web sayfası"]');
  await expect(frame.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeVisible();
  await expect(browser.getByRole('note')).toBeVisible();

  await browser.getByRole('button', { name: 'Geri' }).click();
  await expect(browser.getByRole('heading', { name: 'VirtualMOS' })).toBeVisible();
});

test('Ayarlar: tema, vurgu rengi, duvar kâğıdı, depolama ve dil', async ({ page }) => {
  await openApp(page, 'Ayarlar');
  const settings = page.getByRole('dialog', { name: 'Ayarlar' });

  await settings.getByRole('radio', { name: 'Açık' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await settings.getByRole('radio', { name: 'Pembe' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'magenta');
  await settings.getByRole('radio', { name: 'Neon ızgara' }).click();
  await expect(page.locator('main.desktop')).toHaveAttribute('data-wallpaper', 'grid');

  // Kendi resmin
  const png = await page.evaluate(async () => {
    const blob = await (await fetch('/brand/mehburos-icon-32.png')).arrayBuffer();
    return [...new Uint8Array(blob)];
  });
  await settings.getByTestId('wallpaper-upload').setInputFiles({
    name: 'duvar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png),
  });
  await expect(page.locator('main.desktop')).toHaveAttribute('data-wallpaper', 'custom');
  await expect(page.locator('main.desktop')).toHaveAttribute('style', /blob:/);

  await settings.getByRole('button', { name: 'Depolama' }).click();
  await expect(settings.getByTestId('storage-label')).toHaveText('Tarayıcı depolaması');

  await settings.getByRole('button', { name: 'Dil' }).click();
  await settings.getByRole('radio', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

  // Yenileyince hepsi hatırlanır (kendi duvar kâğıdı dahil)
  await page.reload();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'magenta');
  await expect(page.locator('main.desktop')).toHaveAttribute('style', /blob:/);
});

test('telefonda hesap makinesi dokunarak kullanılır ve ekrana sığar', async ({ page }, info) => {
  test.skip(info.project.name !== 'telefon', 'Yalnızca telefon');
  await page.locator('.desktop-icon', { hasText: 'Hesap Makinesi' }).tap();
  const calc = page.getByRole('dialog', { name: 'Hesap Makinesi' });
  for (const name of ['9', 'Çarp', '9', 'Eşittir']) {
    await calc.getByRole('button', { name, exact: true }).tap();
  }
  await expect(calc.getByTestId('calc-display')).toHaveText('81');
  const eq = (await calc.getByRole('button', { name: 'Eşittir' }).boundingBox())!;
  expect(eq.y + eq.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});
