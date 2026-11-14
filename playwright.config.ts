import { defineConfig } from '@playwright/test';

const PORT = 4173;

// Üç cihaz sınıfında test: bilgisayar, tablet, telefon (kullanım oranı %45 / %45 / %10)
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'pc', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'tablet', use: { viewport: { width: 1180, height: 820 }, hasTouch: true } },
    {
      name: 'telefon',
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
