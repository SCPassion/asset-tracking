"use client";

import { useState } from "react";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
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
import { mockPriceFeeds, type PriceFeed } from "@/lib/mock-price-data";

export default function FavoritesPage() {
  const [selectedPriceFeed, setSelectedPriceFeed] = useState<PriceFeed | null>(
    null
  );
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(["BTC/USD", "ETH/USD"])
  );

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const favoriteFeeds = mockPriceFeeds.filter((feed) =>
    favorites.has(feed.symbol)
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Favorites
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your starred price feeds for quick access
          </p>
        </div>

        {/* Favorites Table */}
        {favoriteFeeds.length > 0 ? (
          <div className="rounded-lg border border-border/40 bg-card/30 overflow-hidden">
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
                      Confidence
                    </TableHead>
                    <TableHead className="font-semibold text-right text-xs sm:text-sm">
                      24h Change
                    </TableHead>
                    <TableHead className="w-16 sm:w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {favoriteFeeds.map((feed) => (
                    <TableRow
                      key={feed.symbol}
                      className="border-border/40 hover:bg-secondary/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedPriceFeed(feed)}
                    >
                      <TableCell className="px-2 sm:px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8 hover:bg-primary/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(feed.symbol);
                          }}
                        >
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <div>
                          <div className="font-semibold text-sm sm:text-base">
                            {feed.symbol}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {feed.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm sm:text-base px-2 sm:px-4">
                        ${feed.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">
                        ±${feed.confidence.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right px-2 sm:px-4">
                        <div
                          className={`inline-flex items-center gap-1 font-semibold text-xs sm:text-sm ${
                            feed.change24h >= 0
                              ? "text-green-400"
                              : "text-red-400"
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
                      <TableCell className="px-2 sm:px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-primary/40 text-primary hover:bg-primary/20 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPriceFeed(feed);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/40 bg-card/30 p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Star your favorite price feeds to see them here for quick access
            </p>
            <Button
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/20 bg-transparent"
            >
              Browse Price Feeds
            </Button>
          </div>
        )}
      </div>

      <PriceDetailModal
        priceFeed={selectedPriceFeed}
        open={!!selectedPriceFeed}
        onClose={() => setSelectedPriceFeed(null)}
      />
    </div>
  );
}
