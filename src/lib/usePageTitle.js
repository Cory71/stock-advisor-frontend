// Sets the browser tab title for the page that calls this hook.
// Pass a string like 'Watchlist' and the tab becomes "Watchlist · StockGrader".
// Pass nothing (or null) and it becomes just "StockGrader" — used for the
// home page where the brand alone is enough.
//
// Why a hook instead of just setting document.title inline: keeps every page
// consistent ("X · StockGrader" pattern) and means we only have to change the
// suffix once if we ever rename the app.

import { useEffect } from 'react';

const BRAND = 'StockGrader';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : BRAND;
  }, [title]);
}
