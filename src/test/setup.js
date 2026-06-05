// Loaded once before any test file. Adds the jest-dom matchers (e.g.
// `expect(el).toBeInTheDocument()`) and stubs out localStorage to keep
// component tests deterministic.

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library doesn't auto-clean between tests with Vitest, so we do it here.
afterEach(() => {
  cleanup();
});

// Fresh localStorage per test — important since apiFetch reads the JWT from there.
beforeEach(() => {
  localStorage.clear();
});
