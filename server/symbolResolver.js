// symbolResolver.js

function resolveSymbol(input) {

  if (!input) return "AAPL";

  const s = input.trim().toUpperCase();

  /* -------- CRYPTO -------- */

  if (s === "BTC" || s === "BITCOIN") return "BTC-USD";
  if (s === "ETH" || s === "ETHEREUM") return "ETH-USD";
  if (s === "DOGE") return "DOGE-USD";

  /* -------- FOREX -------- */

  if (s === "USDINR") return "USDINR=X";
  if (s === "EURUSD") return "EURUSD=X";
  if (s === "GBPUSD") return "GBPUSD=X";

  /* -------- COMMODITIES -------- */

  if (s === "GOLD") return "GC=F";
  if (s === "SILVER") return "SI=F";
  if (s === "CRUDE" || s === "CRUDEOIL") return "CL=F";
  if (s === "NATURALGAS") return "NG=F";

  /* -------- INDEX -------- */

  if (s === "NIFTY") return "^NSEI";
  if (s === "SENSEX") return "^BSESN";

  /* -------- DEFAULT NSE STOCK -------- */

  return `${s}.NS`;

}

module.exports = { resolveSymbol };