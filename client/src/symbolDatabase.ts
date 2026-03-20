import stocks from "./data/stocks.json"
import crypto from "./data/cryptoStocks.json"

export const stockDB = [...stocks,...crypto]

export function searchSymbol(query: string) {

  const q = query.toLowerCase();

  return stockDB.filter((stock: any) =>
    stock.symbol.toLowerCase().startsWith(q) ||
    stock.name.toLowerCase().includes(q)
  );

}