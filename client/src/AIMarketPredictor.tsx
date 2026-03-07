import React, { useState } from "react";
import Sidebar from "./components/Sidebar";

const API_BASE = "https://tradedeck-ltby.onrender.com";

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

      if (!watchlist.includes(sym)) {
        setWatchlist([...watchlist, sym]);
      }

      const quoteRes = await fetch(
        `${API_BASE}/api/quote/${encodeURIComponent(sym)}`
      );

      if (!quoteRes.ok) throw new Error("Quote API failed");

      const quoteData = await quoteRes.json();

      setQuote(quoteData);

      const predRes = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ symbol: sym })
      });

      const predData = await predRes.json();

      setPrediction(predData);

      setLoading(false);

    } catch (e: any) {

      setError(e.message);
      setLoading(false);

    }

  }

  function fmt(v: any) {

    if (!v) return "—";

    return Number(v).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });

  }

  return (

    <div style={{ display: "flex" }}>

      {/* MOBILE MENU BUTTON */}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          background: "#00d4ff",
          border: "none",
          padding: 10,
          borderRadius: 6,
          cursor: "pointer",
          zIndex: 1100
        }}
      >
        ☰
      </button>

      {/* SIDEBAR */}

      <Sidebar
        watchlist={watchlist}
        symbol={symbol}
        setSymbol={setSymbol}
        handlePredict={handlePredict}
        sidebarOpen={sidebarOpen}
      />

      {/* MAIN CONTENT */}

      <div
        style={{
          flex: 1,
          minHeight: "100vh",
          background: "#020c12",
          color: "#e6eef6",
          padding: 40,
          marginLeft: 260,
          fontFamily: "Arial"
        }}
      >

        <h1>AI Market Predictor</h1>

        {error && (
          <div style={{ color: "#ff5252", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* QUOTE */}

        {quote && (

          <div style={{ marginBottom: 30 }}>

            <h2>{quote.symbol}</h2>

            <div style={{ fontSize: 32 }}>
              ₹{fmt(quote.current)}
            </div>

            <div style={{ color: quote.change >= 0 ? "#00e676" : "#ff5252" }}>
              {fmt(quote.change)}
            </div>

          </div>

        )}

        {/* AI PREDICTION */}

        {prediction && (

          <div style={{ marginTop: 30 }}>

            <h2>AI Prediction</h2>

            <div style={{ marginTop: 10 }}>
              <b>Trend:</b> {prediction.trend || "—"}
            </div>

            <div style={{ marginTop: 6 }}>
              <b>Signal:</b> {prediction.signal || "—"}
            </div>

            <div style={{ marginTop: 6 }}>
              <b>Confidence:</b> {prediction.confidence || "—"}
            </div>

            <div style={{ marginTop: 10 }}>
              <b>Advice:</b> {prediction.advice || "—"}
            </div>

          </div>

        )}

      </div>

    </div>

  );

}
