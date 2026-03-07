import React from "react";

type SidebarProps = {
  watchlist: string[];
  symbol: string;
  setSymbol: (s: string) => void;
  handlePredict: () => void;
  sidebarOpen: boolean;
};

export default function Sidebar({
  watchlist,
  symbol,
  setSymbol,
  handlePredict,
  sidebarOpen
}: SidebarProps) {

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

      {/* LOGO */}

      <h2 style={{ color: "#00d4ff", marginBottom: 10 }}>
        TradeDeck
      </h2>

      {/* SEARCH STOCK */}

      <div style={{ marginTop: 20 }}>

        <p style={{
          fontSize: 12,
          opacity: 0.7,
          marginBottom: 6
        }}>
          Search Stock
        </p>

        <div style={{ display: "flex", gap: 6 }}>

          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="RELIANCE, AAPL..."
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #00d4ff",
              background: "#041c24",
              color: "#9be7ff",
              outline: "none"
            }}
          />

          <button
            onClick={handlePredict}
            style={{
              background: "#00d4ff",
              border: "none",
              padding: "8px 10px",
              borderRadius: 6,
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            +
          </button>

        </div>

      </div>

      {/* WATCHLIST */}

      <h4 style={{ marginTop: 30 }}>Watchlist</h4>

      {watchlist.length === 0 && (
        <p style={{ opacity: 0.6 }}>
          No symbols added
        </p>
      )}

      {watchlist.map((s, i) => (

        <div
          key={i}
          onClick={() => {
            setSymbol(s);
            handlePredict();
          }}
          style={{
            padding: "8px 0",
            borderBottom: "1px solid #0f2a3a",
            cursor: "pointer"
          }}
        >
          {s}
        </div>

      ))}

    </div>

  );

}
