"use client"

export function DataProviderFooter() {
  const providers = [
    "Coinbase",
    "Binance",
    "Jane Street",
    "Cboe",
    "LMAX",
    "Circle",
    "OKX",
    "Susquehanna",
    "Two Sigma",
    "Virtu Financial",
    "Jupiter",
    "Coinbase",
    "Binance",
    "Jane Street",
    "Cboe",
    "LMAX",
  ]

  return (
    <div className="border-t border-white/5 bg-black/20 py-6 overflow-hidden">
      <div className="flex animate-scroll">
        {providers.map((provider, index) => (
          <div key={index} className="flex-shrink-0 px-8 text-gray-500 font-medium whitespace-nowrap">
            {provider}
          </div>
        ))}
      </div>
    </div>
  )
}
