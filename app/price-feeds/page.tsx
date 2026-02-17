"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Star, TrendingDown, TrendingUp, X } from "lucide-react";

import { PriceDetailModal } from "@/components/price-detail-modal";
import { FeedIcon } from "@/components/feed-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  favoriteKeyForFeed,
  normalizeFavoriteSymbol,
  readFavoritesFromStorage,
  writeFavoritesToStorage,
} from "@/lib/favorites";
import type { PriceFeed } from "@/lib/price-feed-types";

interface PriceFeedApiResponse {
  feeds: PriceFeed[];
}

const QUICK_SEARCHES = ["BTC", "ETH", "SOL", "AAPL", "XAU", "BTC/ETH"];
type TrackedFeedType = "crypto" | "equity" | "fx";

function formatPrice(value: number): string {
  const maxFractionDigits = value >= 1 ? 2 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  });
}

function useTrackedFeeds(type: TrackedFeedType) {
  const [feeds, setFeeds] = useState<PriceFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [updatingFeedIds, setUpdatingFeedIds] = useState<Set<string>>(new Set());
  const previousFeedsRef = useRef<Map<string, PriceFeed>>(new Map());
  const clearEffectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let canceled = false;
    let isInitialLoad = true;

    const load = async () => {
      if (!canceled && isInitialLoad) {
        setLoading(true);
      }
      try {
        const response = await fetch(`/api/price-feeds?type=${type}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = (await response.json()) as PriceFeedApiResponse;
        if (!canceled) {
          const nextFeeds = payload.feeds ?? [];
          const changedIds = nextFeeds
            .filter((feed) => {
              const previous = previousFeedsRef.current.get(feed.id);
              if (!previous) return false;
              return (
                previous.price !== feed.price ||
                previous.confidence !== feed.confidence ||
                previous.change24h !== feed.change24h
              );
            })
            .map((feed) => feed.id);

          setFeeds(nextFeeds);
          previousFeedsRef.current = new Map(nextFeeds.map((feed) => [feed.id, feed]));

          if (changedIds.length > 0) {
            setUpdatingFeedIds(new Set(changedIds));
            if (clearEffectTimeoutRef.current) {
              clearTimeout(clearEffectTimeoutRef.current);
            }
            clearEffectTimeoutRef.current = setTimeout(() => {
              setUpdatingFeedIds(new Set());
            }, 450);
          }

          setError(null);
          setLastRefreshedAt(Date.now());
        }
      } catch {
        if (!canceled) {
          setError("Unable to load feeds right now.");
        }
      } finally {
        if (!canceled && isInitialLoad) {
          setLoading(false);
        }
        isInitialLoad = false;
      }
    };

    load();
    const interval = setInterval(load, 15_000);

    return () => {
      canceled = true;
      clearInterval(interval);
      if (clearEffectTimeoutRef.current) {
        clearTimeout(clearEffectTimeoutRef.current);
      }
    };
  }, [type]);

  return { feeds, loading, error, lastRefreshedAt, updatingFeedIds };
}

const DesktopFeedTable = memo(function DesktopFeedTable({
  feeds,
  favorites,
  updatingFeedIds,
  onToggleFavorite,
  onSelect,
}: {
  feeds: PriceFeed[];
  favorites: Set<string>;
  updatingFeedIds?: Set<string>;
  onToggleFavorite: (symbol: string) => void;
  onSelect: (feed: PriceFeed) => void;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-300/10 bg-[#060d19]">
            <TableHead className="px-4 py-2 text-xs font-medium tracking-wide text-slate-300 uppercase">
              Asset
            </TableHead>
            <TableHead className="px-4 py-2 text-xs font-medium tracking-wide text-slate-300 uppercase text-right">
              Price
            </TableHead>
            <TableHead className="px-4 py-2 text-xs font-medium tracking-wide text-slate-300 uppercase text-right">
              24h
            </TableHead>
            <TableHead className="px-4 py-2 text-xs font-medium tracking-wide text-slate-300 uppercase text-right">
              Confidence
            </TableHead>
            <TableHead className="px-4 py-2 text-xs font-medium tracking-wide text-slate-300 uppercase text-right">
              Fav
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeds.map((feed) => {
            const favoriteKey = favoriteKeyForFeed(feed);
            return (
              <TableRow
                key={feed.id}
                className="cursor-pointer border-b border-slate-300/10 hover:bg-slate-900/50"
                onClick={() => onSelect(feed)}
              >
                <TableCell className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FeedIcon symbol={feed.symbol} className="h-8 w-8" />
                    <div>
                      <div className="text-sm text-slate-100 font-semibold">{feed.symbol}</div>
                      <div className="text-[11px] text-slate-300 line-clamp-1">{feed.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-mono text-sm text-slate-100">
                  <span
                    className={`inline-block transition-[filter] duration-300 ${
                      updatingFeedIds?.has(feed.id) ? "blur-[2px]" : "blur-0"
                    }`}
                  >
                    ${formatPrice(feed.price)}
                  </span>
                </TableCell>
                <TableCell
                  className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${
                    feed.change24h >= 0 ? "text-cyan-300" : "text-red-400"
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 transition-[filter] duration-300 ${
                      updatingFeedIds?.has(feed.id) ? "blur-[2px]" : "blur-0"
                    }`}
                  >
                    {feed.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(feed.change24h).toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-mono text-xs text-slate-300">
                  <span
                    className={`inline-block transition-[filter] duration-300 ${
                      updatingFeedIds?.has(feed.id) ? "blur-[2px]" : "blur-0"
                    }`}
                  >
                    ±${formatPrice(feed.confidence)}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-amber-300/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(favoriteKey);
                    }}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        favorites.has(favoriteKey)
                          ? "fill-amber-300 text-amber-300"
                          : "text-slate-500"
                      }`}
                    />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

const MobileFeedCards = memo(function MobileFeedCards({
  feeds,
  favorites,
  updatingFeedIds,
  onToggleFavorite,
  onSelect,
}: {
  feeds: PriceFeed[];
  favorites: Set<string>;
  updatingFeedIds?: Set<string>;
  onToggleFavorite: (symbol: string) => void;
  onSelect: (feed: PriceFeed) => void;
}) {
  return (
    <div className="grid gap-2 p-2 md:hidden">
      {feeds.map((feed) => {
        const favoriteKey = favoriteKeyForFeed(feed);
        return (
          <div
            key={feed.id}
            role="button"
            tabIndex={0}
            className="rounded-xl border border-slate-300/10 bg-[#08101d] p-3 text-left"
            onClick={() => onSelect(feed)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(feed);
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <FeedIcon symbol={feed.symbol} className="h-8 w-8" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">{feed.symbol}</p>
                  <p className="text-xs text-slate-300 line-clamp-1">{feed.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(favoriteKey);
                }}
              >
                <Star
                  className={`h-4 w-4 ${
                    favorites.has(favoriteKey)
                      ? "fill-amber-300 text-amber-300"
                      : "text-slate-500"
                  }`}
                />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p
                className={`font-mono text-sm text-slate-100 transition-[filter] duration-300 ${
                  updatingFeedIds?.has(feed.id) ? "blur-[2px]" : "blur-0"
                }`}
              >
                ${formatPrice(feed.price)}
              </p>
              <p
                className={`text-xs font-semibold transition-[filter] duration-300 ${
                  updatingFeedIds?.has(feed.id) ? "blur-[2px]" : "blur-0"
                } ${
                  feed.change24h >= 0 ? "text-cyan-300" : "text-red-400"
                }`}
              >
                {feed.change24h >= 0 ? "+" : "-"}
                {Math.abs(feed.change24h).toFixed(2)}%
              </p>
            </div>
            <p
              className={`mt-1 text-right font-mono text-[11px] text-slate-300 transition-[filter] duration-300 ${
                updatingFeedIds?.has(feed.id) ? "blur-[2px]" : "blur-0"
              }`}
            >
              ±${formatPrice(feed.confidence)}
            </p>
          </div>
        );
      })}
    </div>
  );
});

const FeedPanel = memo(function FeedPanel({
  className,
  title,
  subtitle,
  feeds,
  loading,
  error,
  lastRefreshedAt,
  favorites,
  updatingFeedIds,
  onToggleFavorite,
  onSelect,
}: {
  className?: string;
  title: string;
  subtitle: string;
  feeds: PriceFeed[];
  loading: boolean;
  error: string | null;
  lastRefreshedAt?: number | null;
  favorites: Set<string>;
  updatingFeedIds?: Set<string>;
  onToggleFavorite: (symbol: string) => void;
  onSelect: (feed: PriceFeed) => void;
}) {
  return (
    <section
      className={`glass rounded-2xl border border-slate-300/15 overflow-hidden ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-300/10 bg-[#060d19] px-3 py-2 sm:px-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-100">{title}</h2>
          <p className="text-[11px] sm:text-xs text-slate-300">{subtitle}</p>
        </div>
        <span className="rounded-md border border-slate-300/15 bg-slate-900/70 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
          {feeds.length} rows
        </span>
      </div>
      {!!lastRefreshedAt && (
        <div className="border-b border-slate-300/10 bg-[#060d19] px-3 py-1 text-[10px] text-slate-300 sm:px-4">
          Last refresh: {new Date(lastRefreshedAt).toLocaleTimeString()}
        </div>
      )}

      {loading && (
        <div className="p-4">
          <div className="h-7 w-full rounded-md animate-shimmer" />
        </div>
      )}
      {!loading && error && <p className="p-4 text-sm text-red-300">{error}</p>}
      {!loading && !error && feeds.length === 0 && (
        <p className="p-4 text-sm text-slate-300">No feeds to display.</p>
      )}
      {!loading && !error && feeds.length > 0 && (
        <>
          <DesktopFeedTable
            feeds={feeds}
            favorites={favorites}
            updatingFeedIds={updatingFeedIds}
            onToggleFavorite={onToggleFavorite}
            onSelect={onSelect}
          />
          <MobileFeedCards
            feeds={feeds}
            favorites={favorites}
            updatingFeedIds={updatingFeedIds}
            onToggleFavorite={onToggleFavorite}
            onSelect={onSelect}
          />
        </>
      )}
    </section>
  );
});

