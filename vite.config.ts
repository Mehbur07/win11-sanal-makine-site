import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { pwaPlugin } from './vite-pwa-plugin.ts';
import pkg from './package.json';

// Site virtualmos.github.io kök adresinde yayınlandığı için base '/'
export default defineConfig({
  base: '/',
  // pwaPlugin: internetsiz açılış için dist/sw.js üretir (bkz. src/pwa/)
  plugins: [react(), pwaPlugin()],
  // Sürüm numarası package.json'dan alınır; "Hakkında" penceresinde gösterilir
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
