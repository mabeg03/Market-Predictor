import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AIMarketPredictor from "./AIMarketPredictor";
import Portfolio from "./Portfolio";
import Alerts from "./Alerts";
import PrivacyPolicy from "./PrivacyPolicy";

export default function App() {

  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "portfolio" | "alerts">("home");

  return (
    <Router>

      <Routes>

        {/* MAIN APP */}
        <Route
          path="/"
          element={
            <div style={styles.app}>

              {/* HEADER */}
              <header style={styles.header}>
                <div style={styles.logo}>TradeDeck</div>
              </header>

              {/* CONTENT */}
              <main style={styles.main}>

                {activeTab === "home" && (
                  <AIMarketPredictor externalSymbol={selectedSymbol} />
                )}

                {activeTab === "portfolio" && (
                  <Portfolio onSelect={(s) => {
                    setSelectedSymbol(s);
                    setActiveTab("home");
                  }} />
                )}

                {activeTab === "alerts" && (
                  <Alerts onSelect={(s) => {
                    setSelectedSymbol(s);
                    setActiveTab("home");
                  }} />
                )}

              </main>

              {/* BOTTOM NAV */}
              <div style={styles.nav}>

                <button
                  style={activeTab === "home" ? styles.active : styles.btn}
                  onClick={() => setActiveTab("home")}
                >
                  📊
                  <span>Home</span>
                </button>

                <button
                  style={activeTab === "portfolio" ? styles.active : styles.btn}
                  onClick={() => setActiveTab("portfolio")}
                >
                  📁
                  <span>Portfolio</span>
                </button>

                <button
                  style={activeTab === "alerts" ? styles.active : styles.btn}
                  onClick={() => setActiveTab("alerts")}
                >
                  🔔
                  <span>Alerts</span>
                </button>

              </div>

            </div>
          }
        />

        {/* PRIVACY POLICY */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      </Routes>

    </Router>
  );
}

/* STYLES */
const styles: any = {

  app: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "#020617",
    color: "#e5edf5",
  },

  header: {
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    background: "#020617",
    zIndex: 100,
  },

  logo: {
    fontSize: 18,
    fontWeight: 800,
    color: "#00d4ff",
  },

  main: {
    flex: 1,
    padding: 12,
    paddingBottom: 70,
  },

  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 60,
    background: "#020617",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    zIndex: 1000,
  },

  btn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: 12,
    cursor: "pointer",
  },

  active: {
    background: "transparent",
    border: "none",
    color: "#00d4ff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    transform: "scale(1.1)",
    cursor: "pointer",
  },

};