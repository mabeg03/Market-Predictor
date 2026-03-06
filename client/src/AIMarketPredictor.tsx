import React, { useState, useEffect } from "react";
import MarketHeatmap from "./MarketHeatmap";
import Sparkline from "./Sparkline";
import CandleChart from "./CandleChart";
import TradingDashboard from "./TradingDashboard";

const API_BASE = "https://tradedeck-ltby.onrender.com";

import { searchSymbol } from "./symbolDatabase";
import { findBestSymbol, detectExchangeFromInput } from "./symbolFixer";

type Quote = any;
type Prediction = any;

export default function AIMarketPredictor({ externalSymbol = "" }: { externalSymbol?: string }) {

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [ohlc, setOhlc] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoFixNotice, setAutoFixNotice] = useState<any>(null);
  const [detectedExchange, setDetectedExchange] = useState<string>("");

  useEffect(() => {
    if (externalSymbol) {
      setInput(externalSymbol);
      setSuggestions([]);
      handlePredict(externalSymbol);
    }
  }, [externalSymbol]);

  function handleInputChange(v: string) {
    setInput(v.toUpperCase());
    setDetectedExchange(detectExchangeFromInput(v));

    if (v.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    setSuggestions(searchSymbol(v).slice(0, 6));
  }

  function applySuggestion(sym: string) {
    setInput(sym);
    setSuggestions([]);
  }

  function runAutoFix(userInput: string) {

    const res = findBestSymbol(userInput);

    if (res && res.symbol && res.symbol !== userInput.toUpperCase() && res.score >= 0.6) {

      setAutoFixNotice({
        original: userInput,
        fixed: res.symbol,
        score: res.score,
        exchange: res.exchange,
        name: res.name
      });

      setDetectedExchange(res.exchange || detectExchangeFromInput(userInput));

      return res.symbol;
    }

    setAutoFixNotice(null);
    setDetectedExchange(detectExchangeFromInput(userInput));

    return userInput;
  }

  async function loadQuote(finalSymbol?: string) {

    const sym = finalSymbol ?? input;

    try {

      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/quote/${encodeURIComponent(sym)}`);

      if (!res.ok) throw new Error("Quote API failed");

      const json = await res.json();

      setQuote(json);

      setHistory((h) => [
        ...h.slice(-29),
        Number(json.current ?? json.LTP ?? json.currentPrice ?? 0)
      ]);

      setLoading(false);

      return json;

    } catch (e: any) {

      setQuote(null);
      setPrediction(null);
      setOhlc([]);
      setHistory([]);
      setLoading(false);
      setError(e.message);

      return null;
    }
  }

  async function loadPrediction() {

    try {

      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: input })
      });

      if (!res.ok) throw new Error("Prediction failed");

      const json = await res.json();

      setPrediction(json);

    } catch (e: any) {

      setPrediction(null);
      setError(e.message);
    }
  }

  async function loadOHLC(finalSymbol?: string) {

    const sym = finalSymbol ?? input;

    try {

      const res = await fetch(`${API_BASE}/api/ohlc/${encodeURIComponent(sym)}`);

      if (!res.ok) throw new Error("OHLC API failed");

      const json = await res.json();

      setOhlc(json);

    } catch (e: any) {

      setOhlc([]);
    }
  }

  async function handlePredict(external?: string) {

    setError("");

    const raw = external ?? input;

    const fixed = runAutoFix(raw);

    if (fixed !== raw) setInput(fixed);

    const q = await loadQuote(fixed);

    if (!q) return;

    await loadPrediction();
    await loadOHLC();
  }

  function formatNum(v: any) {

    if (v === undefined || v === null) return "—";

    return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return (

    <TradingDashboard>

      <div style={ui.container}>

        <div style={{ position: "relative" }}>

          <div style={ui.row}>

            <input
              value={input}
              placeholder="Search: TCS, RELIANCE, GOLD..."
              onChange={(e) => handleInputChange(e.target.value)}
              style={ui.input}
            />

            <button onClick={() => handlePredict()} style={ui.btn}>
              {loading ? "..." : "Predict"}
            </button>

          </div>

          {suggestions.length > 0 && (

            <div style={ui.dropdown}>

              {suggestions.map((s, i) => (

                <div
                  key={i}
                  style={ui.dropdownItem}
                  onClick={() => applySuggestion(s.symbol)}
                >

                  <b>{s.symbol}</b> — {s.name}

                  <span style={{ float: "right", opacity: 0.8 }}>
                    {s.exchange}
                  </span>

                </div>

              ))}

            </div>

          )}

        </div>

        {error && <div style={ui.error}>{error}</div>}

        {quote && (

          <div style={ui.card}>

            <div style={ui.headerRow}>

              <div style={ui.sym}>{quote.symbol}</div>

              <div style={{ textAlign: "right" }}>

                <div style={ui.price}>
                  ₹{formatNum(quote.current ?? quote.LTP)}
                </div>

                <div
                  style={{
                    color: (quote.change ?? 0) >= 0 ? "#00e676" : "#ff5252",
                    fontWeight: 700
                  }}
                >
                  {formatNum(quote.change)}
                </div>

              </div>

            </div>

            <Sparkline data={history} />

            <div style={ui.metaGrid}>
              <Meta label="Open" value={quote.open} />
              <Meta label="High" value={quote.high} />
              <Meta label="Low" value={quote.low} />
              <Meta label="Prev Close" value={quote.previousClose} />
            </div>

          </div>

        )}

        {ohlc.length > 0 && (

          <div style={ui.chartWrapper}>
            <CandleChart data={ohlc} />
          </div>

        )}

        {prediction && (

          <div style={ui.predCard}>

            <h3>AI Prediction</h3>

            <p>Trend: {prediction.trend}</p>
            <p>Confidence: {prediction.confidence}</p>

            <div style={ui.predGrid}>
              <Pred label="1D" value={prediction.prediction1Day} />
              <Pred label="1W" value={prediction.prediction1Week} />
              <Pred label="1M" value={prediction.prediction1Month} />
            </div>

          </div>

        )}

        <MarketHeatmap />

      </div>

    </TradingDashboard>

  );
}

function Meta({ label, value }: any) {

  return (

    <div>

      <div style={{ color: "#8fa6b3", fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value ?? "—"}</div>

    </div>

  );

}

function Pred({ label, value }: any) {

  return (

    <div style={ui.predBox}>

      <div style={{ color: "#8fa6b3", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>

    </div>

  );

}

const ui: Record<string, React.CSSProperties> = {

  container: {
    background: "#04121a",
    padding: 20,
    borderRadius: 12,
    color: "#e6eef6",
    maxWidth: 1200,
    margin: "auto"
  },

  row: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap"
  },

  input: {
    flex: 1,
    minWidth: 200,
    padding: "10px 12px",
    background: "#071b24",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 10,
    color: "#9be7ff"
  },

  btn: {
    padding: "10px 18px",
    borderRadius: 10,
    background: "linear-gradient(90deg,#0f6bff,#00d4ff)",
    border: "none",
    color: "#041423",
    fontWeight: 800,
    cursor: "pointer"
  },

  dropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    background: "#061820",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    zIndex: 100
  },

  dropdownItem: {
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer",
    color: "#9be7ff"
  },

  error: {
    background: "#2a0b0b",
    padding: 12,
    borderRadius: 8,
    color: "#ffb3b3",
    marginTop: 10
  },

  card: {
    background: "#061820",
    padding: 18,
    borderRadius: 12,
    marginTop: 12,
    border: "1px solid rgba(255,255,255,0.05)"
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
    flexWrap: "wrap"
  },

  sym: {
    fontSize: 24,
    fontWeight: 900
  },

  price: {
    fontSize: 26,
    fontWeight: 900
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: 16,
    marginTop: 12
  },

  chartWrapper: {
    marginTop: 18,
    width: "100%",
    overflowX: "auto"
  },

  predCard: {
    background: "#061820",
    padding: 18,
    borderRadius: 12,
    marginTop: 16
  },

  predGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))",
    gap: 12,
    marginTop: 12
  },

  predBox: {
    background: "#04151f",
    padding: 14,
    borderRadius: 10,
    textAlign: "center"
  }

};
