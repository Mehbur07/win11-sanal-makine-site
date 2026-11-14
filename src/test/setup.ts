import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Her testten sonra ekrana çizilenleri temizle
afterEach(() => {
  cleanup();
  localStorage.clear();
});
