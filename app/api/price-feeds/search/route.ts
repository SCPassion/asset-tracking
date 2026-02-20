import { NextRequest, NextResponse } from "next/server";

import type { PriceFeed } from "@/lib/price-feed-types";
import { getTrackedPriceFeeds, searchPriceFeeds } from "@/lib/pyth-offchain";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const PAIR_LOOKUP_LIMIT = 8;
const SEARCH_LIMIT = 12;
const FALLBACK_SEARCH_LIMIT = 24;

function normalizeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function pairFromFeed(feed: PriceFeed): { base: string; quote: string } | null {
  const symbol = feed.baseSymbol ?? feed.symbol;
  const token = symbol.split(" ")[0] ?? symbol;
  const [base, quote] = token.split("/");
  if (!base || !quote) return null;
  return { base: normalizeToken(base), quote: normalizeToken(quote) };
}

function rankFeedForQuery(feed: PriceFeed, normalizedQuery: string): number {
  const pair = pairFromFeed(feed);
  if (!pair) return 4;

  if (pair.base === normalizedQuery && pair.quote === "USD") return 0;
  if (pair.base === normalizedQuery) return 1;
  if (pair.base.includes(normalizedQuery)) return 2;
  if ((feed.name ?? "").toUpperCase().includes(normalizedQuery)) return 3;
  return 4;
}

function sortFeedsForQuery(feeds: PriceFeed[], query: string): PriceFeed[] {
  const normalizedQuery = normalizeToken(query);
  if (!normalizedQuery) return feeds;

  return [...feeds].sort((a, b) => {
    const rankDelta = rankFeedForQuery(a, normalizedQuery) - rankFeedForQuery(b, normalizedQuery);
    if (rankDelta !== 0) return rankDelta;

    const aPair = pairFromFeed(a);
    const bPair = pairFromFeed(b);
    const aUsd = aPair?.quote === "USD" ? 1 : 0;
    const bUsd = bPair?.quote === "USD" ? 1 : 0;
    if (aUsd !== bUsd) return bUsd - aUsd;

    return a.symbol.localeCompare(b.symbol);
  });
}

