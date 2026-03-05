```tsx
// client/src/AIMarketPredictor.tsx

import React, { useState, useEffect } from "react";
import MarketHeatmap from "./MarketHeatmap";
import Sparkline from "./Sparkline";
import CandleChart from "./CandleChart";

const API_BASE: string = "https://tradedeck-ltby.onrender.com";

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

      setDetectedExchange(res.exchange);
      return res.symbol;
    }

    setAutoFixNotice(null);
    return userInput;
  }

  async function loadQuote(finalSymbol?: string) {

    const sym = finalSymbol ?? input;

    try {

      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/quote/${encodeURIComponent(sym)}`
      );

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
      setHistory([]);
      setOhlc([]);
      setError(e.message);
      setLoading(false);

      return null;
    }
  }

  async function loadPrediction() {

    try {

      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ symbol: input })
      });

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
      const json = await res.json();
      setOhlc(json);

    } catch {

      setOhlc([]);

    }
  }

  async function handlePredict(external?: string) {

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

    <div style={ui.container}>

      {/* SEARCH */}

      <div style={ui.row}>

        <input
          value={input}
          placeholder="Search: TCS, RELIANCE, GOLD, BTC..."
          onChange={(e) => handleInputChange(e.target.value)}
          style={ui.input}
        />

        <button onClick={() => handlePredict()} style={ui.btn}>
          {loading ? "..." : "Predict"}
        </button>

      </div>

      {/* SUGGESTIONS */}

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

      {error && <div style={ui.error}>{error}</div>}

      {/* QUOTE CARD */}

      {quote && (

        <div style={ui.card}>

          <div style={ui.headerRow}>

            <div style={ui.sym}>{quote.symbol}</div>

            <div style={ui.price}>
              ₹{formatNum(quote.current)}
            </div>

          </div>

          <Sparkline data={history} stroke="#00e676" />

          <div style={ui.metaGrid}>

            <Meta label="Open" value={quote.open} />
            <Meta label="High" value={quote.high} />
            <Meta label="Low" value={quote.low} />
            <Meta label="Prev Close" value={quote.previousClose} />

          </div>

        </div>

      )}

      {/* CHART */}

      {ohlc.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <CandleChart data={ohlc} />
        </div>
      )}

      {/* PREDICTION */}

      {prediction && (

        <div style={ui.predCard}>

          <h3>AI Prediction</h3>

          <p>Trend: {prediction.trend}</p>
          <p>Confidence: {prediction.confidence}</p>

          <div style={ui.predGrid}>

            <Pred label="1 Day" value={prediction.prediction1Day} />
            <Pred label="1 Week" value={prediction.prediction1Week} />
            <Pred label="1 Month" value={prediction.prediction1Month} />

          </div>

        </div>

      )}

      <MarketHeatmap />

    </div>

  );
}

function Meta({ label, value }: any) {
  return (
    <div>
      <div style={{ fontSize: "12px", opacity: 0.7 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value ?? "—"}</div>
    </div>
  );
}

function Pred({ label, value }: any) {
  return (
    <div style={ui.predBox}>
      <div style={{ fontSize: "12px", opacity: 0.7 }}>{label}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {

container:{
  background:"#04121a",
  padding:"18px",
  borderRadius:"12px",
  color:"#e6eef6",
  width:"100%",
  maxWidth:"1100px",
  margin:"auto"
},

row:{
  display:"flex",
  gap:"10px",
  flexWrap:"wrap",
  marginBottom:"10px"
},

input:{
  flex:"1 1 250px",
  padding:"10px 12px",
  background:"#071b24",
  border:"1px solid rgba(255,255,255,0.05)",
  borderRadius:"10px",
  color:"#9be7ff"
},

btn:{
  padding:"10px 16px",
  borderRadius:"10px",
  background:"linear-gradient(90deg,#0f6bff,#00d4ff)",
  border:"none",
  color:"#041423",
  fontWeight:800,
  cursor:"pointer"
},

dropdown:{
  background:"#061820",
  borderRadius:"8px",
  marginBottom:"10px"
},

dropdownItem:{
  padding:"10px",
  cursor:"pointer"
},

card:{
  background:"#061820",
  padding:"16px",
  borderRadius:"12px",
  marginTop:"10px"
},

headerRow:{
  display:"flex",
  justifyContent:"space-between",
  marginBottom:"10px"
},

sym:{ fontSize:"22px", fontWeight:900 },

price:{ fontSize:"24px", fontWeight:900 },

metaGrid:{
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",
  gap:"12px",
  marginTop:"10px"
},

predCard:{
  background:"#061820",
  padding:"16px",
  borderRadius:"12px",
  marginTop:"16px"
},

predGrid:{
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",
  gap:"14px",
  marginTop:"10px"
},

predBox:{
  background:"#04151f",
  padding:"12px",
  borderRadius:"10px",
  textAlign:"center"
},

error:{
  background:"#2a0b0b",
  padding:"10px",
  borderRadius:"8px",
  marginTop:"10px"
}

};
```
