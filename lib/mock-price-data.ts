export interface PriceFeed {
  id: string;
  symbol: string;
  name: string;
  price: number;
  confidence: number;
  change24h: number;
  priceHistory: { time: string; price: number }[];
}

export const mockPriceFeeds: PriceFeed[] = [
  {
    id: "btc-usd",
    symbol: "BTC/USD",
    name: "Bitcoin",
    price: 43250.5,
    confidence: 12.5,
    change24h: 2.34,
    priceHistory: generatePriceHistory(43250.5, 24),
  },
  {
    id: "eth-usd",
    symbol: "ETH/USD",
    name: "Ethereum",
    price: 2245.75,
    confidence: 8.25,
    change24h: -1.23,
    priceHistory: generatePriceHistory(2245.75, 24),
  },
  {
    id: "sol-usd",
    symbol: "SOL/USD",
    name: "Solana",
    price: 98.42,
    confidence: 2.15,
    change24h: 5.67,
    priceHistory: generatePriceHistory(98.42, 24),
  },
  {
    id: "avax-usd",
    symbol: "AVAX/USD",
    name: "Avalanche",
    price: 35.89,
    confidence: 1.05,
    change24h: -3.45,
    priceHistory: generatePriceHistory(35.89, 24),
  },
  {
    id: "matic-usd",
    symbol: "MATIC/USD",
    name: "Polygon",
    price: 0.8234,
    confidence: 0.0125,
    change24h: 1.89,
    priceHistory: generatePriceHistory(0.8234, 24),
  },
  {
    id: "atom-usd",
    symbol: "ATOM/USD",
    name: "Cosmos",
    price: 9.87,
    confidence: 0.34,
    change24h: -0.56,
    priceHistory: generatePriceHistory(9.87, 24),
  },
  {
    id: "dot-usd",
    symbol: "DOT/USD",
    name: "Polkadot",
    price: 6.45,
    confidence: 0.22,
    change24h: 3.21,
    priceHistory: generatePriceHistory(6.45, 24),
  },
  {
    id: "link-usd",
    symbol: "LINK/USD",
    name: "Chainlink",
    price: 14.56,
    confidence: 0.45,
    change24h: 2.11,
    priceHistory: generatePriceHistory(14.56, 24),
  },
];

function generatePriceHistory(currentPrice: number, hours: number) {
  const history = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const variance = (Math.random() - 0.5) * 0.05; // ±5% variance
    const price = currentPrice * (1 + variance);

    history.push({
      time: time.toISOString(),
      price: Number.parseFloat(price.toFixed(2)),
    });
  }

  return history;
}

export const dataProviders = [
  "Coinbase",
  "Binance",
  "Jane Street",
  "Cboe",
  "LMAX",
  "Circle",
  "OKX",
  "Susquehanna",
  "Two Sigma",
  "Virtu Financial",
  "Jupiter",
  "Kraken",
  "Bitstamp",
  "Gemini",
];
