export const stockDB = [
  // NSE
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },

  // ETFs
  { symbol: "SETFGOLD", name: "SBI Gold ETF", exchange: "NSE" },
  { symbol: "NIFTYBEES", name: "Nippon India Nifty 50 ETF", exchange: "NSE" },

  // Indices
  { symbol: "NIFTY50", name: "NIFTY 50 Index", exchange: "INDEX" },
  { symbol: "BANKNIFTY", name: "NIFTY BANK Index", exchange: "INDEX" },

  // Commodities
  { symbol: "GOLD", name: "Gold Spot", exchange: "COM" },
  { symbol: "SILVER", name: "Silver Spot", exchange: "COM" },
  { symbol: "OIL", name: "Crude Oil", exchange: "COM" },

  // Crypto
  { symbol: "BTC", name: "Bitcoin", exchange: "CRYPTO" },
  { symbol: "ETH", name: "Ethereum", exchange: "CRYPTO" },
  { symbol: "DOGE", name: "Dogecoin", exchange: "CRYPTO" },

  // BSE Scripcodes
  { symbol: "540614", name: "GG Engineering Ltd", exchange: "BSE" },
  { symbol: "500325", name: "Reliance Industries", exchange: "BSE" },
  { symbol: "500209", name: "Infosys Ltd", exchange: "BSE" },
  { symbol: "532540", name: "TCS", exchange: "BSE" },
];

export function searchSymbol(q: string) {
  q = q.toLowerCase().trim();
  if (!q) return [];

  return stockDB.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
  );
}
