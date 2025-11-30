import React, { useState } from "react";
import AIMarketPredictor from "./AIMarketPredictor";
import Watchlist from "./Watchlist";
import Portfolio from "./Portfolio";
import Alerts from "./Alerts";

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState("");

  return (
    <div style={ui.page}>
      <header style={ui.header}>
        <div style={ui.logo}>TradeDeck</div>
      </header>

      <main style={ui.container}>
        <aside style={ui.left}>
          <Watchlist onSelect={(s) => setSelectedSymbol(s)} />
        </aside>

        <section style={ui.center}>
          <h2 style={{ marginTop: 0 }}>Market</h2>
          <AIMarketPredictor externalSymbol={selectedSymbol} />
        </section>

        <aside style={ui.right}>
          <Portfolio onSelect={(s) => setSelectedSymbol(s)} />
          <div style={{ height: 12 }} />
          <Alerts onSelect={(s) => setSelectedSymbol(s)} />
        </aside>
      </main>
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#071018 0%, #0b1b24 100%)",
    color: "#e6eef6",
    fontFamily: "Inter, sans-serif",
  },
  header: {
    height: 64,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  logo: { color: "#9be7ff", fontWeight: 900, fontSize: 20 },
  container: {
    display: "grid",
    gridTemplateColumns: "280px 1fr 360px",
    gap: 20,
    padding: 24,
    alignItems: "start",
  },
  left: {},
  center: {},
  right: { display: "flex", flexDirection: "column", gap: 12 },
};
