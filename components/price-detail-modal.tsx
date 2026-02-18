"use client";

import { useEffect, useState } from "react";
import type { PriceFeed } from "@/lib/price-feed-types";

interface PriceDetailModalProps {
  priceFeed: PriceFeed | null;
  open: boolean;
  onClose: () => void;
}

type HistoryInterval = "24h" | "7d" | "1m" | "1y";

const INTERVAL_LABELS: Record<HistoryInterval, string> = {
  "24h": "24H",
  "7d": "7D",
  "1m": "1M",
  "1y": "1Y",
};

function formatAxisLabel(time: string, interval: HistoryInterval): string {
  const date = new Date(time);
  if (interval === "24h") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (interval === "7d" || interval === "1m") {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString([], { month: "short", year: "2-digit" });
}

function formatDisplayPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  });
}

export function PriceDetailModal({
  priceFeed,
  open,
  onClose,
}: PriceDetailModalProps) {
  const [interval, setInterval] = useState<HistoryInterval>("24h");
  const [history, setHistory] = useState<{ time: string; price: number }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!open || !priceFeed) return;

    let canceled = false;
    const loadHistory = async () => {
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        const symbol = priceFeed.tradingViewSymbol ?? priceFeed.symbol;
        const params = new URLSearchParams({ symbol, interval });
        if (priceFeed.denominatorTradingViewSymbol) {
          params.set("denominator_symbol", priceFeed.denominatorTradingViewSymbol);
        }
        const response = await fetch(`/api/price-feeds/history?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`History request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          points?: { time: string; price: number }[];
        };
        const points = Array.isArray(payload.points) ? payload.points : [];

        if (!canceled) {
          setHistory(points);
        }
      } catch {
        if (!canceled) {
          setHistory([]);
          setHistoryError("Unable to load interval history.");
        }
      } finally {
        if (!canceled) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory();
    return () => {
      canceled = true;
    };
  }, [open, priceFeed, interval]);

  useEffect(() => {
    setHoveredIndex(null);
  }, [interval, priceFeed?.id, open]);

  if (!open || !priceFeed) return null;

  const chartData = history;
  const hasIntervalData = chartData.length > 0;
  const uniqueTimes = new Set(chartData.map((point) => point.time));
  const uniquePrices = new Set(chartData.map((point) => point.price.toString()));
  const hasMeaningfulIntervalData =
    chartData.length >= 2 && uniqueTimes.size >= 2 && uniquePrices.size > 1;

  const maxPrice = chartData.length
    ? Math.max(...chartData.map((d) => d.price))
    : priceFeed.price;
  const minPrice = chartData.length
    ? Math.min(...chartData.map((d) => d.price))
    : priceFeed.price;
  const priceRange = Math.max(maxPrice - minPrice, 1e-9);

  const points = chartData.map((point, index) => {
    const x = chartData.length > 1 ? (index / (chartData.length - 1)) * 100 : 0;
    const y = ((maxPrice - point.price) / priceRange) * 100;
    return `${x},${y}`;
  });

  const startPrice = chartData[0]?.price ?? priceFeed.price;
  const endPrice = chartData[chartData.length - 1]?.price ?? priceFeed.price;
  const rangeChange =
    hasMeaningfulIntervalData && startPrice > 0
      ? ((endPrice - startPrice) / startPrice) * 100
      : 0;

  const axisLabels =
    chartData.length < 2
      ? ["", "", ""]
      : [
          formatAxisLabel(chartData[0]?.time ?? "", interval),
          formatAxisLabel(
            chartData[Math.floor(chartData.length / 2)]?.time ?? "",
            interval
          ),
          formatAxisLabel(chartData[chartData.length - 1]?.time ?? "", interval),
        ];

  const hoverPoint =
    hasMeaningfulIntervalData && hoveredIndex !== null ? chartData[hoveredIndex] ?? null : null;

  const hoverX =
    hoveredIndex !== null && chartData.length > 1
      ? (hoveredIndex / (chartData.length - 1)) * 100
      : 0;
  const hoverY =
    hoverPoint && priceRange > 0
      ? ((maxPrice - hoverPoint.price) / priceRange) * 100
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-up"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto glass rounded-2xl border border-white/10 shadow-2xl animate-modal-in">
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-sky-500/12 via-cyan-500/12 to-amber-400/8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent">
              {priceFeed.symbol}
            </h2>
            <p className="text-sm text-gray-300">{priceFeed.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-sky-200 transition-all duration-300 p-1 rounded-lg hover:bg-sky-500/10"
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

        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  priceFeed.change24h >= 0 ? "text-cyan-300" : "text-red-400"
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
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-gray-300 mb-1">
                {INTERVAL_LABELS[interval]} Change
              </div>
              {hasMeaningfulIntervalData ? (
                <div
                  className={`text-xl sm:text-2xl font-bold font-mono ${
                    rangeChange >= 0 ? "text-cyan-300" : "text-red-400"
                  }`}
                >
                  {rangeChange >= 0 ? "+" : ""}
                  {rangeChange.toFixed(2)}%
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold font-mono text-gray-400">N/A</div>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-gray-300">
                Historical Price Chart
              </h3>
              <div className="inline-flex rounded-lg bg-black/30 border border-white/10 p-1">
                {(Object.keys(INTERVAL_LABELS) as HistoryInterval[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setInterval(value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      interval === value
                        ? "bg-sky-500/20 text-sky-200"
                        : "text-gray-400 hover:text-sky-200"
                    }`}
                  >
                    {INTERVAL_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            {loadingHistory && (
              <div className="h-56 rounded-lg border border-white/10 bg-black/20 animate-shimmer" />
            )}

            {!loadingHistory && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                {hasMeaningfulIntervalData ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      <div className="rounded-md bg-white/5 border border-white/10 px-3 py-2">
                        <div className="text-[11px] text-gray-400">High</div>
                        <div className="font-mono text-sm text-white">${formatDisplayPrice(maxPrice)}</div>
                      </div>
                      <div className="rounded-md bg-white/5 border border-white/10 px-3 py-2">
                        <div className="text-[11px] text-gray-400">Low</div>
                        <div className="font-mono text-sm text-white">${formatDisplayPrice(minPrice)}</div>
                      </div>
                      <div className="rounded-md bg-white/5 border border-white/10 px-3 py-2">
                        <div className="text-[11px] text-gray-400">Start</div>
                        <div className="font-mono text-sm text-white">${formatDisplayPrice(startPrice)}</div>
                      </div>
                      <div className="rounded-md bg-white/5 border border-white/10 px-3 py-2">
                        <div className="text-[11px] text-gray-400">End</div>
                        <div className="font-mono text-sm text-white">${formatDisplayPrice(endPrice)}</div>
                      </div>
                    </div>

                    <div className="h-56 rounded-md border border-white/5 bg-black/10 p-2">
                      <div className="flex h-full gap-2">
                        <div className="relative w-14 shrink-0 border-r border-white/10 text-[11px] font-mono text-gray-500">
                          <span className="absolute right-2 top-0 -translate-y-1/2">
                            ${formatDisplayPrice(maxPrice)}
                          </span>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2">
                            ${formatDisplayPrice((maxPrice + minPrice) / 2)}
                          </span>
                          <span className="absolute right-2 bottom-0 translate-y-1/2">
                            ${formatDisplayPrice(minPrice)}
                          </span>
                        </div>

                        <div className="relative min-w-0 flex-1">
                          {hoverPoint && (
                            <div
                              className="pointer-events-none absolute z-20 rounded-md border border-sky-300/40 bg-[#07101e]/95 px-2 py-1 text-[11px] text-slate-100 shadow-lg shadow-black/30 transition-opacity duration-150"
                              style={{
                                left: `${hoverX}%`,
                                top: `${Math.max(hoverY - 8, 4)}%`,
                                transform: "translate(-50%, -100%)",
                              }}
                            >
                              <div className="font-mono tabular-nums">${formatDisplayPrice(hoverPoint.price)}</div>
                              <div className="text-slate-300">{formatAxisLabel(hoverPoint.time, interval)}</div>
                            </div>
                          )}
                          {hoverPoint && (
                            <>
                              <div
                                className="pointer-events-none absolute z-10 h-4 w-4 rounded-full border border-cyan-300/80 bg-cyan-300/20"
                                style={{
                                  left: `${hoverX}%`,
                                  top: `${hoverY}%`,
                                  transform: "translate(-50%, -50%)",
                                }}
                              />
                              <div
                                className="pointer-events-none absolute z-10 h-2.5 w-2.5 rounded-full border border-cyan-100 bg-cyan-300"
                                style={{
                                  left: `${hoverX}%`,
                                  top: `${hoverY}%`,
                                  transform: "translate(-50%, -50%)",
                                }}
                              />
                            </>
                          )}

                          <svg
                            className="h-full w-full cursor-crosshair touch-none"
                            preserveAspectRatio="none"
                            viewBox="0 0 100 100"
                            onPointerMove={(event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              if (rect.width <= 0 || chartData.length < 1) return;
                              const rawX = event.clientX - rect.left;
                              const clampedX = Math.min(Math.max(rawX, 0), rect.width);
                              const ratio = clampedX / rect.width;
                              const index = Math.round(ratio * Math.max(chartData.length - 1, 0));
                              setHoveredIndex(index);
                            }}
                            onPointerLeave={() => setHoveredIndex(null)}
                          >
                            <defs>
                              <linearGradient id="history-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="50%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#fbbf24" />
                              </linearGradient>
                            </defs>
                            {hoverPoint && (
                              <line
                                x1={hoverX}
                                x2={hoverX}
                                y1="0"
                                y2="100"
                                stroke="#67e8f9"
                                strokeOpacity="0.25"
                                strokeDasharray="1.2 1.2"
                                vectorEffect="non-scaling-stroke"
                              />
                            )}
                            <polyline
                              fill="none"
                              stroke="url(#history-line-gradient)"
                              strokeWidth="2"
                              points={points.join(" ")}
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span>{axisLabels[0]}</span>
                      <span>{axisLabels[1]}</span>
                      <span>{axisLabels[2]}</span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-300/20 bg-amber-400/10 px-4 py-6 text-center">
                    <p className="text-sm text-amber-200">
                      Not enough interval data for {INTERVAL_LABELS[interval]} to draw a reliable curve.
                    </p>
                    <p className="mt-1 text-xs text-amber-100/80">
                      Try another time interval to view available history.
                    </p>
                  </div>
                )}
              </div>
            )}

            {historyError && (
              <p className="text-xs text-amber-300">{historyError}</p>
            )}
          </div>

          <div className="text-xs text-gray-400 space-y-1 bg-white/5 rounded-lg p-4 border border-white/10">
            <p>
              Data sourced from Pyth Network off-chain oracle (Hermes v2).
              Interval chart data comes from Pyth Benchmarks historical API.
            </p>
            <p>Last updated: {new Date(priceFeed.lastUpdated).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
