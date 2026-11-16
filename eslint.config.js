import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.{js,ts}', 'vite-pwa-plugin.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  // Service worker şablonu: düz JavaScript, tarayıcının arka plan ortamında çalışır
  {
    files: ['src/pwa/sw-template.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...globals.serviceworker, __VERSION__: 'readonly', __PRECACHE__: 'readonly' },
    },
  },
  // Biçimlendirme kurallarını Prettier'a bırak
  prettier,
]);
