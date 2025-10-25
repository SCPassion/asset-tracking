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
    <div className="min-h-screen flex flex-col pb-20">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Track Any
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Track any asset, anywhere, anytime
            </p>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real-time price data and market monitoring with advanced analytics
              for DeFi protocols and blockchain infrastructure.
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-2">
                Asset Tracking Dashboard
              </h2>
              <p className="text-gray-300">
                Monitor real-time asset data across multiple blockchain
                ecosystems
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 bg-black/20">
                    <TableHead className="text-left px-6 py-4 text-sm font-medium text-gray-300">
                      Asset
                    </TableHead>
                    <TableHead className="text-right px-6 py-4 text-sm font-medium text-gray-300">
                      Price
                    </TableHead>
                    <TableHead className="text-right px-6 py-4 text-sm font-medium text-gray-300">
                      Confidence
                    </TableHead>
                    <TableHead className="text-right px-6 py-4 text-sm font-medium text-gray-300">
                      24h Change
                    </TableHead>
                    <TableHead className="text-right px-6 py-4 text-sm font-medium text-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPriceFeeds.map((feed) => (
                    <TableRow
                      key={feed.id}
                      className="border-b border-white/5 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-pink-500/5 transition-all duration-300 cursor-pointer group"
                      onClick={() => setSelectedPriceFeed(feed)}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                            {feed.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                              {feed.symbol}
                            </div>
                            <div className="text-sm text-gray-400">
                              {feed.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="font-mono text-white text-lg font-semibold">
                          $
                          {feed.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="font-mono text-gray-300 bg-white/5 rounded-lg px-3 py-1 inline-block">
                          ±${feed.confidence.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-3 py-1 rounded-lg ${
                            feed.change24h >= 0
                              ? "text-green-400 bg-green-500/10"
                              : "text-red-400 bg-red-500/10"
                          }`}
                        >
                          {feed.change24h >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(feed.change24h).toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(feed.symbol);
                          }}
                          className="text-gray-400 hover:text-purple-400 transition-colors hover:bg-purple-500/10 p-2 rounded-lg"
                        >
                          {favorites.has(feed.symbol) ? (
                            <Star className="w-5 h-5 fill-purple-400" />
                          ) : (
                            <Star className="w-5 h-5" />
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
      </main>

      <PriceDetailModal
        priceFeed={selectedPriceFeed}
        open={!!selectedPriceFeed}
        onClose={() => setSelectedPriceFeed(null)}
      />
    </div>
  );
}
