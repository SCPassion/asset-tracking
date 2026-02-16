import { NextResponse } from "next/server";

import { getTrackedPriceFeeds } from "@/lib/pyth-offchain";

export const revalidate = 30;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const feeds = await getTrackedPriceFeeds();
    return NextResponse.json({ feeds, source: "pyth-hermes-v2" });
  } catch (error) {
    console.error("Failed to fetch Pyth off-chain data", error);
    return NextResponse.json(
      { feeds: [], error: "Failed to fetch Pyth feed data" },
      { status: 502 }
    );
  }
}
