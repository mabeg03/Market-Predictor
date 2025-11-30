import React, { useEffect, useRef } from "react";
import { mapToTradingView } from "./tvSymbolMap";

export default function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbol || !containerRef.current) return;

    containerRef.current.innerHTML = ""; // Clear old widget

    const tvSymbol = mapToTradingView(symbol);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      new TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        container_id: `tv_${symbol}`,
      });
    };

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      id={`tv_${symbol}`}
      ref={containerRef}
      style={{ width: "100%", height: "450px", borderRadius: "12px" }}
    />
  );
}
