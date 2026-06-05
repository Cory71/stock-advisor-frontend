// Auto-dismiss alert helper.
// Pass it a piece of alert state (a truthy/falsy value), the setter to clear
// it, and an optional delay in milliseconds. When the value becomes truthy,
// the hook starts a timer that clears the state after `delay` ms.
//
// Used by every page that shows a transient banner alert (success or error)
// so the UX is consistent — alerts fade themselves after 5 seconds without
// the user having to click an X.

import { useEffect } from 'react';

export function useAutoDismiss(value, clear, delay = 5000) {
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => clear(null), delay);
    return () => clearTimeout(timer);
  }, [value, clear, delay]);
}
