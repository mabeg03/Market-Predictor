import React, { useEffect, useRef } from "react";

const loadLib = () =>
  new Promise<any>((resolve) => {
    if (window.LightweightCharts) return resolve(window.LightweightCharts);

    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js";
    script.async = true;
    script.onload = () => resolve(window.LightweightCharts);
    document.body.appendChild(script);
  });

export default function CandleChart({ data }: { data: any[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chart = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    loadLib().then((LW) => {
      if (!mounted || !ref.current) return;

      const c = LW.createChart(ref.current, {
        width: ref.current.clientWidth,
        height: 330,
        layout: {
          background: { color: "#04121a" },
          textColor: "#9be7ff",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.05)" },
          horzLines: { color: "rgba(255,255,255,0.05)" },
        },
      });

      chart.current = c;

      const candles = c.addCandlestickSeries({
        upColor: "#26a69a",
        downColor: "#ef5350",
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        borderVisible: false,
      });

      candles.setData(data);
    });

    return () => {
      mounted = false;
      if (chart.current) chart.current.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: 330,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    ></div>
  );
}
