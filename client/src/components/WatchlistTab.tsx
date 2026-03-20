import React, { useState } from "react";

export default function WatchlistTab() {
  const [watchlist] = useState(["BTC", "ETH", "AAPL"]);

  return (
    <div>
      <h3>🔥 Watchlist</h3>

      <div
        style={{
          maxHeight: "250px",
          overflowY: "auto",
          paddingRight: "6px",
        }}
      >
        {watchlist.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 8px",
              borderBottom: "1px solid #1f2937",
              color: "#e5e7eb",
            }}
          >
            <span>{item}</span>
            <span style={{ color: i % 2 === 0 ? "#22c55e" : "#ef4444" }}>
              {i % 2 === 0 ? "+2.3%" : "-1.2%"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}