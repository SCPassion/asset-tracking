import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-3 sm:space-y-4 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent">
            About Track Any
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
            A simple way to follow crypto, equities, and FX in real time
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="glass border-white/10">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">
                What This Site Is For
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-muted-foreground p-4 sm:p-6 pt-0">
              <p className="text-sm sm:text-base">
                Track Any is built to help you scan markets quickly and dig
                deeper when something moves. You get a clean live view on
                desktop and a responsive layout on mobile.
              </p>
              <p className="text-sm sm:text-base">
                You can search feeds directly from the top input, star the ones
                you care about, and keep Crypto, Equity, and FX side by side in
                one place.
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">
                What You’re Looking At
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                  Aggregated Price
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  The current market price calculated by aggregating data from
                  multiple trusted sources. This ensures accuracy and reduces
                  the impact of any single data provider.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                  Confidence Interval
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Represents the uncertainty in the aggregated price. A smaller
                  confidence interval indicates higher agreement among data
                  providers and more reliable pricing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                  24-Hour Change
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  The percentage change in price over the last 24 hours, helping
                  you track market trends and volatility.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">
                Where the Data Comes From
              </CardTitle>
              <CardDescription className="mt-1 text-sm sm:text-base">
                The feed service behind the numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <p className="text-muted-foreground text-sm sm:text-base">
                This site uses Pyth off-chain APIs (Hermes and Benchmarks) for
                live prices and history. The 24-hour change is calculated on the
                server by comparing the latest price with the day-ago price.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base">
                Pyth Network sources data from leading exchanges, trading firms,
                and market makers including Coinbase, Binance, Jane Street,
                Cboe, LMAX, Circle, OKX, Susquehanna, Two Sigma, Virtu
                Financial, Jupiter, and many more. This diverse network ensures
                robust and reliable price feeds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
