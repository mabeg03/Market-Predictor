import React, { useState } from "react";

export default function WatchlistTab() {
  const [watchlist] = useState(["AAPL", "RELIANCE", "BTC", "USD/INR"]);

  return (
    <div>
      <h3>Your Watchlist</h3>
      {watchlist.map((item, i) => (
        <div
          key={i}
          style={{
            padding: 12,
            borderRadius: 10,
            background: "#f1f5f9",
            marginBottom: 8,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
