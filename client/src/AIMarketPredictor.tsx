// src/AIMarketPredictor.tsx
import React, { useState, useEffect } from "react";
import Sparkline from "./Sparkline";
import CandleChart from "./CandleChart";
import { searchSymbol } from "./symbolDatabase";
import { findBestSymbol } from "./symbolFixer";

type Quote = { symbol: string; market: string; current: number; previousClose?: number; change?: number; changePct?: number | string; open?: number | null; high?: number | null; low?: number | null; };
type Prediction = { asset: string; currentPrice: string; prediction1Day: string; prediction1Week: string; prediction1Month: string; trend: string; confidence: string; source: string; };

export default function AIMarketPredictor({ externalSymbol = "" }: { externalSymbol?: string }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [ohlc, setOhlc] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fix notice state
  const [autoFixNotice, setAutoFixNotice] = useState<{ original: string; fixed: string; score: number; reason?: string } | null>(null);

  useEffect(() => {
    if (externalSymbol) {
      setInput(externalSymbol);
      setSuggestions([]);
      handlePredict(externalSymbol);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSymbol]);

  /* AUTOCOMPLETE */
  function handleInputChange(v: string) {
    setInput(v.toUpperCase());
    if (v.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setSuggestions(searchSymbol(v).slice(0, 6));
  }
  function applySuggestion(sym: string) { setInput(sym); setSuggestions([]); }

  /* AUTO-FIX: runs BEFORE any fetches */
  function runAutoFix(userInput: string) {
    const res = findBestSymbol(userInput);
    // If strong or medium confidence, apply automatically but notify
    if (res.score >= 0.6 && res.symbol && res.symbol !== userInput.toUpperCase()) {
      setAutoFixNotice({ original: userInput, fixed: res.symbol, score: res.score, reason: res.reason });
      return res.symbol;
    }
    // if low confidence but a suggestion exists, keep raw input but show suggestion (do not auto-apply)
    if (res.score < 0.6 && res.suggestion) {
      setAutoFixNotice({ original: userInput, fixed: res.suggestion, score: res.score, reason: res.reason });
      return userInput; // don't overwrite
    }
    setAutoFixNotice(null);
    return userInput;
  }

  /* FETCHERS */
  async function loadQuote(symbolArg?: string) {
    const symbolToUse = symbolArg ?? input;
    try {
      setLoading(true); setError("");
      const res = await fetch(`/api/quote/${encodeURIComponent(symbolToUse)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "No quote");
      setQuote(json);
      setHistory((h) => [...h.slice(-29), Number(json.current ?? json.currentPrice ?? 0)]);
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
      const res = await fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: input }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "Predict failed");
      setPrediction(json);
    } catch (e: any) { setPrediction(null); setError(e.message); }
  }

  async function loadOHLC() {
    try {
      const res = await fetch(`/api/ohlc/${encodeURIComponent(input)}`);
      const json = await res.json();
      if (Array.isArray(json)) setOhlc(json);
    } catch {}
  }

  /* MAIN: handlePredict */
  async function handlePredict(external?: string) {
    setError("");
    // 1) auto-fix
    const raw = external ?? input;
    const fixed = runAutoFix(raw);
    // if auto-applied, update input so UI reflects it
    if (fixed !== raw) setInput(fixed);

    // 2) fetch quote/prediction/ohlc using final symbol
    const q = await loadQuote(fixed);
    if (!q) return;
    await loadPrediction();
    await loadOHLC();
  }

  /* UI helpers */
  function formatNum(v: any) { if (v === undefined || v === null) return "—"; return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function clearAutoFix() { setAutoFixNotice(null); }

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
                <b>{s.symbol}</b> — {s.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {autoFixNotice && (
        <div style={ui.autofix}>
          <div>Auto-corrected <b>{autoFixNotice.original}</b> → <b>{autoFixNotice.fixed}</b> ({Math.round(autoFixNotice.score * 100)}% confidence)</div>
          <div style={{ marginTop: 6 }}>
            <button style={ui.smallBtn} onClick={() => { setInput(autoFixNotice.fixed); clearAutoFix(); }}>Use {autoFixNotice.fixed}</button>
            <button style={{ ...ui.smallBtn, marginLeft: 8 }} onClick={() => { setInput(autoFixNotice.original); clearAutoFix(); }}>Revert</button>
          </div>
        </div>
      )}

      {error && <div style={ui.error}>{error}</div>}

      {quote && (
        <div style={ui.card}>
          <div style={ui.headerRow}>
            <div style={ui.sym}>{quote.symbol}</div>
            <div style={ui.price}>₹{formatNum(quote.current)}</div>
          </div>

          <div style={{ color: (quote.change ?? 0) >= 0 ? "#00e676" : "#ff5252", fontWeight: 700 }}>
            {formatNum(quote.change)} ({String(quote.changePct ?? "—")})
          </div>

          <div style={{ marginTop: 10 }}>
            <Sparkline data={history} stroke={(quote.change ?? 0) >= 0 ? "#00e676" : "#ff5252"} />
          </div>

          <div style={ui.metaGrid}>
            <Meta label="Open" value={quote.open} />
            <Meta label="High" value={quote.high} />
            <Meta label="Low" value={quote.low} />
            <Meta label="Prev Close" value={quote.previousClose} />
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

/* small components & styles (kept compact) */
function Meta({ label, value }: any) { return (<div><div style={{ color: "#8fa6b3", fontSize: 12 }}>{label}</div><div style={{ fontWeight: 700 }}>{value ?? "—"}</div></div>); }
function Pred({ label, value }: any) { return (<div style={ui.predBox}><div style={{ color: "#8fa6b3", fontSize:12 }}>{label}</div><div style={{ fontSize:18, fontWeight:800 }}>{value}</div></div>); }

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
  headerRow: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  sym: { fontSize: 24, fontWeight: 900 },
  price: { fontSize: 26, fontWeight: 900 },
  metaGrid: { display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" },
  predCard: { background: "#061820", padding: 16, borderRadius: 12, marginTop: 16 },
  predGrid: { display: "flex", gap: 14, marginTop: 10 },
  predBox: { background: "#04151f", padding: 12, borderRadius: 10, width: 100, textAlign: "center" },
};
