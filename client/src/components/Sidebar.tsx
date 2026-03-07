import React from "react";

export default function Sidebar({
  watchlist,
  symbol,
  setSymbol,
  handlePredict,
  sidebarOpen
}: any) {

  return (

    <div
      style={{
        width: 260,
        background: "#07121c",
        borderRight: "1px solid #0f2a3a",
        padding: 20,
        color: "white",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: sidebarOpen ? 0 : -260,
        transition: "0.3s",
        zIndex: 1000
      }}
    >

      <h2 style={{ color: "#00d4ff" }}>TradeDeck</h2>

      {/* ADD SYMBOL */}

      <div style={{ display: "flex", gap: 6, marginTop: 20 }}>

        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Add symbol"
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #00d4ff",
            background: "#041c24",
            color: "#9be7ff"
          }}
        />

        <button
          onClick={handlePredict}
          style={{
            background: "#00d4ff",
            border: "none",
            padding: "8px 10px",
            borderRadius: 6,
            fontWeight: "bold"
          }}
        >
          +
        </button>

      </div>

      {/* WATCHLIST */}

      <h4 style={{ marginTop: 25 }}>Watchlist</h4>

      {watchlist.length === 0 && (
        <p style={{ opacity: 0.6 }}>No symbols added</p>
      )}

      {watchlist.map((s: string, i: number) => (

        <div
          key={i}
          style={{
            padding: "8px 0",
            borderBottom: "1px solid #0f2a3a"
          }}
        >
          {s}
        </div>

      ))}

    </div>

  );

}
