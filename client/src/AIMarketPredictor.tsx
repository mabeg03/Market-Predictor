import { useState, useEffect } from "react";

const API_BASE = "https://tradedeck-ltby.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Syne', sans-serif;
    background: #020c12;
    color: #e6eef6;
    overflow-x: hidden;
  }

  :root {
    --cyan: #00d4ff;
    --cyan-dim: rgba(0, 212, 255, 0.12);
    --cyan-glow: rgba(0, 212, 255, 0.3);
    --green: #00e676;
    --red: #ff4444;
    --bg: #020c12;
    --bg2: #071420;
    --bg3: #0d1f2d;
    --border: rgba(0, 212, 255, 0.15);
    --text: #e6eef6;
    --text-dim: #7a9bb5;
    --sidebar-w: 270px;
  }

  /* OVERLAY */
  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(2, 12, 18, 0.75);
    z-index: 900;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    transition: opacity 0.3s;
  }
  .overlay.active { display: block; }

  /* SIDEBAR */
  .sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-w);
  height: 100vh;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden;
}

/* Hidden sidebar (mobile default) */
.sidebar.closed {
  transform: translateX(-100%);
}

/* Open sidebar */
.sidebar.open {
  transform: translateX(0);
}

  .sidebar-header {
    padding: 28px 20px 20px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-logo {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--cyan);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sidebar-logo-icon {
    width: 32px; height: 32px;
    background: var(--cyan-dim);
    border: 1px solid var(--cyan-glow);
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-size: 14px;
  }

  .sidebar-tagline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 6px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .sidebar-search {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .search-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 10px;
    display: block;
  }

  .search-row {
    display: flex;
    gap: 8px;
  }

  .search-input {
    flex: 1;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    text-transform: uppercase;
  }
  .search-input::placeholder { color: var(--text-dim); text-transform: none; }
  .search-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px var(--cyan-dim);
  }

  .predict-btn {
    background: var(--cyan);
    color: #020c12;
    border: none;
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .predict-btn:hover { opacity: 0.85; transform: scale(1.03); }
  .predict-btn:active { transform: scale(0.97); }
  .predict-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* WATCHLIST */
  .watchlist-section {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .watchlist-section::-webkit-scrollbar { width: 4px; }
  .watchlist-section::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .watchlist-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .watchlist-count {
    background: var(--cyan-dim);
    color: var(--cyan);
    border-radius: 20px;
    padding: 2px 8px;
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
  }

  .watchlist-empty {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
    padding: 30px 0;
    line-height: 1.8;
  }

  .watchlist-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 4px;
    border: 1px solid transparent;
  }
  .watchlist-item:hover {
    background: var(--cyan-dim);
    border-color: var(--border);
  }

  .watchlist-dot {
    width: 7px; height: 7px;
    background: var(--cyan);
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 6px var(--cyan);
  }

  .watchlist-sym {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    flex: 1;
  }

  /* HAMBURGER */
  .hamburger {
    position: fixed;
    top: 18px;
    left: 18px;
    z-index: 1100;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    width: 42px; height: 42px;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .hamburger:hover { background: var(--bg3); border-color: var(--cyan-glow); }

  .ham-line {
    width: 20px; height: 2px;
    background: var(--cyan);
    border-radius: 2px;
    transition: all 0.3s;
  }
  .hamburger.open .ham-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .hamburger.open .ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .hamburger.open .ham-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* MAIN */
  .main {
    margin-left: var(--sidebar-w);
    min-height: 100vh;
    background: var(--bg);
    padding: 48px 44px;
    transition: margin-left 0.3s;
  }

  .main-header {
    margin-bottom: 36px;
  }

  .main-title {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.1;
  }

  .main-title span { color: var(--cyan); }

  .main-subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 8px;
    letter-spacing: 0.5px;
  }

  /* ERROR */
  .error-box {
    background: rgba(255, 68, 68, 0.08);
    border: 1px solid rgba(255, 68, 68, 0.25);
    border-radius: 10px;
    padding: 14px 18px;
    color: var(--red);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* LOADER */
  .loader-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 24px 0;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  .loader-dots {
    display: flex; gap: 5px;
  }
  .loader-dots span {
    width: 7px; height: 7px;
    background: var(--cyan);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }
  .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loader-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-8px); opacity: 1; }
  }

  /* CARDS GRID */
  .cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 4px;
  }

  /* QUOTE CARD */
  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--cyan), transparent);
  }

  .card-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 16px;
  }

  .quote-symbol {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
    color: var(--text);
    margin-bottom: 6px;
  }

  .quote-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 36px;
    font-weight: 400;
    color: var(--cyan);
    margin-bottom: 8px;
    letter-spacing: -1px;
  }

  .quote-change {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .quote-change.pos { color: var(--green); }
  .quote-change.neg { color: var(--red); }

  .change-pill {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: 600;
  }
  .change-pill.pos { background: rgba(0, 230, 118, 0.12); }
  .change-pill.neg { background: rgba(255, 68, 68, 0.12); }

  /* PREDICTION CARD */
  .pred-card { grid-column: 1 / -1; }

  .pred-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .pred-item {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
  }

  .pred-key {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 8px;
  }

  .pred-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 500;
    color: var(--cyan);
  }

  .advice-box {
    background: var(--bg3);
    border: 1px solid var(--cyan-dim);
    border-radius: 10px;
    padding: 16px 18px;
  }

  .advice-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 8px;
  }

  .advice-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text);
  }

  /* EMPTY STATE */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    gap: 16px;
    color: var(--text-dim);
  }

  .empty-icon {
    font-size: 48px;
    opacity: 0.3;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    opacity: 0.5;
  }

  .empty-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    opacity: 0.5;
    line-height: 1.7;
  }

  /* SIDEBAR CLOSE BTN (mobile) */
  .sidebar-close {
    display: none;
    position: absolute;
    top: 16px; right: 16px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 8px;
    width: 32px; height: 32px;
    place-items: center;
    cursor: pointer;
    color: var(--text-dim);
    font-size: 16px;
    line-height: 1;
  }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .sidebar {
      transform: translateX(-100%);
      box-shadow: 4px 0 40px rgba(0,0,0,0.5);
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-close { display: grid; }

    .hamburger { display: flex; }

    .main {
      margin-left: 0;
      padding: 24px 20px 24px;
      padding-top: 72px;
    }

    .main-title { font-size: 26px; }

    .cards-grid {
      grid-template-columns: 1fr;
    }

    .pred-card { grid-column: 1; }

    .pred-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 500px) {
    .main { padding: 16px 14px; padding-top: 70px; }
    .quote-price { font-size: 28px; }
    .pred-grid { grid-template-columns: 1fr 1fr; }
    .card { padding: 18px; }
  }
