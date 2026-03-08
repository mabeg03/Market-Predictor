import React from "react";
import AIMarketPredictor from "../AIMarketPredictor";

export default function ForexTab() {
  return (
    <div>
      <p>Examples: <b>USD/INR</b>, <b>EUR/USD</b>, <b>GBP/USD</b></p>
      <AIMarketPredictor defaultType="forex" />
    </div>
  );
}
