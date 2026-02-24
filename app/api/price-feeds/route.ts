import { NextResponse } from "next/server";

import { getTrackedPriceFeeds, type TrackedAssetType } from "@/lib/pyth-offchain";

export const revalidate = 0;
export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
};

function normalizeType(value: string | null): TrackedAssetType {
  if (
    value === "equity" ||
    value === "fx" ||
    value === "crypto" ||
    value === "crypto-redemption-rate"
  ) {
    return value;
  }
  return "crypto";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = normalizeType(url.searchParams.get("type"));
    const feeds = await getTrackedPriceFeeds(type);
    return NextResponse.json(
      { feeds, source: "pyth-hermes-v2", type },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Failed to fetch Pyth off-chain data", error);
    return NextResponse.json(
      { feeds: [], error: "Failed to fetch Pyth feed data" },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }
}
