"use client";

import { useEffect, useMemo } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

const SCRIPT_ID = "tradingview-widget-script";
const SCRIPT_SRC = "https://s3.tradingview.com/tv.js";

function toTradingViewSymbol(symbol: string): string {
  return `PYTH:${symbol.replace("/", "")}`;
}

export function TradingViewChart({
  symbol,
}: {
  symbol: string;
}) {
  const containerId = useMemo(
    () => `tv-chart-${symbol.replace("/", "-").toLowerCase()}`,
    [symbol]
  );

  useEffect(() => {
    const initWidget = () => {
      if (!window.TradingView) return;

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }

      // TradingView widget configuration from Pyth docs.
      new window.TradingView.widget({
        autosize: true,
        symbol: toTradingViewSymbol(symbol),
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        container_id: containerId,
      });
    };

    const existingScript = document.getElementById(SCRIPT_ID) as
      | HTMLScriptElement
      | null;

    if (window.TradingView) {
      initWidget();
      return;
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = initWidget;
      document.body.appendChild(script);
      return;
    }

    existingScript.addEventListener("load", initWidget);
    return () => existingScript.removeEventListener("load", initWidget);
  }, [containerId, symbol]);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
      <div id={containerId} className="h-[340px] w-full" />
    </div>
  );
}
