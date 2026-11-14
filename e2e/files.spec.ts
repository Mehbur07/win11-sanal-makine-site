import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';

// Dosyalar ve depolama testleri. Her test temiz bir tarayıcı profiliyle başlar
// (boş OPFS/IndexedDB), yani ilk açılıştaki "nerede saklansın?" sorusu her seferinde gelir.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('vmos:lang')) localStorage.setItem('vmos:lang', 'tr');
  });
});

async function boot(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
}

async function chooseBrowser(page: Page) {
  const chooser = page.getByRole('dialog', { name: 'Dosyalar nerede saklansın?' });
  await expect(chooser).toBeVisible();
  await chooser.getByRole('button', { name: /Tarayıcıda/ }).click();
  await expect(chooser).toHaveCount(0);
}

async function openFiles(page: Page): Promise<Locator> {
  await page.locator('.desktop-icon', { hasText: 'Dosyalar' }).click();
  if (!(await page.getByRole('dialog', { name: 'Dosyalar' }).isVisible())) {
    await page.locator('.desktop-icon', { hasText: 'Dosyalar' }).dblclick();
  }
  const win = page.getByRole('dialog', { name: 'Dosyalar' });
  await expect(win).toBeVisible();
  await expect(win.locator('.file-item', { hasText: 'Belgeler' })).toBeVisible();
  return win;
}

const item = (win: Locator, name: string) =>
  win.locator('.file-item').filter({ has: win.page().getByText(name, { exact: true }) });

async function prompt(page: Page, title: string, value: string) {
  const dialog = page.getByRole('dialog', { name: title });
  await dialog.getByRole('textbox').fill(value);
  await dialog.getByRole('textbox').press('Enter');
  await expect(dialog).toHaveCount(0);
}

test('ilk açılışta depolama sorulur; tarayıcı seçilince başlangıç klasörleri gelir', async ({
  page,
}) => {
  await boot(page);
  await chooseBrowser(page);
  await expect(page.getByText('Dosyalar bu tarayıcıda saklanıyor')).toBeVisible();
  const win = await openFiles(page);
  await expect(item(win, 'Resimler')).toBeVisible();
  await expect(win.getByText('Tarayıcı depolaması').first()).toBeAttached();

  // Seçim hatırlanır: yenileyince soru tekrar gelmez
  await page.reload();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(500);
  await expect(page.getByRole('dialog', { name: 'Dosyalar nerede saklansın?' })).toHaveCount(0);
});

test('klasör oluştur, dosya ekle, önizle, yeniden adlandır, kopyala-yapıştır, sil ve geri yükle', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'telefon', 'Telefon akışı ayrı testte');
  await boot(page);
  await chooseBrowser(page);
  const win = await openFiles(page);

  await win.getByRole('button', { name: 'Yeni klasör' }).click();
  await prompt(page, 'Yeni klasör', 'Ödevler');
  await expect(item(win, 'Ödevler')).toBeVisible();

  // Klasöre gir
  await item(win, 'Ödevler').locator('.file-item__main').dblclick({ force: true });
  if (info.project.name === 'tablet') {
    // Dokunmatik arayüzde tek dokunuş açar; çift tık iki kez açmaya çalışabilir
    await expect(win.getByRole('button', { name: 'Ödevler' })).toBeVisible();
  }
  await expect(win.getByText('Bu klasör boş')).toBeVisible();

  // Cihazdan dosya ekle
  await win.getByTestId('files-upload').setInputFiles({
    name: 'not.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('VirtualMOS deneme notu'),
  });
  await expect(item(win, 'not.txt')).toBeVisible();
  await expect(win.getByText('1 dosya eklendi')).toBeVisible();

  // Önizleme
  await item(win, 'not.txt').locator('.file-item__main').click();
  if (info.project.name === 'pc') {
    await win.getByRole('button', { name: 'Aç' }).click();
  }
  const preview = page.getByRole('dialog', { name: 'not.txt' });
  await expect(preview.getByText('VirtualMOS deneme notu')).toBeVisible();
  await preview.getByRole('button', { name: 'Kapat' }).click();

  // Seç → yeniden adlandır
  const select = async (name: string) => {
    if (info.project.name === 'tablet') {
      await win.getByRole('button', { name: `Seç: ${name}` }).click();
    } else {
      await item(win, name).locator('.file-item__main').click();
    }
  };
  await select('not.txt');
  await win.getByRole('button', { name: 'Yeniden adlandır' }).click();
  await prompt(page, 'Yeniden adlandır', 'notlar.txt');
  await expect(item(win, 'notlar.txt')).toBeVisible();

  // Kopyala → üst klasöre yapıştır
  await win.getByRole('button', { name: 'Kopyala' }).click();
  await win.getByRole('button', { name: 'Üst klasör' }).click();
  await win.getByRole('button', { name: 'Yapıştır' }).click();
  await expect(item(win, 'notlar.txt')).toBeVisible();

  // Sil → çöp kutusu → geri yükle
  await select('notlar.txt');
  await win.getByRole('button', { name: 'Sil', exact: true }).click();
  await expect(item(win, 'notlar.txt')).toHaveCount(0);
  await win.locator('.place', { hasText: 'Çöp Kutusu' }).click();
  await expect(item(win, 'notlar.txt')).toBeVisible();
  await item(win, 'notlar.txt').locator('.file-item__main').click();
  await win.getByRole('button', { name: 'Geri yükle' }).click();
  await expect(win.getByText('Çöp kutusu boş')).toBeVisible();

  // Sayfa yenilenince her şey yerinde (OPFS kalıcı)
  await page.reload();
  const again = await openFiles(page);
  await expect(item(again, 'notlar.txt')).toBeVisible();
  await expect(item(again, 'Ödevler')).toBeVisible();
});

