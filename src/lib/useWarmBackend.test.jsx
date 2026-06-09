// Test for useWarmBackend — it should fire a single fire-and-forget request to
// wake the backend on mount, and never throw even if that request fails.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useWarmBackend } from './useWarmBackend';
import { apiFetch } from './apiFetch';

vi.mock('./apiFetch', () => ({ apiFetch: vi.fn(() => Promise.resolve({})) }));

function Probe() {
  useWarmBackend();
  return null;
}

describe('useWarmBackend', () => {
  beforeEach(() => apiFetch.mockClear());

  it('pings the health route ("/") once on mount', () => {
    render(<Probe />);
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith('/');
  });

  it('swallows errors from the warm-up request (cold start)', () => {
    apiFetch.mockReturnValueOnce(Promise.reject(new Error('cold start')));
    expect(() => render(<Probe />)).not.toThrow();
  });
});
