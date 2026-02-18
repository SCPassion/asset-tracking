import { PriceFeed } from "@/lib/price-feed-types";

const HERMES_BASE = "https://hermes.pyth.network";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export type TrackedAssetType = "crypto" | "equity" | "fx" | "crypto-redemption-rate";

type TrackedAsset = {
  symbol: string;
  name: string;
  assetType: TrackedAssetType;
};

const TRACKED_ASSETS_BY_TYPE: Record<TrackedAssetType, readonly TrackedAsset[]> = {
  crypto: [
    { symbol: "SOL/USD", name: "Solana", assetType: "crypto" },
    { symbol: "BTC/USD", name: "Bitcoin", assetType: "crypto" },
    { symbol: "ETH/USD", name: "Ethereum", assetType: "crypto" },
    { symbol: "PYTH/USD", name: "Pyth Network", assetType: "crypto" },
    { symbol: "FOGO/USD", name: "Fogo", assetType: "crypto" },
    { symbol: "JUP/USD", name: "Jupiter", assetType: "crypto" },
  ],
  equity: [
    { symbol: "AAPL/USD", name: "Apple", assetType: "equity" },
    { symbol: "MSFT/USD", name: "Microsoft", assetType: "equity" },
    { symbol: "NVDA/USD", name: "NVIDIA", assetType: "equity" },
    { symbol: "TSLA/USD", name: "Tesla", assetType: "equity" },
    { symbol: "AMZN/USD", name: "Amazon", assetType: "equity" },
    { symbol: "GOOGL/USD", name: "Alphabet", assetType: "equity" },
  ],
  fx: [
    { symbol: "EUR/USD", name: "Euro / US Dollar", assetType: "fx" },
    { symbol: "GBP/USD", name: "British Pound / US Dollar", assetType: "fx" },
    { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", assetType: "fx" },
    { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", assetType: "fx" },
    { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", assetType: "fx" },
    { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", assetType: "fx" },
  ],
  "crypto-redemption-rate": [
    { symbol: "mSOL/SOL", name: "Marinade Staked SOL / Solana", assetType: "crypto-redemption-rate" },
    { symbol: "jitoSOL/SOL", name: "Jito Staked SOL / Solana", assetType: "crypto-redemption-rate" },
    { symbol: "stETH/ETH", name: "Lido Staked Ether / Ether", assetType: "crypto-redemption-rate" },
    { symbol: "wstETH/stETH", name: "Wrapped stETH / stETH", assetType: "crypto-redemption-rate" },
    { symbol: "rETH/ETH", name: "Rocket Pool Ether / Ether", assetType: "crypto-redemption-rate" },
    { symbol: "ezETH/ETH", name: "Renzo Restaked ETH / Ether", assetType: "crypto-redemption-rate" },
  ],
};

type HermesDiscovery = {
  id?: string;
  attributes?: {
    symbol?: string;
    display_symbol?: string;
    generic_symbol?: string;
    description?: string;
    display_name?: string;
    base?: string;
    base_asset?: string;
    quote_currency?: string;
    quote?: string;
    asset_type?: string;
  };
};

type ParsedPrice = {
  id?: string;
  price?: {
    price?: string | number;
    conf?: string | number;
    expo?: number;
    publish_time?: number;
  };
};

type TrackedFeedReference = {
  id: string;
  tradingViewSymbol: string;
};

const cachedFeedIdsByType: Partial<
  Record<
    TrackedAssetType,
    { expiresAt: number; bySymbol: Record<string, TrackedFeedReference> }
  >
> = {};

function normalizeSymbol(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(url: string): Promise<T> {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, { cache: "no-store" });

    if (response.ok) {
      return (await response.json()) as T;
    }

    const shouldRetry = RETRYABLE_STATUSES.has(response.status);
    if (!shouldRetry || attempt === maxAttempts) {
      throw new Error(`Request failed (${response.status})`);
    }

    const baseDelay = 250 * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 200);
    await sleep(baseDelay + jitter);
  }

  throw new Error("Request failed after retries");
}

function toNumber(value?: string | number): number {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePrice(price?: {
  price?: string | number;
  conf?: string | number;
  expo?: number;
  publish_time?: number;
}): { price: number; confidence: number; publishTime: number } {
  if (!price) {
    return { price: 0, confidence: 0, publishTime: Math.floor(Date.now() / 1000) };
  }

  const expo = typeof price.expo === "number" ? price.expo : 0;
  const scale = 10 ** expo;
  const rawPrice = toNumber(price.price);
  const rawConf = toNumber(price.conf);

  return {
    price: rawPrice * scale,
    confidence: rawConf * scale,
    publishTime: typeof price.publish_time === "number" ? price.publish_time : Math.floor(Date.now() / 1000),
  };
}

function slugify(symbol: string): string {
  return symbol.toLowerCase().replace(/\//g, "-");
}

function buildSyntheticHistory(currentPrice: number): { time: string; price: number }[] {
  const history: { time: string; price: number }[] = [];
  const now = Date.now();

  for (let i = 24; i >= 0; i -= 1) {
    const time = new Date(now - i * 60 * 60 * 1000);
    const variance = (Math.random() - 0.5) * 0.03;
    history.push({
      time: time.toISOString(),
      price: Number((currentPrice * (1 + variance)).toFixed(4)),
    });
  }

  return history;
}

function pickMatchingFeed(feeds: HermesDiscovery[], symbol: string): HermesDiscovery | undefined {
  const normalizedTarget = normalizeSymbol(symbol);

  const exact = feeds.find((feed) => {
    const attr = feed.attributes;
    const candidates = [
      attr?.symbol,
      attr?.display_symbol,
      attr?.generic_symbol,
      attr?.base && (attr?.quote_currency ?? attr?.quote)
        ? `${attr.base}/${attr.quote_currency ?? attr.quote}`
        : undefined,
    ].filter(Boolean) as string[];

    return candidates.some((candidate) => normalizeSymbol(candidate) === normalizedTarget);
  });

  return exact ?? feeds[0];
}

function resolveFeedSymbol(feed: HermesDiscovery): string {
  const attr = feed.attributes;
  const pairFromParts =
    attr?.base && (attr?.quote_currency ?? attr?.quote)
      ? `${attr.base}/${attr.quote_currency ?? attr?.quote}`
      : undefined;
  const fallback =
    pairFromParts ??
    attr?.symbol ??
    attr?.generic_symbol ??
    attr?.display_symbol ??
    "UNKNOWN/USD";

  return fallback.includes("/") ? fallback : `${fallback}/USD`;
}

function resolveFeedName(feed: HermesDiscovery, symbol: string): string {
  const attr = feed.attributes;
  return (
    attr?.display_name ??
    attr?.description ??
    attr?.base_asset ??
    attr?.base ??
    symbol
  );
}

function resolveTradingViewSymbol(feed: HermesDiscovery, fallbackDisplaySymbol: string): string {
  const attr = feed.attributes;
  if (attr?.symbol) {
    return attr.symbol;
  }

  const displayPair = fallbackDisplaySymbol.includes(" ")
    ? fallbackDisplaySymbol.split(" ")[0]
    : fallbackDisplaySymbol;

  if (displayPair.includes("/")) {
    return `Crypto.${displayPair}`;
  }

  return `Crypto.${displayPair}/USD`;
}

function fallbackTrackedTradingViewSymbol(symbol: string, assetType: TrackedAssetType): string {
  if (assetType === "equity") {
    const base = symbol.split("/")[0] ?? symbol;
    return `Equity.US.${base}/USD`;
  }
  if (assetType === "fx") {
    return `FX.${symbol}`;
  }
  return `Crypto.${symbol}`;
}

async function discoverFeedReference(
  symbol: string,
  assetType: TrackedAssetType
): Promise<TrackedFeedReference | null> {
  const params = new URLSearchParams({ query: symbol });
  if (assetType !== "crypto-redemption-rate") {
    params.set("asset_type", assetType);
  }
  const url = `${HERMES_BASE}/v2/price_feeds?${params.toString()}`;
  const feeds = await fetchWithRetry<HermesDiscovery[]>(url);

  if (!Array.isArray(feeds) || feeds.length === 0) {
    return null;
  }

  const match = pickMatchingFeed(feeds, symbol);
  if (!match?.id) {
    return null;
  }

  const discoveredSymbol = match.attributes?.symbol;
  const tradingViewSymbol =
    typeof discoveredSymbol === "string" && discoveredSymbol.length > 0
      ? discoveredSymbol
      : fallbackTrackedTradingViewSymbol(symbol, assetType);

  return { id: match.id, tradingViewSymbol };
}

async function getFeedIdsBySymbol(
  type: TrackedAssetType,
  trackedAssets: readonly TrackedAsset[]
): Promise<Record<string, TrackedFeedReference>> {
  const now = Date.now();
  const cached = cachedFeedIdsByType[type];
  if (cached && cached.expiresAt > now) {
    return cached.bySymbol;
  }

  const entries = await Promise.all(
    trackedAssets.map(async (asset) => {
      const ref = await discoverFeedReference(asset.symbol, asset.assetType);
      return ref ? [asset.symbol, ref] : null;
    })
  );

  const bySymbol = Object.fromEntries(
    entries.filter(Boolean) as [string, TrackedFeedReference][]
  );
  cachedFeedIdsByType[type] = {
    bySymbol,
    expiresAt: now + 24 * 60 * 60 * 1000,
  };

  return bySymbol;
}

async function fetchLatestPrices(ids: string[]): Promise<Map<string, ParsedPrice>> {
  const params = new URLSearchParams();
  for (const id of ids) {
    params.append("ids[]", id);
  }
  params.set("parsed", "true");

  const url = `${HERMES_BASE}/v2/updates/price/latest?${params.toString()}`;
  const payload = await fetchWithRetry<{ parsed?: ParsedPrice[] }>(url);

  return new Map((payload.parsed ?? []).map((item) => [item.id ?? "", item]));
}

async function fetchDayAgoPrices(ids: string[], timestamp: number): Promise<Map<string, ParsedPrice>> {
  const params = new URLSearchParams();
  for (const id of ids) {
    params.append("ids[]", id);
  }
  params.set("parsed", "true");

  const url = `${HERMES_BASE}/v2/updates/price/${timestamp}?${params.toString()}`;
  try {
    const payload = await fetchWithRetry<{ parsed?: ParsedPrice[] }>(url);
    return new Map((payload.parsed ?? []).map((item) => [item.id ?? "", item]));
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) {
      // Some feeds or timestamps do not have day-ago snapshots in Hermes.
      // Treat this as missing historical data instead of surfacing noisy errors.
      return new Map();
    }
    throw error;
  }
}

export async function getTrackedPriceFeeds(type: TrackedAssetType = "crypto"): Promise<PriceFeed[]> {
  const trackedAssets = TRACKED_ASSETS_BY_TYPE[type] ?? TRACKED_ASSETS_BY_TYPE.crypto;
  const feedIdsBySymbol = await getFeedIdsBySymbol(type, trackedAssets);
  const ids = Object.values(feedIdsBySymbol).map((ref) => ref.id);
  if (ids.length === 0) {
    return [];
  }

  const dayAgoTimestamp = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const latestById = await fetchLatestPrices(ids);
  let dayAgoById = new Map<string, ParsedPrice>();
  try {
    dayAgoById = await fetchDayAgoPrices(ids, dayAgoTimestamp);
  } catch (error) {
    console.error("Unable to fetch 24h historical prices from Hermes", error);
  }

  const feeds: PriceFeed[] = [];

  for (const asset of trackedAssets) {
    const ref = feedIdsBySymbol[asset.symbol];
    if (!ref) continue;
    const id = ref.id;

    const latestEntry = latestById.get(id);
    const previousEntry = dayAgoById.get(id);

    const latest = normalizePrice(latestEntry?.price);
    const previous = normalizePrice(previousEntry?.price);

    const change24h =
      previous.price > 0
        ? ((latest.price - previous.price) / previous.price) * 100
        : 0;

    feeds.push({
      id: slugify(asset.symbol),
      symbol: asset.symbol,
      name: asset.name,
      tradingViewSymbol: ref.tradingViewSymbol,
      baseSymbol: asset.symbol,
      price: Number(latest.price.toFixed(6)),
      confidence: Number(latest.confidence.toFixed(6)),
      change24h: Number(change24h.toFixed(2)),
      lastUpdated: new Date(latest.publishTime * 1000).toISOString(),
      priceHistory: buildSyntheticHistory(latest.price),
    });
  }

  return feeds;
}

export async function searchPriceFeeds(
  query: string,
  limit = 40
): Promise<PriceFeed[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({ query: trimmed });
  const url = `${HERMES_BASE}/v2/price_feeds?${params.toString()}`;
  const discovered = await fetchWithRetry<HermesDiscovery[]>(url);

  if (!Array.isArray(discovered) || discovered.length === 0) {
    return [];
  }

  const candidates = discovered
    .filter((feed) => typeof feed.id === "string" && feed.id.length > 0)
    .slice(0, limit);

  const ids = candidates.map((feed) => feed.id as string);
  const latestById = await fetchLatestPrices(ids);
  const dayAgoTimestamp = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

  let dayAgoById = new Map<string, ParsedPrice>();
  try {
    dayAgoById = await fetchDayAgoPrices(ids, dayAgoTimestamp);
  } catch (error) {
    console.error("Unable to fetch day-ago prices for search results", error);
  }

  return candidates.map((feed) => {
    const id = feed.id as string;
    const symbol = resolveFeedSymbol(feed);
    const name = resolveFeedName(feed, symbol);
    const tradingViewSymbol = resolveTradingViewSymbol(feed, symbol);
    const latest = normalizePrice(latestById.get(id)?.price);
    const previous = normalizePrice(dayAgoById.get(id)?.price);
    const change24h =
      previous.price > 0
        ? ((latest.price - previous.price) / previous.price) * 100
        : 0;

    return {
      id: `${slugify(symbol)}-${id.slice(0, 8)}`,
      symbol,
      name,
      tradingViewSymbol,
      baseSymbol: symbol,
      price: Number(latest.price.toFixed(6)),
      confidence: Number(latest.confidence.toFixed(6)),
      change24h: Number(change24h.toFixed(2)),
      lastUpdated: new Date(latest.publishTime * 1000).toISOString(),
      priceHistory: buildSyntheticHistory(latest.price),
    };
  });
}
