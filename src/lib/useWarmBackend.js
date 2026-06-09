// Wakes the backend on mount with a fire-and-forget request.
//
// The API is hosted on Render's free tier, which spins the server down after
// ~15 minutes of inactivity; the next request then takes 30-60s to cold-start.
// Calling this when the Login / Signup pages mount starts that wake-up while
// the user is still reading and typing — so by the time they submit, the
// server is usually already awake and the login feels fast.

import { useEffect } from 'react';
import { apiFetch } from './apiFetch';

export function useWarmBackend() {
  useEffect(() => {
    // Hit the health route ("/") just to wake the server. We don't care about
    // the result, so any error (including the slow cold-start) is ignored.
    apiFetch('/').catch(() => {});
  }, []);
}
