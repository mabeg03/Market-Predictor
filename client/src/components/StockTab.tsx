import React from "react";
import AIMarketPredictor from "../AIMarketPredictor";

export default function StockTab() {
  return (
    <div>
      <p style={{marginBottom: 10}}>Examples: <b>AAPL</b>, <b>TSLA</b>, <b>TCS</b>, <b>RELIANCE</b>, <b>SETFGOLD</b></p>
      <AIMarketPredictor defaultType="stock" />
    </div>
  );
}
