"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleHelp, Star, TrendingDown, TrendingUp } from "lucide-react";
import { FeedIcon } from "@/components/feed-icon";
import { PriceDetailModal } from "@/components/price-detail-modal";
import { Button } from "@/components/ui/button";
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

function ConfidenceHelpTooltip() {
  return (
    <span className="relative inline-flex items-center gap-1.5 group/tooltip">
      <span>Confidence</span>
      <button
        type="button"
        aria-label="About confidence score"
        className="text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 rounded-sm transition-colors duration-150"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-md border border-slate-200/15 bg-[#0a1220]/95 px-2.5 py-2 text-[11px] normal-case tracking-normal leading-relaxed text-slate-200 opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        Price feed reliability score based on source quality and update frequency.
      </span>
    </span>
  );
}

export default function FavoritesPage() {
  const [selectedPriceFeed, setSelectedPriceFeed] = useState<PriceFeed | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [feeds, setFeeds] = useState<PriceFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setFavorites(readFavoritesFromStorage());
    setFavoritesReady(true);
  }, []);

  useEffect(() => {
    if (!favoritesReady) return;
    writeFavoritesToStorage(favorites);
  }, [favorites, favoritesReady]);

  useEffect(() => {
    if (!favoritesReady) return;

    let canceled = false;
    const symbols = [...favorites];

    const loadFeeds = async () => {
      if (!canceled) {
        setIsLoading(true);
      }

      if (symbols.length === 0) {
        if (!canceled) {
          setFeeds([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const resolved = await Promise.all(
          symbols.map(async (symbol) => {
            const response = await fetch(
              `/api/price-feeds/search?q=${encodeURIComponent(symbol)}`,
              { cache: "no-store" }
            );
            if (!response.ok) {
              return null;
            }

            const payload = (await response.json()) as PriceFeedApiResponse;
            const candidates = payload.feeds ?? [];
            const exact = candidates.find(
              (feed) => favoriteKeyForFeed(feed) === normalizeFavoriteSymbol(symbol)
            );
            return exact ?? candidates[0] ?? null;
          })
        );

        if (!canceled) {
          setFeeds(resolved.filter((feed): feed is PriceFeed => feed !== null));
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    };

    loadFeeds();
    const interval = setInterval(loadFeeds, 30_000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [favorites, favoritesReady]);

  const toggleFavorite = (symbol: string) => {
    const key = normalizeFavoriteSymbol(symbol);
    if (!key) return;

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(key)) {
        newFavorites.delete(key);
      } else {
        newFavorites.add(key);
      }
      return newFavorites;
    });
  };

  const favoriteFeeds = feeds;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="space-y-4 sm:space-y-6 animate-fade-up">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent">
            Favorites
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your starred price feeds for quick access
          </p>
        </div>

        {favoriteFeeds.length > 0 ? (
          <>
            <div className="grid gap-3 md:hidden">
              {favoriteFeeds.map((feed) => (
                <button
                  key={feed.id}
                  type="button"
                  className="glass rounded-xl border border-white/10 bg-white/5 p-3 text-left shadow-lg shadow-black/20 transition-colors duration-150 hover:bg-white/5"
                  onClick={() => setSelectedPriceFeed(feed)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FeedIcon symbol={feed.symbol} className="h-8 w-8" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {feed.symbol}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{feed.name}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 shrink-0 hover:bg-amber-300/15"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(favoriteKeyForFeed(feed));
                      }}
                    >
                      <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-mono tabular-nums text-sm font-semibold text-slate-100">
                      ${formatPrice(feed.price)}
                    </p>
                    <p
                      className={`font-mono tabular-nums text-xs font-semibold ${
                        feed.change24h >= 0 ? "text-cyan-300" : "text-red-400"
                      }`}
                    >
                      {feed.change24h >= 0 ? "+" : "-"}
                      {Math.abs(feed.change24h).toFixed(2)}%
                    </p>
                  </div>
                  <p className="mt-1 text-right font-mono tabular-nums text-[11px] text-muted-foreground">
                    ±${formatPrice(feed.confidence)}
                  </p>
                </button>
              ))}
            </div>

            <div className="hidden md:block glass rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 overflow-hidden">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="font-semibold text-xs sm:text-sm">
                      Asset
                    </TableHead>
                    <TableHead className="font-semibold text-right text-xs sm:text-sm">
                      Price
                    </TableHead>
                    <TableHead className="font-semibold text-right text-xs sm:text-sm hidden sm:table-cell">
                      <ConfidenceHelpTooltip />
                    </TableHead>
                    <TableHead className="font-semibold text-right text-xs sm:text-sm">
                      24h Change
                    </TableHead>
                    <TableHead className="w-16 sm:w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {favoriteFeeds.map((feed, index) => (
                    <TableRow
                      key={feed.id}
                      className="border-border/40 hover:bg-white/5 cursor-pointer transition-colors duration-150 animate-fade-up"
                      onClick={() => setSelectedPriceFeed(feed)}
                      style={{ animationDelay: `${Math.min(index * 40, 280)}ms` }}
                    >
                      <TableCell className="px-2 sm:px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8 hover:bg-amber-300/15"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(favoriteKeyForFeed(feed));
                          }}
                        >
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-amber-300 text-amber-300" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-1.5 sm:py-2">
                        <div className="flex items-center gap-2">
                          <FeedIcon symbol={feed.symbol} className="h-8 w-8" />
                          <div>
                            <div className="font-semibold text-sm sm:text-base leading-tight">
                              {feed.symbol}
                            </div>
                            <div className="text-xs sm:text-sm leading-tight text-muted-foreground">
                              {feed.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold text-sm sm:text-base px-2 sm:px-4 py-1.5 sm:py-2">
                        ${formatPrice(feed.price)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 hidden sm:table-cell">
                        ±${formatPrice(feed.confidence)}
                      </TableCell>
                      <TableCell className="text-right px-2 sm:px-4 py-1.5 sm:py-2">
                        <div
                          className={`inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-xs sm:text-sm ${
                            feed.change24h >= 0 ? "text-cyan-300" : "text-red-400"
                          }`}
                        >
                          {feed.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                          {Math.abs(feed.change24h).toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-right text-[11px] text-gray-400">
                        Tap row
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          </>
        ) : (
          <div className="glass rounded-2xl border border-white/10 p-12 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              {isLoading ? "Loading favorites..." : "No favorites yet"}
            </h3>
            <p className="text-gray-400 mb-4">
              {isLoading
                ? "Pulling live feed data from Pyth."
                : "Star your favorite price feeds to see them here for quick access"}
            </p>
            <Link href="/price-feeds">
              <Button
                variant="outline"
                className="border-sky-300/40 text-sky-200 hover:bg-sky-500/20 bg-transparent"
              >
                Browse Price Feeds
              </Button>
            </Link>
          </div>
        )}
      </div>

      <PriceDetailModal
        priceFeed={selectedPriceFeed}
        open={!!selectedPriceFeed}
        onClose={() => setSelectedPriceFeed(null)}
        isFavorite={
          selectedPriceFeed ? favorites.has(favoriteKeyForFeed(selectedPriceFeed)) : false
        }
        onToggleFavorite={() => {
          if (!selectedPriceFeed) return;
          toggleFavorite(favoriteKeyForFeed(selectedPriceFeed));
        }}
      />
    </div>
  );
}
