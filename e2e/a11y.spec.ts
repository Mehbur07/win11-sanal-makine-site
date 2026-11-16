import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Faz 6: erişilebilirlik denetimi. axe-core, ekranı WCAG 2.2 AA kurallarına göre tarar
// (renk karşıtlığı, etiketsiz düğme, yanlış rol, klavyeyle ulaşılamayan öğe vb.).
// Bulgu varsa test hangi kuralın, hangi öğede bozulduğunu yazar.

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('vmos:lang')) localStorage.setItem('vmos:lang', 'tr');
    if (!localStorage.getItem('vmos:storage')) localStorage.setItem('vmos:storage', 'browser');
  });
  // Launcher dış ağa çıkmasın: sabit, boş bir sürüm listesi
  await page.route('https://api.github.com/**', (route) => route.fulfill({ json: [] }));
  await page.goto('/');
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
});

async function audit(page: Page, where: string) {
  // Açılış ve pencere animasyonları bitsin (yarı saydam anlarda karşıtlık yanlış ölçülmesin)
  await page.waitForTimeout(400);
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 5)
        .map((n) => `    ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1]?.trim()}`)
        .join('\n'),
  );
  expect(summary, `${where} ekranında erişilebilirlik bulguları`).toEqual([]);
}

async function openFromMenu(page: Page, name: string) {
  await page.getByRole('button', { name: 'Uygulama menüsü' }).click();
  await page.getByRole('dialog', { name: 'Uygulama menüsü' }).getByRole('button', { name }).click();
}

test('masaüstü, uygulama menüsü ve hızlı ayarlar', async ({ page }) => {
  await audit(page, 'Masaüstü');
  await page.getByRole('button', { name: 'Uygulama menüsü' }).click();
  await audit(page, 'Uygulama menüsü');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Hızlı ayarlar' }).click();
  await audit(page, 'Hızlı ayarlar');
});

test('açık temada masaüstü', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('vmos:theme', 'light'));
  await page.reload();
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 5000 });
  await audit(page, 'Açık tema masaüstü');
});

const APPS = [
  'Hakkında',
  'Dosyalar',
  'Metin Düzenleyici',
  'Hesap Makinesi',
  'Çizim',
  'Fotoğraflar',
  'Terminal',
  'Tarayıcı',
  'Ayarlar',
  'MehburMC Launcher',
];

for (const name of APPS) {
  test(`uygulama: ${name}`, async ({ page }, info) => {
    test.skip(info.project.name === 'telefon', 'Uygulamalar bilgisayar ve tablette taranır');
    await openFromMenu(page, name);
    await expect(page.getByRole('dialog').filter({ hasText: name }).first()).toBeVisible();
    await expect(page.locator('.app-load')).toHaveCount(0);
    await audit(page, name);
  });
}
