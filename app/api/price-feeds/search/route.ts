import { NextRequest, NextResponse } from "next/server";

import type { PriceFeed } from "@/lib/price-feed-types";
import { searchPriceFeeds } from "@/lib/pyth-offchain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function findUsdFeed(feeds: PriceFeed[], base: string): PriceFeed | null {
  const normalizedBase = normalizeToken(base);
  const exact = feeds.find((feed) => {
    const pair = pairFromFeed(feed);
    return pair?.base === normalizedBase && pair.quote === "USD";
  });

  if (exact) {
    return exact;
  }

  return (
    feeds.find((feed) => {
      const pair = pairFromFeed(feed);
      return pair?.quote === "USD";
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

      const [baseCandidates, denominatorCandidates] = await Promise.all([
        searchPriceFeeds(`${base}/USD`, 40),
        searchPriceFeeds(`${denominator}/USD`, 40),
      ]);

      const baseFeed = findUsdFeed(baseCandidates, base);
      if (!baseFeed) {
        return NextResponse.json({ feeds: [] });
      }

      if (denominator === "USD") {
        return NextResponse.json({ feeds: [baseFeed] });
      }

      const denominatorFeed = findUsdFeed(denominatorCandidates, denominator);
      if (!denominatorFeed) {
        return NextResponse.json({ feeds: [] });
      }

      return NextResponse.json({
        feeds: [withDerivedDenominator(baseFeed, denominatorFeed)],
      });
    }

    const normalized = normalizeToken(query);
    const usdQuery = normalized ? `${normalized}/USD` : query;
    const usdFeeds = await searchPriceFeeds(usdQuery, 40);
    const usdOnly = usdFeeds.filter((feed) => pairFromFeed(feed)?.quote === "USD");

    const feeds = usdOnly.length > 0 ? usdOnly : usdFeeds;
    return NextResponse.json({ feeds });
  } catch (error) {
    console.error("Failed to search Pyth price feeds", error);
    return NextResponse.json(
      { feeds: [], error: "Failed to search Pyth feed data" },
      { status: 502 }
    );
  }
}
