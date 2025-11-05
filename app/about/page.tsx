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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
            About Pyth Price Feeds
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
            Real-time, high-fidelity market data powered by Pyth Network
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="glass border-white/10">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                What is Pyth Network?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-muted-foreground p-4 sm:p-6 pt-0">
              <p className="text-sm sm:text-base">
                Pyth Network is a decentralized oracle network that delivers
                real-time market data to blockchain applications. It aggregates
                price feeds from over 90 first-party data providers, including
                major exchanges, market makers, and financial institutions.
              </p>
              <p className="text-sm sm:text-base">
                This price feed tracker provides a user-friendly interface to
                monitor Pyth's off-chain oracle data, including aggregated
                prices, confidence intervals, and 24-hour price changes.
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Understanding the Data
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Data Providers
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Trusted institutions powering Pyth Network
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
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
