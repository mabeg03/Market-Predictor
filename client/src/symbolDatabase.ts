// client/src/symbolDatabase.ts
// Minimal symbol DB — extend this list with more items to improve matching.
export const stockDB = [
  // NSE examples
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Ltd", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },

  // ETFs / Indexes
  { symbol: "SETFGOLD", name: "SBI Gold ETF", exchange: "NSE" },
  { symbol: "NIFTYBEES", name: "Nippon India Nifty 50 ETF", exchange: "NSE" },
  { symbol: "NIFTY50", name: "NIFTY 50 Index", exchange: "INDEX" },
  { symbol: "BANKNIFTY", name: "NIFTY BANK Index", exchange: "INDEX" },

  // Commodities & common aliases
  { symbol: "GOLD", name: "Gold Spot / XAU", exchange: "COMMODITY" },
  { symbol: "SILVER", name: "Silver Spot / XAG", exchange: "COMMODITY" },
  { symbol: "OIL", name: "Crude Oil", exchange: "COMMODITY" },

  // Crypto (common tickers)
  { symbol: "BTC", name: "Bitcoin", exchange: "CRYPTO" },
  { symbol: "ETH", name: "Ethereum", exchange: "CRYPTO" },

  // BSE numeric examples (scripcodes)
  { symbol: "540614", name: "GG Engineering Ltd", exchange: "BSE" },
  { symbol: "500325", name: "Reliance Industries", exchange: "BSE" },
  { symbol: "500209", name: "Infosys Ltd", exchange: "BSE" },
  { symbol: "532540", name: "TCS (BSE)", exchange: "BSE" }
];

export function searchSymbol(q: string) {
  const s = (q || "").toLowerCase().trim();
  if (!s) return [];
  return stockDB.filter(
    (it) =>
      it.symbol.toLowerCase().includes(s) ||
      it.name.toLowerCase().includes(s)
  );
}