export default function PriceFeedsPage() {
  const [selectedPriceFeed, setSelectedPriceFeed] = useState<PriceFeed | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesReady, setFavoritesReady] = useState(false);
  const cryptoFeeds = useTrackedFeeds("crypto");
  const equityFeeds = useTrackedFeeds("equity");
  const fxFeeds = useTrackedFeeds("fx");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PriceFeed[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setFavorites(readFavoritesFromStorage());
    setFavoritesReady(true);
  }, []);

  useEffect(() => {
    if (!favoritesReady) return;
    writeFavoritesToStorage(favorites);
  }, [favorites, favoritesReady]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let canceled = false;

    const loadSearch = async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(
          `/api/price-feeds/search?q=${encodeURIComponent(debouncedQuery)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = (await response.json()) as PriceFeedApiResponse;
        if (!canceled) {
          setSearchResults(payload.feeds ?? []);
          setSearchError(null);
        }
      } catch {
        if (!canceled) {
          setSearchError("Unable to search Hermes feeds right now.");
        }
      } finally {
        if (!canceled) {
          setSearchLoading(false);
        }
      }
    };

    loadSearch();

    return () => {
      canceled = true;
    };
  }, [debouncedQuery]);

  const toggleFavorite = useCallback((symbol: string) => {
    const key = normalizeFavoriteSymbol(symbol);
    if (!key) return;

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
  }, []);

  const limitedSearchResults = useMemo(() => searchResults.slice(0, 12), [searchResults]);

  return (
    <div className="w-full px-2 pb-6 pt-3 sm:px-4 lg:px-6 space-y-3">
      <section className="glass rounded-2xl border border-slate-300/15 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-cyan-200/80">Market Terminal</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-100">Asset Feed Board</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              USD is default for all pairs. Type any symbol or cross pair like BTC/ETH.
            </p>
          </div>
          <div className="w-full lg:w-[520px] space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feed (BTC, ETH, SOL) or pair (BTC/ETH)"
                className="h-10 pl-9 pr-10 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-slate-300/20 bg-[#08101d]/95 shadow-2xl backdrop-blur-md">
                  <div className="max-h-72 overflow-y-auto">
                    {searchLoading && (
                      <p className="px-3 py-2 text-xs text-slate-300">Searching feeds...</p>
                    )}
                    {!searchLoading && searchError && (
                      <p className="px-3 py-2 text-xs text-red-300">{searchError}</p>
                    )}
                    {!searchLoading && !searchError && searchResults.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-300">No matching feeds.</p>
                    )}
                    {!searchLoading &&
                      !searchError &&
                      limitedSearchResults.map((feed) => (
                        <button
                          key={feed.id}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-300/10 px-3 py-2 text-left last:border-b-0 hover:bg-slate-800/60"
                          onClick={() => {
                            setSelectedPriceFeed(feed);
                            clearSearch();
                          }}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <FeedIcon symbol={feed.symbol} className="h-8 w-8" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-100">
                                {feed.symbol}
                              </span>
                              <span className="block truncate text-xs text-slate-300">{feed.name}</span>
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block font-mono text-sm text-slate-100">
                              ${formatPrice(feed.price)}
                            </span>
                            <span
                              className={`block text-xs font-semibold ${
                                feed.change24h >= 0 ? "text-cyan-300" : "text-red-400"
                              }`}
                            >
                              {feed.change24h >= 0 ? "+" : "-"}
                              {Math.abs(feed.change24h).toFixed(2)}%
                            </span>
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_SEARCHES.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  className="rounded-md border border-slate-300/15 bg-[#08101d] px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200"
                  onClick={() => setSearchQuery(symbol)}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <FeedPanel
            title="Suggested Crypto Feeds"
            subtitle="High-traffic USD feeds updated every 15 seconds."
            className="xl:col-span-2"
            feeds={cryptoFeeds.feeds}
            loading={cryptoFeeds.loading}
            error={cryptoFeeds.error}
            lastRefreshedAt={cryptoFeeds.lastRefreshedAt}
            favorites={favorites}
            updatingFeedIds={cryptoFeeds.updatingFeedIds}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedPriceFeed}
          />

          <FeedPanel
            title="Suggested Equity Feeds"
            subtitle="Major US equities updated every 15 seconds."
            feeds={equityFeeds.feeds}
            loading={equityFeeds.loading}
            error={equityFeeds.error}
            lastRefreshedAt={equityFeeds.lastRefreshedAt}
            favorites={favorites}
            updatingFeedIds={equityFeeds.updatingFeedIds}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedPriceFeed}
          />

          <FeedPanel
            title="Suggested FX Feeds"
            subtitle="Top FX pairs updated every 15 seconds."
            feeds={fxFeeds.feeds}
            loading={fxFeeds.loading}
            error={fxFeeds.error}
            lastRefreshedAt={fxFeeds.lastRefreshedAt}
            favorites={favorites}
            updatingFeedIds={fxFeeds.updatingFeedIds}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedPriceFeed}
          />
        </div>
      </div>

      <PriceDetailModal
        priceFeed={selectedPriceFeed}
        open={!!selectedPriceFeed}
        onClose={() => setSelectedPriceFeed(null)}
      />
    </div>
  );
}
