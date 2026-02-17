"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { PriceFeed } from "@/lib/price-feed-types";

interface PriceFeedApiResponse {
  feeds: PriceFeed[];
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
    { href: "/price-feeds", label: "Price Feeds" },
    { href: "/favorites", label: "Favorites" },
    { href: "/about", label: "About" },
  ];
  useEffect(() => {
    let canceled = false;

    const loadTape = async () => {
      try {
        const response = await fetch("/api/price-feeds", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as PriceFeedApiResponse;
        if (!canceled) {
          setTapeFeeds((payload.feeds ?? []).slice(0, 5));
        }
      } catch {
        if (!canceled) {
          setTapeFeeds([]);
        }
      }
    };

    loadTape();
    const interval = setInterval(loadTape, 30_000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/10 glass">
      <div className="container mx-auto relative flex h-14 sm:h-16 items-center justify-center px-3 sm:px-4">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent transition-all duration-300"
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

        <div className="absolute right-3 sm:right-4 flex items-center gap-2 sm:gap-3">
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

      <div className="hidden md:flex relative items-center border-t border-slate-300/10 px-3 sm:px-4 h-9 text-xs text-slate-200">
        <div className="flex w-full items-center justify-start gap-4 overflow-x-auto pr-28">
          {tapeFeeds.length > 0 ? (
            tapeFeeds.map((feed) => (
              <span key={feed.id} className="whitespace-nowrap">
                <span className="text-slate-100">{feed.symbol.split("/")[0]}</span>{" "}
                <span className="text-slate-200">${formatTickerPrice(feed.price)}</span>{" "}
                <span className={feed.change24h >= 0 ? "text-cyan-300" : "text-red-400"}>
                  {feed.change24h >= 0 ? "+" : "-"}
                  {Math.abs(feed.change24h).toFixed(1)}%
                </span>
              </span>
            ))
          ) : (
            <span className="text-slate-500">Loading tape...</span>
          )}
        </div>
        <span className="absolute right-3 sm:right-4 text-slate-500">Hermes v2 Live</span>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/10 glass">
          <div className="container mx-auto px-3 sm:px-4 py-4 space-y-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-sm font-medium transition-all duration-300 hover:text-sky-200 py-2",
                  pathname === link.href ? "text-sky-200" : "text-slate-200"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-200/10" />
          </div>
        </div>
      )}
    </nav>
  );
}

export { Navigation };
export default Navigation;
