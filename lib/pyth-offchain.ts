import { PriceFeed } from "@/lib/price-feed-types";

const HERMES_BASE = "https://hermes.pyth.network";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const TRACKED_ASSETS = [
  { symbol: "BTC/USD", name: "Bitcoin", assetType: "crypto" },
  { symbol: "ETH/USD", name: "Ethereum", assetType: "crypto" },
  { symbol: "SOL/USD", name: "Solana", assetType: "crypto" },
  { symbol: "AVAX/USD", name: "Avalanche", assetType: "crypto" },
  { symbol: "MATIC/USD", name: "Polygon", assetType: "crypto" },
  { symbol: "ATOM/USD", name: "Cosmos", assetType: "crypto" },
  { symbol: "DOT/USD", name: "Polkadot", assetType: "crypto" },
  { symbol: "LINK/USD", name: "Chainlink", assetType: "crypto" },
] as const;

type HermesDiscovery = {
  id?: string;
  attributes?: {
    symbol?: string;
    display_symbol?: string;
    generic_symbol?: string;
    base?: string;
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

let cachedFeedIds: { expiresAt: number; bySymbol: Record<string, string> } | null =
  null;

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
      throw new Error(`Request failed (${response.status}): ${url}`);
    }

    const baseDelay = 250 * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 200);
    await sleep(baseDelay + jitter);
  }

  throw new Error(`Request failed after retries: ${url}`);
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

async function discoverFeedId(symbol: string, assetType: string): Promise<string | null> {
  const params = new URLSearchParams({ query: symbol, asset_type: assetType });
  const url = `${HERMES_BASE}/v2/price_feeds?${params.toString()}`;
  const feeds = await fetchWithRetry<HermesDiscovery[]>(url);

  if (!Array.isArray(feeds) || feeds.length === 0) {
    return null;
  }

  const match = pickMatchingFeed(feeds, symbol);
  return match?.id ?? null;
}

async function getFeedIdsBySymbol(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedFeedIds && cachedFeedIds.expiresAt > now) {
    return cachedFeedIds.bySymbol;
  }

  const entries = await Promise.all(
    TRACKED_ASSETS.map(async (asset) => {
      const id = await discoverFeedId(asset.symbol, asset.assetType);
      return id ? [asset.symbol, id] : null;
    })
  );

  const bySymbol = Object.fromEntries(entries.filter(Boolean) as [string, string][]);
  cachedFeedIds = {
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
  const payload = await fetchWithRetry<{ parsed?: ParsedPrice[] }>(url);

  return new Map((payload.parsed ?? []).map((item) => [item.id ?? "", item]));
}

export async function getTrackedPriceFeeds(): Promise<PriceFeed[]> {
  const feedIdsBySymbol = await getFeedIdsBySymbol();
  const ids = Object.values(feedIdsBySymbol);
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

  for (const asset of TRACKED_ASSETS) {
    const id = feedIdsBySymbol[asset.symbol];
    if (!id) continue;

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
      price: Number(latest.price.toFixed(6)),
      confidence: Number(latest.confidence.toFixed(6)),
      change24h: Number(change24h.toFixed(2)),
      lastUpdated: new Date(latest.publishTime * 1000).toISOString(),
      priceHistory: buildSyntheticHistory(latest.price),
    });
  }

  return feeds;
}
