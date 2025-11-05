"use client";

import { useEffect } from "react";

import { PriceFeed } from "@/lib/mock-price-data";

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

  // Mock chart data for 24 hours
  const chartData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    price: priceFeed.price + (Math.random() - 0.5) * 1000,
  }));

  const maxPrice = Math.max(...chartData.map((d) => d.price));
  const minPrice = Math.min(...chartData.map((d) => d.price));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-1">Current Price</div>
              <div className="text-2xl font-bold text-white font-mono">
                $
                {priceFeed.price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-1">
                Confidence Interval
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                ±${priceFeed.confidence.toFixed(2)}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-1">24h Change</div>
              <div
                className={`text-2xl font-bold font-mono inline-flex items-center gap-1 ${
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

          {/* Chart */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              24 Hour Price History
            </h3>
            <div className="relative h-48">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 font-mono pr-2">
                <span>${maxPrice.toFixed(0)}</span>
                <span>${((maxPrice + minPrice) / 2).toFixed(0)}</span>
                <span>${minPrice.toFixed(0)}</span>
              </div>

              {/* Chart area */}
              <div className="ml-16 h-full relative">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    points={chartData
                      .map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = ((maxPrice - d.price) / priceRange) * 100;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    vectorEffect="non-scaling-stroke"
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* X-axis labels */}
              <div className="ml-16 mt-2 flex justify-between text-xs text-gray-500 font-mono">
                <span>0:00</span>
                <span>6:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-xs text-gray-400 space-y-1 bg-white/5 rounded-lg p-4 border border-white/10">
            <p>
              Data sourced from Pyth Network oracle. Confidence interval
              represents the uncertainty in the aggregated price.
            </p>
            <p>Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
