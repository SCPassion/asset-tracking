export interface PriceHistoryPoint {
  time: string;
  price: number;
}

export interface PriceFeed {
  id: string;
  symbol: string;
  name: string;
  price: number;
  confidence: number;
  change24h: number;
  lastUpdated: string;
  priceHistory: PriceHistoryPoint[];
}
