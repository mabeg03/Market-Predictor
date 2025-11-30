import React, { useEffect, useState } from "react";
import Sparkline from "./Sparkline";
import CandleChart from "./CandleChart";
import { searchSymbol } from "./symbolDatabase";

type Quote = {
  symbol: string;
  market: string;
  current: number;
  previousClose: number;
  change: number;
  changePct: number | string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
};

type Prediction = {
  asset: string;
  currentPrice: string;
  prediction1Day: string;
  prediction1Week: string;
  prediction1Month: string;
  trend: string;
  confidence: string;
  source: string;
};

export default function AIMarketPredictor({ externalSymbol = "" }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<number[]>([]);
  const [ohlc, setOhlc] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* -----------------------------
     Auto-load when user selects 
     from WATCHLIST
  ----------------------------- */
  useEffect(() => {
    if (externalSymbol) {
      setInput(externalSymbol);
      setSuggestions([]);
      handlePredict(externalSymbol);
    }
  }, [externalSymbol]);

  /* -----------------------------
     AUTOCOMPLETE INPUT
  ----------------------------- */
  function handleInputChange(v: string) {
    setInput(v.toUpperCase());
    if (!v.trim()) {
      setSuggestions([]);
      return;
    }
    setSuggestions(searchSymbol(v).slice(0, 6));
  }

  function applySuggestion(sym: string) {
    setInput(sym);
    setSuggestions([]);
  }

  /* -----------------------------
     API CALLS
  ----------------------------- */

  async function loadQuote(sym: string) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/quote/${sym}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || json.details);

      setQuote(json);
      setHistory((h) => [...h.slice(-29), json.current]);
      return json;
    } catch (e: any) {
      setError(e.message);
      setQuote(null);
      setPrediction(null);
      setOhlc([]);
      setHistory([]);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadPrediction(sym: string) {
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details);

      setPrediction(json);
    } catch (e: any) {
      setPrediction(null);
      setError(e.message);
    }
  }

  async function loadOHLC(sym: string) {
    try {
      const res = await fetch(`/api/ohlc/${sym}`);
      const json = await res.json();
      if (Array.isArray(json)) setOhlc(json);
    } catch {}
  }

  /* -----------------------------
     MAIN PREDICT HANDLER
  ----------------------------- */
  async function handlePredict(symInput?: string) {
    const sym = (symInput || input).trim().toUpperCase();
    if (!sym) {
      setError("Enter a valid symbol");
      return;
    }

    const q = await loadQuote(sym);
    if (!q) return;

    await loadPrediction(sym);
    await loadOHLC(sym);
  }

  return (
    <div style={ui.container}>
      {/* SEARCH + AUTOCOMPLETE */}
      <div style={{ position: "relative" }}>
        <div style={ui.row}>
          <input
            style={ui.input}
            value={input}
            placeholder="Search: TCS, RELIANCE, 540614, GOLD..."
            onChange={(e) => handleInputChange(e.target.value)}
          />
          <button style={ui.btn} onClick={() => handlePredict()}>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && <div style={ui.error}>{error}</div>}

      {/* QUOTE CARD */}
      {quote && (
        <div style={ui.card}>
          <div style={ui.headerRow}>
            <div style={ui.symbol}>{quote.symbol}</div>
            <div style={ui.price}>₹{quote.current}</div>
          </div>

          <div style={{ color: quote.change >= 0 ? "#00e676" : "#ff5252" }}>
            {quote.change} ({quote.changePct}%)
          </div>

          <Sparkline
            data={history}
            stroke={quote.change > 0 ? "#00e676" : "#ff5252"}
          />

          <div style={ui.metaGrid}>
            <Meta label="Open" value={quote.open} />
            <Meta label="High" value={quote.high} />
            <Meta label="Low" value={quote.low} />
            <Meta label="Prev Close" value={quote.previousClose} />
          </div>
        </div>
      )}

      {/* CANDLE CHART */}
      {ohlc.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <CandleChart data={ohlc} />
        </div>
      )}

      {/* PREDICTION CARD */}
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
    </div>
  );
}

/* -------------------- Helpers --------------------- */

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
      <div style={{ fontSize: 12, color: "#8fa6b3" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
    </div>
  );
}

/* -------------------- UI STYLES --------------------- */

const ui: Record<string, React.CSSProperties> = {
  container: {
    background: "#04121a",
    padding: 18,
    borderRadius: 12,
    color: "#e6eef6",
  },
  row: {
    display: "flex",
    gap: 10,
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#071b24",
    color: "#9be7ff",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  btn: {
    padding: "10px 16px",
    background: "linear-gradient(90deg,#0f6bff,#00d4ff)",
    borderRadius: 10,
    border: "none",
    color: "#041423",
    fontWeight: 800,
    cursor: "pointer",
  },
  dropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    background: "#061820",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    zIndex: 99,
  },
  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "#9be7ff",
  },
  error: {
    background: "#2a0b0b",
    color: "#ffb3b3",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  card: {
    background: "#061820",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  symbol: {
    fontSize: 24,
    fontWeight: 900,
  },
  price: {
    fontSize: 24,
    fontWeight: 900,
  },
  metaGrid: {
    display: "flex",
    gap: 20,
    marginTop: 12,
    flexWrap: "wrap",
  },
  predCard: {
    marginTop: 20,
    background: "#061820",
    padding: 16,
    borderRadius: 12,
  },
  predGrid: {
    display: "flex",
    gap: 14,
    marginTop: 12,
  },
  predBox: {
    background: "#04151f",
    padding: 12,
    borderRadius: 10,
    width: 100,
    textAlign: "center",
  },
};
