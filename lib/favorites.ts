import type { PriceFeed } from "@/lib/price-feed-types";

export const FAVORITES_STORAGE_KEY = "pyth-favorites";

export function normalizeFavoriteSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function favoriteKeyForFeed(feed: Pick<PriceFeed, "symbol">): string {
  return normalizeFavoriteSymbol(feed.symbol);
}

export function readFavoritesFromStorage(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();

    return new Set(
      parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => normalizeFavoriteSymbol(item))
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

export function writeFavoritesToStorage(favorites: Set<string>): void {
  if (typeof window === "undefined") {
    return;
  }

  const ordered = [...favorites]
    .map((item) => normalizeFavoriteSymbol(item))
    .filter(Boolean)
    .sort();
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ordered));
}