`;

function Sidebar({ watchlist, symbol, setSymbol, handlePredict, isOpen, onClose, loading }) {
  return (
    <>
      <div className={`overlay ${isOpen ? "active" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">✕</button>

        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">📈</div>
            TradeDeck
          </div>
          <div className="sidebar-tagline">AI-powered market intelligence</div>
        </div>

        <div className="sidebar-search">
          <span className="search-label">Analyze Symbol</span>
          <div className="search-row">
            <input
              className="search-input"
              type="text"
              placeholder="e.g. RELIANCE"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePredict()}
            />
            <button
              className="predict-btn"
              onClick={handlePredict}
              disabled={loading || !symbol}
            >
              {loading ? "…" : "Run"}
            </button>
          </div>
        </div>

        <div className="watchlist-section">
          <div className="watchlist-label">
            Watchlist
            {watchlist.length > 0 && (
              <span className="watchlist-count">{watchlist.length}</span>
            )}
          </div>

          {watchlist.length === 0 ? (
            <div className="watchlist-empty">
              No symbols yet.<br />
              Search above to begin.
            </div>
          ) : (
            watchlist.map(sym => (
              <div
                key={sym}
                className="watchlist-item"
                onClick={() => { setSymbol(sym); handlePredict(); }}
              >
                <div className="watchlist-dot" />
                <span className="watchlist-sym">{sym}</span>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

export default function AIMarketPredictor() {
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Inject styles
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = styles;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  async function handlePredict() {
    if (!symbol) return;
    setSidebarOpen(false); // close on mobile after search
    try {
      setError("");
      setLoading(true);
      const sym = symbol.trim().toUpperCase();
      if (!watchlist.includes(sym)) setWatchlist(prev => [...prev, sym]);

      const quoteRes = await fetch(`${API_BASE}/api/quote/${encodeURIComponent(sym)}`);
      if (!quoteRes.ok) throw new Error("Quote API failed");
      setQuote(await quoteRes.json());

      const predRes = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym })
      });
      setPrediction(await predRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function fmt(v) {
    if (v == null) return "—";
    return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  const isPos = quote && Number(quote.change) >= 0;

  return (
    <>
      {/* HAMBURGER */}
      <button
        className={`hamburger ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        <div className="ham-line" />
        <div className="ham-line" />
        <div className="ham-line" />
      </button>

      {/* SIDEBAR */}
      <Sidebar
        watchlist={watchlist}
        symbol={symbol}
        setSymbol={setSymbol}
        handlePredict={handlePredict}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        loading={loading}
      />

      {/* MAIN */}
      <main className="main">
        <div className="main-header">
          <h1 className="main-title">
            AI <span>Market</span> Predictor
          </h1>
          <p className="main-subtitle">
            Real-time quotes · AI signals · Portfolio watchlist
          </p>
        </div>

        {error && (
          <div className="error-box">
            ⚠ {error}
          </div>
        )}

        {loading && (
          <div className="loader-wrap">
            <div className="loader-dots">
              <span /><span /><span />
            </div>
            Fetching market data…
          </div>
        )}

        {!loading && !quote && !prediction && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">No data yet</div>
            <div className="empty-sub">
              Enter a stock symbol in the sidebar<br />
              and press Run to see AI predictions.
            </div>
          </div>
        )}

        {!loading && (quote || prediction) && (
          <div className="cards-grid">
            {quote && (
              <div className="card">
                <div className="card-label">Live Quote</div>
                <div className="quote-symbol">{quote.symbol}</div>
                <div className="quote-price">₹{fmt(quote.current)}</div>
                <div className={`quote-change ${isPos ? "pos" : "neg"}`}>
                  {isPos ? "▲" : "▼"} {fmt(Math.abs(quote.change))}
                  <span className={`change-pill ${isPos ? "pos" : "neg"}`}>
                    {isPos ? "+" : ""}{fmt(quote.change_percent || quote.change)}%
                  </span>
                </div>
              </div>
            )}

            {prediction && (
              <div className="card pred-card">
                <div className="card-label">AI Prediction</div>
                <div className="pred-grid">
                  <div className="pred-item">
                    <div className="pred-key">Trend</div>
                    <div className="pred-val">{prediction.trend || "—"}</div>
                  </div>
                  <div className="pred-item">
                    <div className="pred-key">Signal</div>
                    <div className="pred-val">{prediction.signal || "—"}</div>
                  </div>
                  <div className="pred-item">
                    <div className="pred-key">Confidence</div>
                    <div className="pred-val">{prediction.confidence || "—"}</div>
                  </div>
                </div>
                <div className="advice-box">
                  <div className="advice-label">AI Advice</div>
                  <div className="advice-text">{prediction.advice || "—"}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
