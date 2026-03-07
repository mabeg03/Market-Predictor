import React from "react";
import "./styles.css";

export default function TradingDashboard({ children }) {
  return (
    <div className="dashboard">

      {/* HEADER */}

      <header className="header">
        <h1>AI Market Predictor</h1>
      </header>

      {/* MAIN GRID */}

      <div className="dashboard-grid">

        {/* CHART AREA */}
        <div className="card chart">
          <h3>📈 Market Chart</h3>
          {children}
        </div>

        {/* WATCHLIST */}
        <div className="card watchlist">
          <h3>🔥 Watchlist</h3>

          <div className="watch-item">
            <span>BTC</span>
            <span className="green">+2.3%</span>
          </div>

          <div className="watch-item">
            <span>ETH</span>
            <span className="red">-1.2%</span>
          </div>

          <div className="watch-item">
            <span>AAPL</span>
            <span className="green">+0.8%</span>
          </div>

        </div>

        {/* AI PREDICTION */}
        <div className="card ai">
          <h3>🤖 AI Prediction</h3>

          <p>Trend: <b className="green">Bullish</b></p>
          <p>Confidence: <b>82%</b></p>
          <p>Signal: <b>BUY</b></p>

        </div>

      </div>

    </div>
  );
}
