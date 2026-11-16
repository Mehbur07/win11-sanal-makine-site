import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { pwaPlugin } from './vite-pwa-plugin.ts';

// Site virtualmos.github.io kök adresinde yayınlandığı için base '/'
export default defineConfig({
  base: '/',
  // pwaPlugin: internetsiz açılış için dist/sw.js üretir (bkz. src/pwa/)
  plugins: [react(), pwaPlugin()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
