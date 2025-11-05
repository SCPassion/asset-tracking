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

export default function PriceFeedsPage() {
  const [selectedPriceFeed, setSelectedPriceFeed] = useState<PriceFeed | null>(
    null
  );
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent mb-3 sm:mb-4">
            Track Any
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
            Track any asset, anywhere, anytime
          </p>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-4">
            Real-time price data and market monitoring with advanced analytics
            for DeFi protocols and blockchain infrastructure.
          </p>
        </div>

        <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 p-4 sm:p-6 border-b border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Asset Tracking Dashboard
            </h2>
            <p className="text-sm sm:text-base text-gray-300">
              Monitor real-time asset data across multiple blockchain ecosystems
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 bg-black/20">
                  <TableHead className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">
                    Asset
                  </TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">
                    Price
                  </TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300 hidden sm:table-cell">
                    Confidence
                  </TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">
                    24h Change
                  </TableHead>
                  <TableHead className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPriceFeeds.map((feed) => (
                <TableRow
                  key={feed.id}
                  className="border-b border-white/5 hover:bg-gradient-to-r hover:from-green-500/5 hover:via-emerald-500/5 hover:to-green-500/5 transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedPriceFeed(feed)}
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
                        <div className="text-xs sm:text-sm text-gray-400">
                          {feed.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="font-mono text-white text-sm sm:text-lg font-semibold">
                        $
                        {feed.price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4 text-right hidden sm:table-cell">
                      <div className="font-mono text-gray-300 bg-white/5 rounded-lg px-2 sm:px-3 py-1 inline-block text-xs sm:text-sm">
                        ±${feed.confidence.toFixed(2)}
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
                          toggleFavorite(feed.symbol);
                        }}
                        variant="ghost"
                        className="text-gray-400 hover:text-green-400 transition-all duration-300 hover:bg-green-500/10 p-1 sm:p-2 rounded-lg"
                      >
                        {favorites.has(feed.symbol) ? (
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-green-400 text-green-400" />
                        ) : (
                          <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
