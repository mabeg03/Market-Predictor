import React, { useState } from "react";
import Sidebar from "./components/Sidebar";

const API_BASE = "https://tradedeck-ltby.onrender.com";

export default function AIMarketPredictor() {

  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePredict() {

    if (!symbol) return;

    try {

      setError("");
      setLoading(true);

      const sym = symbol.trim().toUpperCase();

      /* --------------------
         FETCH QUOTE
      -------------------- */

      const quoteRes = await fetch(
        `${API_BASE}/api/quote/${encodeURIComponent(sym)}`
      );

      if (!quoteRes.ok) throw new Error("Quote API failed");

      const quoteData = await quoteRes.json();

      setQuote(quoteData);

      /* --------------------
         FETCH PREDICTION
      -------------------- */

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

    <div
      style={{
        minHeight: "100vh",
        background: "#020c12",
        color: "#e6eef6",
        padding: 40,
        fontFamily: "Arial"
      }}
    >

      <h1>AI Market Predictor</h1>

      {/* SEARCH */}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>

        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="RELIANCE, TCS, BTC-USD"
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid #00d4ff",
            background: "#041c24",
            color: "#9be7ff"
          }}
        />

        <button
          onClick={handlePredict}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 6,
            background: "#00d4ff",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {loading ? "Loading..." : "Predict"}
        </button>

      </div>

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

  );

}
