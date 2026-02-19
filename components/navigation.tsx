"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CircleHelp, Github, LineChart, Menu, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  FAVORITES_UPDATED_EVENT,
  normalizeFavoriteSymbol,
  readFavoritesFromStorage,
} from "@/lib/favorites";
import type { PriceFeed } from "@/lib/price-feed-types";

interface PriceFeedApiResponse {
  feeds: PriceFeed[];
}

const DEFAULT_TAPE_SYMBOLS = ["BTC", "ETH", "SOL", "PYTH", "FOGO", "JUP"] as const;

function normalizeSymbolForMatch(symbol: string): string {
  return symbol.replace(/\s+/g, "").toUpperCase();
}

function baseFromPair(symbol: string): string {
  const pair = symbol.split(" ")[0] ?? symbol;
  const [base] = pair.split("/");
  return (base ?? pair).replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function quoteFromPair(symbol: string): string {
  const pair = symbol.split(" ")[0] ?? symbol;
  const [, quote] = pair.split("/");
  return (quote ?? "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function formatTickerPrice(value: number): string {
  const maxFractionDigits = value >= 1000 ? 0 : value >= 1 ? 2 : 4;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tapeFeeds, setTapeFeeds] = useState<PriceFeed[]>([]);

  const links = [
    { href: "/price-feeds", label: "Price Feeds", icon: LineChart },
    { href: "/favorites", label: "Favorites", icon: Star },
    { href: "/about", label: "About", icon: CircleHelp },
  ];
  useEffect(() => {
    let canceled = false;

    const loadTape = async () => {
      try {
        const favoriteSymbols = [...readFavoritesFromStorage()].slice(0, 8);
        const symbolsToResolve =
          favoriteSymbols.length > 0 ? favoriteSymbols : [...DEFAULT_TAPE_SYMBOLS];

        const resolved = await Promise.all(
          symbolsToResolve.map(async (symbol) => {
            const normalizedInput = normalizeFavoriteSymbol(symbol);
            const query = normalizedInput.includes("/")
              ? normalizedInput
              : `${normalizedInput}/USD`;
            const preferredBase = baseFromPair(normalizedInput);
            const preferredQuote = quoteFromPair(normalizedInput) || "USD";

            const response = await fetch(
              `/api/price-feeds/search?q=${encodeURIComponent(query)}`,
              { cache: "no-store" }
            );
            if (!response.ok) {
              return null;
            }

            const payload = (await response.json()) as PriceFeedApiResponse;
            const candidates = payload.feeds ?? [];
            const exactPair = candidates.find(
              (feed) =>
                baseFromPair(feed.symbol) === preferredBase &&
                quoteFromPair(feed.symbol) === preferredQuote
            );
            if (exactPair) return exactPair;

            const exactText = candidates.find(
              (feed) =>
                normalizeSymbolForMatch(feed.symbol) === normalizeSymbolForMatch(query)
            );
            if (exactText) return exactText;

            const usdFallback = candidates.find((feed) => quoteFromPair(feed.symbol) === "USD");
            return usdFallback ?? candidates[0] ?? null;
          })
        );

        if (!canceled) {
          const deduped = new Map<string, PriceFeed>();
          for (const feed of resolved) {
            if (!feed) continue;
            if (!deduped.has(feed.id)) {
              deduped.set(feed.id, feed);
            }
          }
          setTapeFeeds([...deduped.values()].slice(0, 5));
        }
      } catch {
        if (!canceled) {
          setTapeFeeds([]);
        }
      }
    };

    loadTape();
    const interval = setInterval(loadTape, 15_000);
    const handleFavoritesUpdated = () => {
      void loadTape();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "pyth-favorites") {
        void loadTape();
      }
    };
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      canceled = true;
      clearInterval(interval);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/10 glass">
      <div className="relative flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-lg font-bold tracking-tight bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent transition-all duration-300 sm:gap-3 sm:text-xl lg:static lg:translate-x-0 lg:text-2xl"
          >
            <Image
              src="/TrackAny.png"
              alt="Track Any Logo"
              width={24}
              height={24}
              className="rounded-lg sm:w-8 sm:h-8 ring-2 ring-sky-300/25 transition-all"
            />
            <span className="hidden xs:inline">Track Any</span>
            <span className="xs:hidden">Track Any</span>
          </Link>

          <div className="hidden items-center gap-4 sm:gap-6 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-all duration-300 relative",
                  pathname === link.href
                    ? "text-sky-200"
                    : "text-slate-200 hover:text-sky-200"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="https://github.com/SCPassion/asset-tracking"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300/20 bg-slate-900/40 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-sky-200 hover:border-sky-300/40 transition-colors duration-150"
            >
              <Github className="h-3.5 w-3.5" />
              Project Repo
            </a>
            <a
              href="https://www.scptech.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300/20 bg-slate-900/40 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-sky-200 hover:border-sky-300/40 transition-colors duration-150"
            >
              <img
                src="https://www.scptech.xyz/favicon.ico"
                alt="SCP Tech icon"
                className="h-3.5 w-3.5 rounded-sm"
              />
              Built by SCPTech
            </a>
          </div>
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden text-white hover:bg-white/10 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {tapeFeeds.length > 0 && (
        <div className="hidden md:block border-t border-b border-slate-300/15 h-9 text-xs text-slate-100/90">
          <div className="relative flex h-full w-full items-center px-3 sm:px-4 lg:px-6">
            <div className="flex w-full items-center justify-start gap-4 overflow-x-auto pr-44">
              {tapeFeeds.map((feed) => (
                <span key={feed.id} className="whitespace-nowrap font-mono tabular-nums">
                  <span className="font-sans text-slate-50">{feed.symbol.split("/")[0]}</span>{" "}
                  <span className="text-slate-100">${formatTickerPrice(feed.price)}</span>{" "}
                  <span className={feed.change24h >= 0 ? "text-cyan-300" : "text-red-400"}>
                    {feed.change24h >= 0 ? "+" : "-"}
                    {Math.abs(feed.change24h).toFixed(1)}%
                  </span>
                </span>
              ))}
            </div>
            <span className="absolute right-3 sm:right-4 text-slate-400">Pyth Network · Hermes v2 Live</span>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/10 glass">
          <div className="px-3 sm:px-4 py-3">
            <div className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors duration-150 py-2.5 hover:text-sky-200",
                      pathname === link.href ? "text-sky-200" : "text-slate-200"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              <a
                href="https://github.com/SCPassion/asset-tracking"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 text-sm font-medium text-slate-200 hover:text-sky-200 py-2.5 transition-colors duration-150"
              >
                <Github className="h-4 w-4" />
                Project GitHub Repo
              </a>
              <a
                href="https://www.scptech.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 text-sm font-medium text-slate-200 hover:text-sky-200 py-2.5 transition-colors duration-150"
              >
                <img
                  src="https://www.scptech.xyz/favicon.ico"
                  alt="SCP Tech icon"
                  className="h-4 w-4 rounded-sm"
                />
                Built by SCPTech
              </a>
            </div>
            <div className="mt-3 border-t border-slate-200/10" />
          </div>
        </div>
      )}
    </nav>
  );
}

export { Navigation };
export default Navigation;
