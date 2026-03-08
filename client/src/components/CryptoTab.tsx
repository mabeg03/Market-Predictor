import React from "react";
import AIMarketPredictor from "../AIMarketPredictor";

export default function CryptoTab() {
  return (
    <div>
      <p>Examples: <b>BTC</b>, <b>ETH</b>, <b>DOGE</b></p>
      <AIMarketPredictor defaultType="crypto" />
    </div>
  );
}
