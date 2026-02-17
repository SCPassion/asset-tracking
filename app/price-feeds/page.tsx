"use client";

import { useEffect, useState } from "react";
import { Search, Star, TrendingDown, TrendingUp, X } from "lucide-react";

import { PriceDetailModal } from "@/components/price-detail-modal";
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

function formatPrice(value: number): string {
  const maxFractionDigits = value >= 1 ? 2 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  });
}

function FeedRows({
  feeds,
  favorites,
  onToggleFavorite,
  onSelect,
}: {
  feeds: PriceFeed[];
  favorites: Set<string>;
  onToggleFavorite: (symbol: string) => void;
  onSelect: (feed: PriceFeed) => void;
}) {
  return (
    <>
      {feeds.map((feed, index) => {
        const favoriteKey = favoriteKeyForFeed(feed);
        return (
          <TableRow
            key={feed.id}
            className="border-b border-white/5 hover:bg-gradient-to-r hover:from-green-500/5 hover:via-emerald-500/5 hover:to-green-500/5 transition-all duration-300 cursor-pointer group animate-fade-up"
            onClick={() => onSelect(feed)}
            style={{ animationDelay: `${Math.min(index * 35, 260)}ms` }}
          >
            <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg shadow-green-500/30">
                  {feed.symbol.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-green-300 transition-colors text-sm sm:text-base">
                    {feed.symbol}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">{feed.name}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="px-3 sm:px-6 py-3 sm:py-4 text-right">
              <div className="font-mono text-white text-sm sm:text-lg font-semibold">
                ${formatPrice(feed.price)}
              </div>
            </TableCell>
            <TableCell className="px-3 sm:px-6 py-3 sm:py-4 text-right hidden sm:table-cell">
              <div className="font-mono text-gray-300 bg-white/5 rounded-lg px-2 sm:px-3 py-1 inline-block text-xs sm:text-sm">
                ±${formatPrice(feed.confidence)}
              </div>
            </TableCell>
            <TableCell className="px-3 sm:px-6 py-3 sm:py-4 text-right">
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${
                  feed.change24h >= 0
                    ? "text-green-400 bg-green-500/10"
                    : "text-red-400 bg-red-500/10"
                }`}
              >
                {feed.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                {Math.abs(feed.change24h).toFixed(2)}%
              </span>
            </TableCell>
            <TableCell className="px-3 sm:px-6 py-3 sm:py-4 text-right">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(favoriteKey);
                }}
                variant="ghost"
                className="text-gray-400 hover:text-green-400 transition-all duration-300 hover:bg-green-500/10 p-1 sm:p-2 rounded-lg"
              >
                {favorites.has(favoriteKey) ? (
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-green-400 text-green-400" />
                ) : (
                  <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export default function PriceFeedsPage() {
  const [selectedPriceFeed, setSelectedPriceFeed] = useState<PriceFeed | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesReady, setFavoritesReady] = useState(false);

  const [suggestedFeeds, setSuggestedFeeds] = useState<PriceFeed[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PriceFeed[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
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
    let canceled = false;

    const loadSuggested = async () => {
      if (!canceled) {
        setSuggestedLoading(true);
      }
      try {
        const response = await fetch("/api/price-feeds", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = (await response.json()) as PriceFeedApiResponse;
        if (!canceled) {
          setSuggestedFeeds(payload.feeds ?? []);
          setSuggestedError(null);
        }
      } catch {
        if (!canceled) {
          setSuggestedError("Unable to load suggested feeds right now.");
        }
      } finally {
        if (!canceled) {
          setSuggestedLoading(false);
        }
      }
    };

    loadSuggested();
    const interval = setInterval(loadSuggested, 30_000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, []);

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

  const toggleFavorite = (symbol: string) => {
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
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-6">
      <div className="max-w-7xl mx-auto animate-fade-up">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-400/25 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300 mb-4">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Live Pyth Off-chain Oracle
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent mb-3 sm:mb-4">
            Track Any
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-4">
            Search any symbol and prices default to USD pairs. You can also type cross pairs like BTC/ETH.
          </p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-fade-up">
        <div className="bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-cyan-500/10 p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Search All Pyth Feeds
          </h2>
          <p className="text-sm text-gray-300">
            Query in one box. Default quote is USD, and cross pairs like BTC/ETH are supported.
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search (BTC, ETH, SOL, AAPL) or cross pair (BTC/ETH)"
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">Showing up to 40 search results.</p>
        </div>

        {debouncedQuery && (
          <div className="overflow-x-auto border-t border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 bg-black/20">
                  <TableHead className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">Asset</TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">Price</TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300 hidden sm:table-cell">Confidence</TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">24h Change</TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchLoading && (
                  <TableRow className="border-b border-white/5">
                    <TableCell colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      <div className="mx-auto h-7 w-64 rounded-md animate-shimmer" />
                    </TableCell>
                  </TableRow>
                )}
                {!searchLoading && searchError && (
                  <TableRow className="border-b border-white/5">
                    <TableCell colSpan={5} className="px-6 py-8 text-center text-red-300">
                      {searchError}
                    </TableCell>
                  </TableRow>
                )}
                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <TableRow className="border-b border-white/5">
                    <TableCell colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No Pyth feeds found for "{debouncedQuery}".
                    </TableCell>
                  </TableRow>
                )}
                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <FeedRows
                    feeds={searchResults}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    onSelect={setSelectedPriceFeed}
                  />
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-fade-up">
        <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Suggested Crypto Feeds
          </h2>
          <p className="text-sm sm:text-base text-gray-300">
            Curated high-traffic feeds for quick tracking.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 bg-black/20">
                <TableHead className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">Asset</TableHead>
                <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">Price</TableHead>
                <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300 hidden sm:table-cell">Confidence</TableHead>
                <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">24h Change</TableHead>
                <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestedLoading && (
                <TableRow className="border-b border-white/5">
                  <TableCell colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    <div className="mx-auto h-7 w-64 rounded-md animate-shimmer" />
                  </TableCell>
                </TableRow>
              )}
              {!suggestedLoading && suggestedError && (
                <TableRow className="border-b border-white/5">
                  <TableCell colSpan={5} className="px-6 py-8 text-center text-red-300">
                    {suggestedError}
                  </TableCell>
                </TableRow>
              )}
              {!suggestedLoading && !suggestedError && suggestedFeeds.length === 0 && (
                <TableRow className="border-b border-white/5">
                  <TableCell colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No suggested feeds available right now.
                  </TableCell>
                </TableRow>
              )}
              {!suggestedLoading && !suggestedError && suggestedFeeds.length > 0 && (
                <FeedRows
                  feeds={suggestedFeeds}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onSelect={setSelectedPriceFeed}
                />
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <PriceDetailModal
        priceFeed={selectedPriceFeed}
        open={!!selectedPriceFeed}
        onClose={() => setSelectedPriceFeed(null)}
      />
    </div>
  );
}
