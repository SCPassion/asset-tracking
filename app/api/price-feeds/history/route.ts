import { NextRequest, NextResponse } from "next/server";

const BENCHMARKS_BASE = "https://benchmarks.pyth.network";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

type Interval = "24h" | "7d" | "1m" | "1y";

function intervalConfig(interval: Interval, now: number) {
  if (interval === "7d") {
    return { from: now - 7 * 24 * 60 * 60, resolution: "60" };
  }
  if (interval === "1m") {
    return { from: now - 30 * 24 * 60 * 60, resolution: "240" };
  }
  if (interval === "1y") {
    return { from: now - 365 * 24 * 60 * 60, resolution: "D" };
  }
  return { from: now - 24 * 60 * 60, resolution: "15" };
}

function normalizeSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  if (trimmed.includes(".") && trimmed.includes("/")) {
    return trimmed;
  }

  const primary = trimmed.split(" ")[0] ?? trimmed;
  if (primary.includes("/")) {
    return `Crypto.${primary.toUpperCase()}`;
  }

  const normalized = primary.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `Crypto.${normalized}/USD`;
}

async function fetchWithRetry(url: string): Promise<Response> {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) return response;

    const retry = RETRYABLE_STATUSES.has(response.status);
    if (!retry || attempt === maxAttempts) return response;

    const delay = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Unexpected retry flow");
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchHistoryPoints(symbol: string, interval: Interval) {
  const now = Math.floor(Date.now() / 1000);
  const { from, resolution } = intervalConfig(interval, now);
  const tvSymbol = normalizeSymbol(symbol);

  const params = new URLSearchParams({
    symbol: tvSymbol,
    resolution,
    from: String(from),
    to: String(now),
  });

  const url = `${BENCHMARKS_BASE}/v1/shims/tradingview/history?${params.toString()}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to fetch history (${response.status}): ${details}`);
  }

  const payload = (await response.json()) as { t?: number[]; c?: number[] };
  const times = Array.isArray(payload.t) ? payload.t : [];
  const closes = Array.isArray(payload.c) ? payload.c : [];

  return times
    .map((ts, index) => {
      const price = closes[index];
      if (typeof price !== "number") return null;
      return { ts, time: new Date(ts * 1000).toISOString(), price };
    })
    .filter(Boolean) as { ts: number; time: string; price: number }[];
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const denominatorSymbol =
    request.nextUrl.searchParams.get("denominator_symbol") ?? "";
  const intervalParam = request.nextUrl.searchParams.get("interval") ?? "24h";
  const interval: Interval =
    intervalParam === "24h" ||
    intervalParam === "7d" ||
    intervalParam === "1m" ||
    intervalParam === "1y"
      ? intervalParam
      : "24h";

  if (!symbol) {
    return NextResponse.json(
      { points: [], error: "Missing symbol query parameter" },
      { status: 400 }
    );
  }

  try {
    const basePoints = await fetchHistoryPoints(symbol, interval);

    if (!denominatorSymbol) {
      return NextResponse.json({
        points: basePoints.map((point) => ({ time: point.time, price: point.price })),
      });
    }

    const denomPoints = await fetchHistoryPoints(denominatorSymbol, interval);
    const denomByTs = new Map(denomPoints.map((point) => [point.ts, point.price]));

    const ratioPoints = basePoints
      .map((point) => {
        const denominator = denomByTs.get(point.ts);
        if (!denominator || denominator === 0) return null;
        return { time: point.time, price: point.price / denominator };
      })
      .filter(Boolean);

    return NextResponse.json({ points: ratioPoints });
  } catch (error) {
    return NextResponse.json(
      {
        points: [],
        error: "Failed to fetch history data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
