import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex h-full items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-sky-400/10 border border-sky-300/30 mb-6 sm:mb-8 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-sky-300 animate-pulse glow-cyan-sm" />
          <span className="text-xs sm:text-sm font-medium text-sky-200">
            ASSET TRACKING
          </span>
        </div>

        <div className="space-y-2 sm:space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 text-balance leading-tight">
            <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent animate-gradient">
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

        <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto text-balance px-4">
          Real-time asset monitoring with advanced analytics for DeFi protocols
          and blockchain infrastructure.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
          <Link href="/price-feeds" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto inline-flex items-center justify-center gap-2" size="lg">
              Get started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/about" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
              size="lg"
            >
              Learn more
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
