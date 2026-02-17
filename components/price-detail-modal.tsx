"use client";

import { useEffect } from "react";

import { TradingViewChart } from "@/components/tradingview-chart";
import type { PriceFeed } from "@/lib/price-feed-types";

interface PriceDetailModalProps {
  priceFeed: PriceFeed | null;
  open: boolean;
  onClose: () => void;
}

export function PriceDetailModal({
  priceFeed,
  open,
  onClose,
}: PriceDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!open || !priceFeed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-up"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl glass rounded-2xl border border-white/10 shadow-2xl animate-modal-in">
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
              {priceFeed.symbol}
            </h2>
            <p className="text-sm text-gray-300">{priceFeed.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-300 transition-all duration-300 p-1 rounded-lg hover:bg-green-500/10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-1">Current Price</div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                ${priceFeed.price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: priceFeed.price >= 1 ? 2 : 6,
                })}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-1">Confidence Interval</div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                ±${priceFeed.confidence.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: priceFeed.confidence >= 1 ? 2 : 6,
                })}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-1">24h Change</div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono inline-flex items-center gap-1 ${
                  priceFeed.change24h >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {priceFeed.change24h >= 0 ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  </svg>
                )}
                {Math.abs(priceFeed.change24h).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
            <h3 className="text-sm font-medium text-gray-300">
              Interactive TradingView Chart
            </h3>

            <TradingViewChart symbol={priceFeed.symbol} />
          </div>

          <div className="text-xs text-gray-400 space-y-1 bg-white/5 rounded-lg p-4 border border-white/10">
            <p>
              Data sourced from Pyth Network off-chain oracle (Hermes v2).
              Use the TradingView toolbar to switch timeframe intervals.
            </p>
            <p>Last updated: {new Date(priceFeed.lastUpdated).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