test('cihaz klasörü seçilince içinde VirtualMOS klasörü oluşur ve yenileyince hatırlanır', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'pc', 'Bir cihazda denemek yeterli');
  // Gerçek klasör seçme penceresi otomatik testte açılamaz; yerine tarayıcının gizli
  // dosya alanında bir klasör veriyoruz. VirtualMOS'un kodu aynı yoldan çalışır.
  await page.addInitScript(() => {
    window.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle('SecilenKlasor', {
        create: true,
      });
  });
  await boot(page);
  const chooser = page.getByRole('dialog', { name: 'Dosyalar nerede saklansın?' });
  await chooser.getByRole('button', { name: /Cihazımda klasör/ }).click();
  await expect(chooser).toHaveCount(0);

  const win = await openFiles(page);
  await expect(win.getByText('Cihaz klasörü: VirtualMOS').first()).toBeAttached();
  await win.getByRole('button', { name: 'Yeni klasör' }).click();
  await prompt(page, 'Yeni klasör', 'Projeler');

  const onDisk = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const folder = await (
      await root.getDirectoryHandle('SecilenKlasor')
    ).getDirectoryHandle('VirtualMOS');
    const out: string[] = [];
    for await (const name of folder.keys()) out.push(name);
    return out.sort();
  });
  expect(onDisk).toEqual(['Belgeler', 'Projeler', 'Resimler']);

  await page.reload();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
  const again = await openFiles(page);
  await expect(item(again, 'Projeler')).toBeVisible();
});

test('klasör içe aktarma (eski Win11 Web klasörü gibi) alt klasörleriyle kopyalar', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'pc', 'Bir cihazda denemek yeterli');
  const src = join(info.outputPath(), 'Win11 Web');
  mkdirSync(join(src, 'Belgeler'), { recursive: true });
  writeFileSync(join(src, 'Belgeler', 'eski-not.txt'), 'eski');
  writeFileSync(join(src, 'kök.txt'), 'kök');

  await boot(page);
  await chooseBrowser(page);
  const win = await openFiles(page);
  await win.getByTestId('files-folder').setInputFiles(src);
  await expect(item(win, 'Win11 Web')).toBeVisible();
  await expect(win.getByText('2 dosya eklendi')).toBeVisible();
  await item(win, 'Win11 Web').locator('.file-item__main').dblclick();
  await expect(item(win, 'kök.txt')).toBeVisible();
  await item(win, 'Belgeler').locator('.file-item__main').dblclick();
  await expect(item(win, 'eski-not.txt')).toBeVisible();
});

test('telefonda dokununca klasör açılır, seçim dairesiyle seçilir', async ({ page }, info) => {
  test.skip(info.project.name !== 'telefon', 'Yalnızca telefon');
  await boot(page);
  await chooseBrowser(page);
  await page.locator('.desktop-icon', { hasText: 'Dosyalar' }).tap();
  const win = page.getByRole('dialog', { name: 'Dosyalar' });
  await expect(win).toBeVisible();

  await item(win, 'Belgeler').locator('.file-item__main').tap();
  await expect(win.getByText('Bu klasör boş')).toBeVisible();
  await win.getByRole('button', { name: 'Üst klasör' }).tap();

  await win.getByRole('button', { name: 'Seç: Resimler' }).tap();
  await expect(win.getByText('1 seçili')).toBeVisible();
  await expect(win.getByRole('button', { name: 'Sil', exact: true })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
