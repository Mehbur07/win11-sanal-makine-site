import { expect, test, type Page } from '@playwright/test';

// Faz 5: MehburMC Launcher demosu. GitHub API'ye gerçekten gidilmez; sabit bir cevap verilir.

const RELEASES = [
  {
    tag_name: 'v9.9.0-linux',
    name: 'MehburMC Launcher v9.9.0 (Linux)',
    prerelease: true,
    published_at: '2026-11-10T20:41:06Z',
    html_url: 'https://github.com/Mehbur07/MehburMC-Launcher/releases/tag/v9.9.0-linux',
    body: '',
    assets: [
      {
        name: 'MehburMC-Launcher_9.9.0_amd64.deb',
        size: 7_340_032,
        browser_download_url:
          'https://github.com/Mehbur07/MehburMC-Launcher/releases/download/v9.9.0-linux/MehburMC-Launcher_9.9.0_amd64.deb',
      },
    ],
  },
  {
    tag_name: 'v9.9.0',
    name: 'MehburMC Launcher v9.9.0',
    prerelease: false,
    published_at: '2026-11-10T20:40:58Z',
    html_url: 'https://github.com/Mehbur07/MehburMC-Launcher/releases/tag/v9.9.0',
    body: '### Eklendi\n- **Test özelliği:** deneme maddesi',
    assets: [
      {
        name: 'MehburMC-Launcher_9.9.0_x64-setup.exe',
        size: 5_827_282,
        browser_download_url:
          'https://github.com/Mehbur07/MehburMC-Launcher/releases/download/v9.9.0/MehburMC-Launcher_9.9.0_x64-setup.exe',
      },
    ],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/repos/Mehbur07/MehburMC-Launcher/releases*', (route) =>
    route.fulfill({ json: RELEASES }),
  );
  await page.addInitScript(() => {
    if (!localStorage.getItem('vmos:lang')) localStorage.setItem('vmos:lang', 'tr');
    if (!localStorage.getItem('vmos:storage')) localStorage.setItem('vmos:storage', 'browser');
  });
  await page.goto('/');
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
});

async function openLauncher(page: Page) {
  await page.getByRole('button', { name: 'Uygulama menüsü' }).click();
  await page
    .getByRole('dialog', { name: 'Uygulama menüsü' })
    .getByRole('button', { name: 'MehburMC Launcher' })
    .click();
  const win = page.getByRole('dialog', { name: 'MehburMC Launcher' });
  await expect(win).toBeVisible();
  return win;
}

test('Oyna: hazırlık çubuğundan sonra demo uyarısı çıkar ve indirme sayfasına götürür', async ({
  page,
}) => {
  const win = await openLauncher(page);
  await expect(win.getByRole('heading', { name: 'MehburMC SMP' })).toBeVisible();
  await expect(win.locator('.mmc-brand__ver')).toHaveText('v9.9.0');

  await win.getByRole('button', { name: 'OYNA', exact: true }).click();
  await expect(win.getByRole('status')).toContainText('Sürüm dosyaları denetleniyor');
  const notice = win.getByRole('alertdialog', { name: 'Bu bir demo' });
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: "Launcher'ı indir" }).click();

  await expect(win.getByRole('heading', { name: 'MehburMC Launcher' })).toBeVisible();
  await expect(win.getByRole('link', { name: 'Windows için indir' })).toHaveAttribute(
    'href',
    /MehburMC-Launcher_9\.9\.0_x64-setup\.exe$/,
  );
  await expect(win.getByRole('link', { name: 'Linux için indir' })).toHaveAttribute(
    'href',
    /MehburMC-Launcher_9\.9\.0_amd64\.deb$/,
  );
  await expect(win.getByText('En güncel sürüm: v9.9.0')).toBeVisible();
});

test('Profil oluşturulur, seçili olur ve sayfa yenilenince korunur', async ({ page }) => {
  let win = await openLauncher(page);
  await win.getByRole('button', { name: 'Profiller' }).click();
  await win.getByRole('button', { name: 'Profil oluştur' }).click();
  const form = win.getByRole('form', { name: 'Profil oluştur' });
  await form.getByLabel('Profil adı').fill('Forge Macera');
  await form.getByLabel('Minecraft sürümü').selectOption('1.20.1');
  await form.getByLabel('Mod yükleyici').selectOption('forge');
  await form.getByRole('button', { name: 'Oluştur' }).click();

  await expect(win.getByRole('heading', { name: 'Forge Macera' })).toBeVisible();
  await expect(win.locator('.mmc-hero').getByText('1.20.1', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
  win = await openLauncher(page);
  await expect(win.getByRole('heading', { name: 'Forge Macera' })).toBeVisible();
});

test('Yenilikler sürüm notlarını, demoda olmayan sayfalar indirme çağrısını gösterir', async ({
  page,
}) => {
  const win = await openLauncher(page);
  await win.getByRole('button', { name: 'Yenilikler' }).click();
  await expect(win.getByRole('heading', { name: 'MehburMC Launcher v9.9.0' })).toBeVisible();
  await expect(win.getByText('Test özelliği:')).toBeVisible();
  // Linux kopyası Yenilikler'de ayrıca görünmez
  await expect(win.getByRole('heading', { name: /\(Linux\)/ })).toHaveCount(0);

  await win.getByRole('button', { name: 'Arkadaşlar' }).click();
  await expect(win.getByRole('heading', { name: "Arkadaşlar gerçek launcher'da" })).toBeVisible();
});

test('GitHub erişilemezse indirme sayfası GitHub bağlantısına düşer', async ({ page }) => {
  await page.route('https://api.github.com/repos/Mehbur07/MehburMC-Launcher/releases*', (route) =>
    route.fulfill({ status: 403, json: { message: 'rate limit' } }),
  );
  const win = await openLauncher(page);
  await win.getByRole('button', { name: "Launcher'ı indir" }).click();
  await expect(win.getByText('Sürüm bilgisi alınamadı.', { exact: false })).toBeVisible();
  await expect(win.getByRole('link', { name: 'Tüm sürümler (GitHub)' }).first()).toHaveAttribute(
    'href',
    'https://github.com/Mehbur07/MehburMC-Launcher/releases/latest',
  );
});
