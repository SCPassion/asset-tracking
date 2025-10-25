import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex items-center justify-center px-4 py-20 min-h-full">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-sm font-medium text-purple-400">
            ASSET TRACKING
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-balance">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Track Any
            </span>
            <br />
            <span className="text-white">Asset,</span>
            <br />
            <span className="text-white">Anywhere,</span>
            <br />
            <span className="text-white">Anytime.</span>
          </h1>
        </div>

        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto text-balance">
          Real-time asset monitoring with advanced analytics for DeFi protocols
          and blockchain infrastructure.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/price-feeds">
            <Button
              variant="purple"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="white"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
            >
              Learn more
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