function dedupeFeeds(feeds: PriceFeed[]): PriceFeed[] {
  const seen = new Set<string>();
  const unique: PriceFeed[] = [];

  for (const feed of feeds) {
    const key = `${feed.id}:${feed.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(feed);
  }

  return unique;
}

function hasExactUsdBase(feeds: PriceFeed[], normalizedBase: string): boolean {
  return feeds.some((feed) => {
    const pair = pairFromFeed(feed);
    return pair?.base === normalizedBase && pair.quote === "USD";
  });
}

function findExactUsdFeed(feeds: PriceFeed[], base: string): PriceFeed | null {
  const normalizedBase = normalizeToken(base);
  return (
    feeds.find((feed) => {
      const pair = pairFromFeed(feed);
      return pair?.base === normalizedBase && pair.quote === "USD";
    }) ?? null
  );
}

function findCanonicalTrackedUsdFeed(feeds: PriceFeed[], base: string): PriceFeed | null {
  const normalizedBase = normalizeToken(base);
  return (
    feeds.find((feed) => {
      const pair = pairFromFeed(feed);
      return pair?.base === normalizedBase && pair.quote === "USD";
    }) ?? null
  );
}

async function resolveUsdFeedForBase(
  base: string,
  candidates: PriceFeed[],
  trackedCryptoFeeds: PriceFeed[]
): Promise<PriceFeed | null> {
  const exactFromUsdQuery = findExactUsdFeed(candidates, base);
  if (exactFromUsdQuery) {
    return exactFromUsdQuery;
  }

  const fallbackCandidates = await searchPriceFeeds(base, FALLBACK_SEARCH_LIMIT);
  const exactFromFallback = findExactUsdFeed(fallbackCandidates, base);
  if (exactFromFallback) {
    return exactFromFallback;
  }

  return findCanonicalTrackedUsdFeed(trackedCryptoFeeds, base);
}

function findCanonicalForQuery(feeds: PriceFeed[], normalizedQuery: string): PriceFeed | null {
  return (
    feeds.find((feed) => {
      const pair = pairFromFeed(feed);
      return pair?.base === normalizedQuery && pair.quote === "USD";
    }) ?? null
  );
}

function withDerivedDenominator(baseFeed: PriceFeed, denominatorFeed: PriceFeed): PriceFeed {
  if (baseFeed.price <= 0 || denominatorFeed.price <= 0) {
    return baseFeed;
  }

  const basePair = pairFromFeed(baseFeed);
  const denominatorPair = pairFromFeed(denominatorFeed);
  const baseSymbol = basePair?.base ?? normalizeToken(baseFeed.symbol);
  const denominatorSymbol = denominatorPair?.base ?? normalizeToken(denominatorFeed.symbol);

  const eps = 1e-12;
  const price = baseFeed.price / denominatorFeed.price;
  const confidence =
    price *
    ((baseFeed.confidence / Math.max(baseFeed.price, eps)) +
      denominatorFeed.confidence / Math.max(denominatorFeed.price, eps));

  const baseChange = baseFeed.change24h / 100;
  const denomChange = denominatorFeed.change24h / 100;
  const change24h = ((1 + baseChange) / (1 + denomChange) - 1) * 100;

  return {
    ...baseFeed,
    id: `${baseFeed.id}-over-${denominatorFeed.id}`,
    symbol: `${baseSymbol}/${denominatorSymbol}`,
    name: `${baseFeed.name} / ${denominatorFeed.name}`,
    denominatorSymbol: denominatorFeed.baseSymbol ?? denominatorFeed.symbol,
    denominatorTradingViewSymbol:
      denominatorFeed.tradingViewSymbol ?? denominatorFeed.symbol,
    price: Number(price.toFixed(8)),
    confidence: Number(confidence.toFixed(8)),
    change24h: Number(change24h.toFixed(2)),
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ feeds: [] });
  }

  try {
    const pairMatch = query.match(/^\s*([^/]+?)\s*\/\s*([^/]+?)\s*$/);
    if (pairMatch) {
      const base = normalizeToken(pairMatch[1] ?? "");
      const denominator = normalizeToken(pairMatch[2] ?? "");

      if (!base || !denominator) {
        return NextResponse.json({ feeds: [] });
      }

      const [baseCandidates, denominatorCandidates, trackedCryptoFeeds] = await Promise.all([
        searchPriceFeeds(`${base}/USD`, PAIR_LOOKUP_LIMIT),
        searchPriceFeeds(`${denominator}/USD`, PAIR_LOOKUP_LIMIT),
        getTrackedPriceFeeds("crypto").catch(() => []),
      ]);

      const [baseFeed, denominatorFeed] = await Promise.all([
        resolveUsdFeedForBase(base, baseCandidates, trackedCryptoFeeds),
        denominator === "USD"
          ? Promise.resolve(null)
          : resolveUsdFeedForBase(denominator, denominatorCandidates, trackedCryptoFeeds),
      ]);

      if (!baseFeed) {
        return NextResponse.json({ feeds: [] });
      }

      if (denominator === "USD") {
        return NextResponse.json({ feeds: [baseFeed] });
      }

      if (!denominatorFeed) {
        return NextResponse.json({ feeds: [] });
      }

      return NextResponse.json({
        feeds: [withDerivedDenominator(baseFeed, denominatorFeed)],
      });
    }

    const normalized = normalizeToken(query);
    let feeds: PriceFeed[];
    if (normalized) {
      const [usdFeeds, fallbackFeeds] = await Promise.all([
        searchPriceFeeds(`${normalized}/USD`, SEARCH_LIMIT),
        searchPriceFeeds(normalized, FALLBACK_SEARCH_LIMIT),
      ]);

      const merged = dedupeFeeds([...usdFeeds, ...fallbackFeeds]);
      const usdOnly = merged.filter((feed) => pairFromFeed(feed)?.quote === "USD");
      feeds = sortFeedsForQuery(usdOnly.length > 0 ? usdOnly : merged, normalized);

      if (!hasExactUsdBase(feeds, normalized)) {
        try {
          const trackedCryptoFeeds = await getTrackedPriceFeeds("crypto");
          const canonical = findCanonicalForQuery(trackedCryptoFeeds, normalized);

          if (canonical) {
            feeds = sortFeedsForQuery(dedupeFeeds([canonical, ...feeds]), normalized);
          }
        } catch {
          // Ignore fallback failures and return best-effort search results.
        }
      }
    } else {
      const rawFeeds = await searchPriceFeeds(query, SEARCH_LIMIT);
      feeds = sortFeedsForQuery(rawFeeds, query);
    }

    return NextResponse.json({ feeds });
  } catch (error) {
    console.error("Failed to search Pyth price feeds", error);
    return NextResponse.json(
      { feeds: [], error: "Failed to search Pyth feed data" },
      { status: 502 }
    );
  }
}
