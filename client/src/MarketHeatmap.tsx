import React, { useEffect, useRef } from "react";

export default function MarketHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      exchanges: ["NSE", "BSE", "NASDAQ", "NYSE"],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "en",
      symbolUrl: "",
      colorTheme: "dark",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: "100%",
      height: "500"
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ color: "#9be7ff" }}>Market Heatmap</h3>
      <div ref={containerRef}></div>
    </div>
  );
}
