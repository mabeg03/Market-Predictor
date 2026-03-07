import React from "react";

export default function Sidebar({ watchlist }) {
  return (
    <div
      style={{
        width: "260px",
        background: "#07121c",
        color: "white",
        height: "100vh",
        padding: "20px",
        borderRight: "1px solid #0f2a3a"
      }}
    >
      <h2 style={{ color: "#23c6e6", marginBottom: 20 }}>Watchlist</h2>

      {watchlist.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No symbols added</p>
      ) : (
        watchlist.map((symbol, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              borderBottom: "1px solid #0f2a3a",
              cursor: "pointer"
            }}
          >
            {symbol}
          </div>
        ))
      )}
    </div>
  );
}
