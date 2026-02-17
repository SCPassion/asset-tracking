import { NextResponse } from "next/server";

import { getTrackedPriceFeeds, type TrackedAssetType } from "@/lib/pyth-offchain";

export const revalidate = 30;
export const dynamic = "force-dynamic";

function normalizeType(value: string | null): TrackedAssetType {
  if (value === "equity" || value === "fx" || value === "crypto") {
    return value;
  }
  return "crypto";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = normalizeType(url.searchParams.get("type"));
    const feeds = await getTrackedPriceFeeds(type);
    return NextResponse.json({ feeds, source: "pyth-hermes-v2", type });
  } catch (error) {
    console.error("Failed to fetch Pyth off-chain data", error);
    return NextResponse.json(
      { feeds: [], error: "Failed to fetch Pyth feed data" },
      { status: 502 }
    );
  }
}
