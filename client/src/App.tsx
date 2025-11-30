import React, { useState } from "react";
import AIMarketPredictor from "./AIMarketPredictor";
import Watchlist from "./Watchlist";
import Portfolio from "./Portfolio";
import Alerts from "./Alerts";
import "./animations.css";

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [activeTab, setActiveTab] = useState<"predictor" | "portfolio" | "alerts">("predictor");

  return (
    <div style={ui.page}>
      {/* HEADER */}
      <header style={ui.header}>
        <div style={ui.logo}>TradeDeck</div>
      </header>

      {/* GRID LAYOUT */}
      <main style={ui.grid}>
        
        {/* LEFT SIDEBAR */}
        <aside style={ui.left} className="slide-in-left fade-in">
          <Watchlist onSelect={(s) => setSelectedSymbol(s)} />
        </aside>

        {/* CENTER CONTENT WITH TABS */}
        <section style={ui.center} className="fade-in">
          
          {/* TABS */}
          <div style={ui.tabs}>
            <div
              style={activeTab === "predictor" ? ui.tabActive : ui.tab}
              onClick={() => setActiveTab("predictor")}
            >
              Predictor
            </div>
            <div
              style={activeTab === "portfolio" ? ui.tabActive : ui.tab}
              onClick={() => setActiveTab("portfolio")}
            >
              Portfolio
            </div>
            <div
              style={activeTab === "alerts" ? ui.tabActive : ui.tab}
              onClick={() => setActiveTab("alerts")}
            >
              Alerts
            </div>
          </div>

          {/* TAB CONTENT */}
          <div style={ui.tabContent}>
            {activeTab === "predictor" && (
              <div className="scale-in">
                <AIMarketPredictor externalSymbol={selectedSymbol} />
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="scale-in">
                <Portfolio onSelect={(s) => setSelectedSymbol(s)} />
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="scale-in">
                <Alerts onSelect={(s) => setSelectedSymbol(s)} />
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

/* ---------------- UI Styles ---------------- */

const ui: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#071018",
    color: "white",
    fontFamily: "Inter, sans-serif",
    overflow: "hidden",
  },

  header: {
    height: 60,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  logo: { fontWeight: 900, fontSize: 20, color: "#00d4ff" },

  grid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 20,
    padding: 20,
  },

  left: {
    overflowY: "auto",
    maxHeight: "calc(100vh - 90px)",
  },

  center: {
    overflowY: "auto",
    maxHeight: "calc(100vh - 90px)",
    paddingRight: 10,
  },

  /* TABS */
  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 15,
  },

  tab: {
    padding: "10px 18px",
    cursor: "pointer",
    borderRadius: 8,
    background: "#0b2233",
    color: "#9bc7ff",
    fontWeight: 700,
    transition: "0.25s",
  },

  tabActive: {
    padding: "10px 18px",
    cursor: "pointer",
    borderRadius: 8,
    background: "#00d4ff",
    color: "#04161f",
    fontWeight: 800,
    boxShadow: "0 0 12px rgba(0,212,255,0.35)",
  },

  tabContent: {
    marginTop: 10,
  },
};
