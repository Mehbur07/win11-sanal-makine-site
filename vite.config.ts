import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Site virtualmos.github.io kök adresinde yayınlandığı için base '/'
export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
