import React from "react";
import AIMarketPredictor from "../AIMarketPredictor";

export default function CommodityTab() {
  return (
    <div>
      <p>Examples: <b>GOLD</b>, <b>SILVER</b>, <b>OIL</b></p>
      <AIMarketPredictor defaultType="commodity" />
    </div>
  );
}
