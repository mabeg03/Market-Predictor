// client/src/AIMarketPredictor.tsx
import React, { useState, useEffect } from "react";
import Sparkline from "./Sparkline";
import CandleChart from "./CandleChart";

const API_BASE = "https://tradedeck-rho.vercel.app";
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
    // eslint-disable-next-line
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
  function applySuggestion(sym: string) { setInput(sym); setSuggestions([]); }

  function runAutoFix(userInput: string) {
    const res = findBestSymbol(userInput);
    if (res && res.symbol && res.symbol !== userInput.toUpperCase() && res.score >= 0.6) {
      setAutoFixNotice({ original: userInput, fixed: res.symbol, score: res.score, exchange: res.exchange, name: res.name });
      setDetectedExchange(res.exchange || detectExchangeFromInput(userInput));
      return res.symbol;
    }
    if (res && res.suggestion) {
      setAutoFixNotice({ original: userInput, fixed: res.suggestion, score: res.score, exchange: res.suggestionExchange, name: res.suggestionName });
      return userInput;
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "No quote");
      setQuote(json);
      setHistory((h) => [...h.slice(-29), Number(json.current ?? json.LTP ?? json.currentPrice ?? 0)]);
      setLoading(false);
      return json;
    } catch (e: any) {
      setQuote(null); setPrediction(null); setOhlc([]); setHistory([]); setLoading(false);
      setError(e.message);
      return null;
    }
  }

  async function loadPrediction() {
    try {
      const res = await fetch(`${API_BASE}/api/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: input }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "Predict failed");
      setPrediction(json);
    } catch (e: any) {
      setPrediction(null); setError(e.message);
    }
  }

  async function loadOHLC() {
    try {
      const res = await fetch(`${API_BASE}/api/ohlc/${encodeURIComponent(input)}`);
      const json = await res.json();
      if (Array.isArray(json)) setOhlc(json);
    } catch {}
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

  function renderBadge(market?: string) {
    const m = (market || detectedExchange || (quote && quote.market) || "").toUpperCase();
    const base: React.CSSProperties = {
      display: "inline-block", padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 800, marginLeft: 8
    };
    switch (m) {
      case "NSE": return <span style={{ ...base, background: "#00d4ff", color: "#04202a" }}>NSE</span>;
      case "BSE": return <span style={{ ...base, background: "#ffb86b", color: "#2a1600" }}>BSE</span>;
      case "GLOBAL": return <span style={{ ...base, background: "#7cf3a2", color: "#04301a" }}>GLOBAL</span>;
      case "COMMODITY": return <span style={{ ...base, background: "#ffd166", color: "#2a1f00" }}>COM</span>;
      case "CRYPTO": return <span style={{ ...base, background: "#a78bfa", color: "#180b2a" }}>CRYPTO</span>;
      case "FOREX": return <span style={{ ...base, background: "#9be7ff", color: "#04202a" }}>FOREX</span>;
      default: return <span style={{ ...base, background: "#d1d8e0", color: "#041421" }}>UNKNOWN</span>;
    }
  }

  function formatNum(v: any) { if (v === undefined || v === null) return "—"; return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }); }

  return (
    <div style={ui.container}>
      <div style={{ position: "relative" }}>
        <div style={ui.row}>
          <input value={input} placeholder="Search: TCS, RELIANCE, 540614, GOLD..." onChange={(e) => handleInputChange(e.target.value)} style={ui.input} />
          <button onClick={() => handlePredict()} style={ui.btn}>{loading ? "..." : "Predict"}</button>
        </div>

        {suggestions.length > 0 && (
          <div style={ui.dropdown}>
            {suggestions.map((s, i) => (
              <div key={i} style={ui.dropdownItem} onClick={() => applySuggestion(s.symbol)}>
                <b>{s.symbol}</b> — {s.name} <span style={{ float: "right", opacity: 0.8 }}>{s.exchange}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {autoFixNotice && (
        <div style={ui.autofix}>
          Auto-corrected <b>{autoFixNotice.original}</b> → <b>{autoFixNotice.fixed}</b> ({Math.round(autoFixNotice.score * 100)}%); <button style={ui.smallBtn} onClick={() => { setInput(autoFixNotice.fixed); setAutoFixNotice(null); }}>Use</button>
          <button style={{ ...ui.smallBtn, marginLeft: 8 }} onClick={() => { setInput(autoFixNotice.original); setAutoFixNotice(null); }}>Revert</button>
        </div>
      )}

      {error && <div style={ui.error}>{error}</div>}

      {quote && (
        <div style={ui.card}>
          <div style={ui.headerRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={ui.sym}>{quote.symbol}</div>
              {renderBadge(quote.market)}
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={ui.price}>₹{formatNum(quote.current ?? quote.LTP)}</div>
              <div style={{ color: (quote.change ?? 0) >= 0 ? "#00e676" : "#ff5252", fontWeight: 700 }}>
                {formatNum(quote.change)} ({String(quote.changePct ?? quote.changePercent ?? "—")})
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <Sparkline data={history} stroke={(quote.change ?? 0) >= 0 ? "#00e676" : "#ff5252"} />
          </div>

          <div style={ui.metaGrid}>
            <Meta label="Open" value={quote.open} />
            <Meta label="High" value={quote.high} />
            <Meta label="Low" value={quote.low} />
            <Meta label="Prev Close" value={quote.previousClose ?? quote.PClose} />
          </div>
        </div>
      )}

      {ohlc.length > 0 && <div style={{ marginTop: 16 }}><CandleChart data={ohlc} /></div>}

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

function Meta({ label, value }: any) { return (<div><div style={{ color: "#8fa6b3", fontSize: 12 }}>{label}</div><div style={{ fontWeight: 700 }}>{value ?? "—"}</div></div>); }
function Pred({ label, value }: any) { return (<div style={ui.predBox}><div style={{ color: "#8fa6b3", fontSize: 12 }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div></div>); }

const ui: Record<string, React.CSSProperties> = {
  container: { background: "#04121a", padding: 18, borderRadius: 12, color: "#e6eef6" },
  row: { display: "flex", gap: 10, marginBottom: 10 },
  input: { flex: 1, padding: "10px 12px", background: "#071b24", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, color: "#9be7ff" },
  btn: { padding: "10px 16px", borderRadius: 10, background: "linear-gradient(90deg,#0f6bff,#00d4ff)", border: "none", color: "#041423", fontWeight: 800, cursor: "pointer" },
  dropdown: { position: "absolute", top: 48, left: 0, right: 0, background: "#061820", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", zIndex: 100 },
  dropdownItem: { padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: "#9be7ff" },
  autofix: { background: "#072027", padding: 12, borderRadius: 10, marginTop: 10, border: "1px solid rgba(255,255,255,0.04)" },
  smallBtn: { padding: "6px 10px", borderRadius: 8, background: "#0f6bff", color: "#fff", border: "none", cursor: "pointer" },
  error: { background: "#2a0b0b", padding: 12, borderRadius: 8, color: "#ffb3b3", marginTop: 10 },
  card: { background: "#061820", padding: 16, borderRadius: 12, marginTop: 10, border: "1px solid rgba(255,255,255,0.05)" },
  headerRow: { display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" },
  sym: { fontSize: 24, fontWeight: 900 },
  price: { fontSize: 26, fontWeight: 900 },
  metaGrid: { display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" },
  predCard: { background: "#061820", padding: 16, borderRadius: 12, marginTop: 16 },
  predGrid: { display: "flex", gap: 14, marginTop: 10 },
  predBox: { background: "#04151f", padding: 12, borderRadius: 10, width: 100, textAlign: "center" }
};
