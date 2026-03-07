import React, { useState } from "react";
import Sidebar from "./components/Sidebar";

const API_BASE = "https://tradedeck-ltby.onrender.com";

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#020c12",
    fontFamily: "'Courier New', monospace",
    position: "relative",
  },
  main: {
    flex: 1,
    color: "#e6eef6",
    padding: "24px 20px",
    boxSizing: "border-box" as const,
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden" as const,
  },
  header: {
    fontSize: "clamp(20px, 5vw, 32px)",
    fontWeight: "bold",
    marginBottom: 24,
    color: "#00d4ff",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #00d4ff33",
    paddingBottom: 12,
  },
  searchRow: {
    display: "flex",
    gap: 10,
    marginBottom: 24,
    flexWrap: "wrap" as const,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "10px 14px",
    borderRadius: 6,
    border: "1px solid #00d4ff",
    background: "#041c24",
    color: "#9be7ff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  button: {
    padding: "10px 22px",
    border: "none",
    borderRadius: 6,
    background: "#00d4ff",
    color: "#020c12",
    fontWeight: "bold",
    fontSize: 15,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  error: {
    color: "#ff5252",
    marginBottom: 16,
    padding: "10px 14px",
    background: "#ff525210",
    borderRadius: 6,
    border: "1px solid #ff525244",
    fontSize: 14,
  },
  card: {
    background: "#041c24",
    border: "1px solid #00d4ff22",
    borderRadius: 10,
    padding: "20px",
    marginBottom: 20,
  },
  quoteSymbol: {
    fontSize: "clamp(16px, 4vw, 22px)",
    fontWeight: "bold",
    color: "#9be7ff",
    marginBottom: 8,
  },
  quotePrice: {
    fontSize: "clamp(26px, 8vw, 42px)",
    fontWeight: "bold",
    color: "#e6eef6",
    lineHeight: 1.1,
  },
  quoteChange: {
    fontSize: "clamp(14px, 3.5vw, 18px)",
    marginTop: 6,
    fontWeight: 600,
  },
  predTitle: {
    fontSize: "clamp(15px, 4vw, 20px)",
    fontWeight: "bold",
    color: "#00d4ff",
    marginBottom: 14,
  },
  predGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  predItem: {
    background: "#020c12",
    borderRadius: 8,
    padding: "12px 14px",
    border: "1px solid #00d4ff18",
  },
  predLabel: {
    fontSize: 11,
    color: "#9be7ff99",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: 4,
  },
  predValue: {
    fontSize: "clamp(13px, 3vw, 16px)",
    color: "#e6eef6",
    fontWeight: 600,
  },
  adviceBox: {
    background: "#00d4ff10",
    border: "1px solid #00d4ff33",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: "clamp(13px, 3.5vw, 15px)",
    color: "#9be7ff",
    lineHeight: 1.6,
  },

  /* Mobile hamburger overlay */
  mobileMenuBtn: {
    display: "none",
    position: "fixed" as const,
    top: 16,
    left: 16,
    zIndex: 200,
    background: "#00d4ff",
    border: "none",
    borderRadius: 6,
    width: 40,
    height: 40,
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#020c12",
    fontWeight: "bold",
  },
};

export default function AIMarketPredictor() {
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handlePredict() {
    if (!symbol) return;
    try {
      setError("");
      setLoading(true);
      const sym = symbol.trim().toUpperCase();
      if (!watchlist.includes(sym)) setWatchlist([...watchlist, sym]);

      const quoteRes = await fetch(`${API_BASE}/api/quote/${encodeURIComponent(sym)}`);
      if (!quoteRes.ok) throw new Error("Quote API failed");
      const quoteData = await quoteRes.json();
      setQuote(quoteData);

      const predRes = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      const predData = await predRes.json();
      setPrediction(predData);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handlePredict();
  }

  function fmt(v: any) {
    if (v === undefined || v === null || v === "") return "—";
    return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return (
    <>
      {/* Inject responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .ai-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            z-index: 150 !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .ai-sidebar.open {
            transform: translateX(0) !important;
          }
          .ai-sidebar-overlay {
            display: block !important;
          }
          .ai-mobile-btn {
            display: flex !important;
          }
          .ai-main {
            padding-top: 64px !important;
          }
        }
        .ai-sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: #00000088;
          z-index: 140;
        }
        .ai-predict-btn:active {
          opacity: 0.85;
          transform: scale(0.97);
        }
      `}</style>

      <div style={styles.root}>

        {/* Mobile hamburger */}
        <button
          className="ai-mobile-btn"
          style={styles.mobileMenuBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>

        {/* Sidebar overlay (mobile tap-to-close) */}
        {sidebarOpen && (
          <div
            className="ai-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — pass className for CSS targeting */}
        <div className={`ai-sidebar${sidebarOpen ? " open" : ""}`}>
          <Sidebar watchlist={watchlist} />
        </div>

        {/* Main */}
        <main className="ai-main" style={styles.main}>
          <h1 style={styles.header}>AI Market Predictor</h1>

          {/* Search bar */}
          <div style={styles.searchRow}>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="RELIANCE, TCS, BTC-USD…"
              style={styles.input}
            />
            <button
              className="ai-predict-btn"
              onClick={handlePredict}
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Loading…" : "Predict"}
            </button>
          </div>

          {error && <div style={styles.error}>⚠ {error}</div>}

          {/* Quote card */}
          {quote && (
            <div style={styles.card}>
              <div style={styles.quoteSymbol}>{quote.symbol}</div>
              <div style={styles.quotePrice}>₹{fmt(quote.current)}</div>
              <div
                style={{
                  ...styles.quoteChange,
                  color: quote.change >= 0 ? "#00e676" : "#ff5252",
                }}
              >
                {quote.change >= 0 ? "▲" : "▼"} {fmt(Math.abs(quote.change))}
              </div>
            </div>
          )}

          {/* Prediction card */}
          {prediction && (
            <div style={styles.card}>
              <div style={styles.predTitle}>AI Prediction</div>

              <div style={styles.predGrid}>
                <div style={styles.predItem}>
                  <div style={styles.predLabel}>Trend</div>
                  <div style={styles.predValue}>{prediction.trend || "—"}</div>
                </div>
                <div style={styles.predItem}>
                  <div style={styles.predLabel}>Signal</div>
                  <div style={styles.predValue}>{prediction.signal || "—"}</div>
                </div>
                <div style={styles.predItem}>
                  <div style={styles.predLabel}>Confidence</div>
                  <div style={styles.predValue}>{prediction.confidence || "—"}</div>
                </div>
              </div>

              {prediction.advice && (
                <div style={styles.adviceBox}>
                  <strong style={{ color: "#00d4ff", fontSize: 12, letterSpacing: "0.08em" }}>
                    ADVICE
                  </strong>
                  <div style={{ marginTop: 6 }}>{prediction.advice}</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
