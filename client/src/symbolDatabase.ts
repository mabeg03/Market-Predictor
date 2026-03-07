import indianStocks from "./indianStocks.json";

export type StockEntry = {
  symbol: string
  name: string
  exchange: string
}

export const stockDB: StockEntry[] = [

  // US STOCKS
  { symbol: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon", exchange: "NASDAQ" },

  // CRYPTO
  { symbol: "BTC-USD", name: "Bitcoin", exchange: "CRYPTO" },
  { symbol: "ETH-USD", name: "Ethereum", exchange: "CRYPTO" },
  { symbol: "SOL-USD", name: "Solana", exchange: "CRYPTO" },

  // COMMODITIES
  { symbol: "GC=F", name: "Gold Futures", exchange: "COMMODITY" },
  { symbol: "SI=F", name: "Silver Futures", exchange: "COMMODITY" },

  // INDIAN STOCKS (NSE + BSE)
  ...indianStocks

]

// SEARCH FUNCTION
export function searchSymbol(query: string) {

  const q = query.toLowerCase()

  return stockDB.filter(
    s =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
  )

}