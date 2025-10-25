import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            About Pyth Price Feeds
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time, high-fidelity market data powered by Pyth Network
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Card className="bg-card/30 border-border/40">
            <CardHeader>
              <CardTitle>What is Pyth Network?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Pyth Network is a decentralized oracle network that delivers
                real-time market data to blockchain applications. It aggregates
                price feeds from over 90 first-party data providers, including
                major exchanges, market makers, and financial institutions.
              </p>
              <p>
                This price feed tracker provides a user-friendly interface to
                monitor Pyth's off-chain oracle data, including aggregated
                prices, confidence intervals, and 24-hour price changes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/40">
            <CardHeader>
              <CardTitle>Understanding the Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Aggregated Price
                </h3>
                <p className="text-muted-foreground">
                  The current market price calculated by aggregating data from
                  multiple trusted sources. This ensures accuracy and reduces
                  the impact of any single data provider.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Confidence Interval
                </h3>
                <p className="text-muted-foreground">
                  Represents the uncertainty in the aggregated price. A smaller
                  confidence interval indicates higher agreement among data
                  providers and more reliable pricing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  24-Hour Change
                </h3>
                <p className="text-muted-foreground">
                  The percentage change in price over the last 24 hours, helping
                  you track market trends and volatility.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/40">
            <CardHeader>
              <CardTitle>Data Providers</CardTitle>
              <CardDescription>
                Trusted institutions powering Pyth Network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
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
