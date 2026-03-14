import { useEffect, useState } from "react";
import { searchSymbol } from "./symbolDatabase";
import "./AIMarketPredictor.css";

const API_BASE = "https://tradedeck-ltby.onrender.com";

type Quote = {
  symbol: string;
  current: number;
  change: number;
};

type Prediction = {
  trend: string;
  signal: string;
  confidence: string | number;
  advice: string;
};

type Props = {
  externalSymbol?: string;
};

export default function AIMarketPredictor({ externalSymbol }: Props) {
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalSymbol) {
      setSymbol(externalSymbol);
      setShowSuggestions(false);
    }
  }, [externalSymbol]);

  function handleChangeInput(value: string) {
    setSymbol(value);

    const q = value.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const found = searchSymbol(q).slice(0, 6);
    setSuggestions(found);
    setShowSuggestions(found.length > 0);
  }

  async function handlePredict() {
    if (!symbol) return;

    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    setError(null);
    setLoading(true);

    if (!watchlist.includes(sym)) {
      setWatchlist((prev) => [...prev, sym]);
    }

    try {
      const quoteRes = await fetch(`${API_BASE}/api/quote/${sym}`);
      const quoteData = await quoteRes.json();

      if (!quoteRes.ok || (quoteData && quoteData.error)) {
        setQuote(null);
        setPrediction(null);
        setError(quoteData?.error || "No data found for this symbol.");
        return;
      }

      setQuote(quoteData);

      const predRes = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });

      const predData = await predRes.json();

      if (!predRes.ok || (predData && predData.error)) {
        setPrediction(null);
        setError(predData?.error || "Prediction unavailable for this symbol.");
        return;
      }

      setPrediction(predData);
    } catch (e: any) {
      setQuote(null);
      setPrediction(null);
      setError("Network error while fetching data.");
    } finally {
      setLoading(false);
    }
  }

  function fmt(v: number | null | undefined) {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
    return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  const isPos = quote && Number(quote.change) >= 0;

  return (
    <div className="predictor-root">
      <div className="predictor-header">
        <div>
          <h1 className="predictor-title">AI Market Predictor</h1>
          <p className="predictor-subtitle">
            Enter a symbol to see the latest price and AI-powered prediction.
          </p>
        </div>
      </div>

      <div className="predictor-search-row">
        <input
          className="predictor-search-input"
          placeholder="e.g. TCS, RELIANCE, NIFTY"
          value={symbol}
          onChange={(e) => handleChangeInput(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
        />
        <button className="predictor-search-button" onClick={handlePredict}>
          Predict
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="predictor-suggestions">
          {suggestions.map((s) => (
            <button
              key={`${s.symbol}-${s.exchange}`}
              type="button"
              className="predictor-suggestion-item"
              onClick={() => {
                setSymbol(s.symbol);
                setShowSuggestions(false);
              }}
            >
              <span className="predictor-suggestion-symbol">{s.symbol}</span>
              <span className="predictor-suggestion-name">{s.name}</span>
              <span className="predictor-suggestion-exchange">{s.exchange}</span>
            </button>
          ))}
        </div>
      )}

      <div className="predictor-grid">
        <div className="predictor-main-column">
          {error && (
            <div className="predictor-card predictor-error">
              {error}
            </div>
          )}

          {loading && (
            <div className="predictor-card predictor-loading">
              Loading latest market data…
            </div>
          )}

          {quote && !loading && !error && (
            <div className="predictor-card">
              <h2 className="predictor-symbol">{quote.symbol}</h2>
              <div className="predictor-price">{fmt(quote.current)}</div>
              <div className={isPos ? "predictor-change pos" : "predictor-change neg"}>
                {isPos ? "▲" : "▼"} {fmt(quote.change)}
              </div>
            </div>
          )}

          {prediction && !loading && !error && (
            <div className="predictor-card">
              <h3 className="predictor-section-title">AI Prediction</h3>
              <div className="predictor-row">
                <span>Trend</span>
                <b>{prediction.trend}</b>
              </div>
              <div className="predictor-row">
                <span>Signal</span>
                <b>{prediction.signal}</b>
              </div>
              <div className="predictor-row">
                <span>Confidence</span>
                <b>{prediction.confidence}</b>
              </div>
              <div className="predictor-row">
                <span>Advice</span>
                <b>{prediction.advice}</b>
              </div>
            </div>
          )}
        </div>

        <div className="predictor-card predictor-watchlist-card">
          <h3 className="predictor-section-title">Watchlist</h3>
          {watchlist.length === 0 && (
            <p className="predictor-empty">No symbols added yet.</p>
          )}
          {watchlist.map((sym) => (
            <button
              key={sym}
              className="predictor-watch-item"
              onClick={() => {
                setSymbol(sym);
                handlePredict();
              }}
              type="button"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

