import React from "react";
import "./styles.css";

type Props = {
  watchlist: string[];
  children: React.ReactNode;
};

export default function TradingDashboard({ watchlist, children }: Props) {

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

          {watchlist.length === 0 && (
            <p style={{ opacity: 0.6 }}>
              No symbols added
            </p>
          )}

          {watchlist.map((s, i) => (

            <div key={i} className="watch-item">
              <span>{s}</span>
            </div>

          ))}

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
