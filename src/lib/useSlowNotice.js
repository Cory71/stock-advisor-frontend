// True once something has been loading for longer than `delayMs`.
//
// The API sleeps on Render's free tier after ~15 minutes idle, and the first
// request then takes up to a minute while it wakes. A normal grade loads in a
// second or two, so if it's still loading after a few seconds the page can
// explain the wait instead of looking stuck.

import { useEffect, useState } from 'react';

export const SLOW_AFTER_MS = 4000;

export function useSlowNotice(active, delayMs = SLOW_AFTER_MS) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setSlow(false);
    if (!active) return undefined;
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);   // stop waiting once loading finishes
  }, [active, delayMs]);

  return slow;
}
