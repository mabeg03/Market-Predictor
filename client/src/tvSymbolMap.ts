export function mapToTradingView(symbol: string) {
  symbol = symbol.toUpperCase().trim();

  // NSE Direct Equities & ETFs
  if (/^[A-Z]{2,}$/.test(symbol)) return `NSE:${symbol}`;

  // BSE (numeric scrip codes)
  if (/^\d{5,6}$/.test(symbol)) return `BSE:${symbol}`;

  // Forex
  if (symbol.includes("/")) {
    const [a, b] = symbol.split("/");
    return `OANDA:${a}${b}`;
  }

  // Crypto
  const cryptoMap: Record<string, string> = {
    BTC: "BINANCE:BTCUSDT",
    ETH: "BINANCE:ETHUSDT",
    DOGE: "BINANCE:DOGEUSDT",
  };
  if (cryptoMap[symbol]) return cryptoMap[symbol];

  // Commodities (TradingView standard)
  const commodityMap: Record<string, string> = {
    GOLD: "OANDA:XAUUSD",
    XAU: "OANDA:XAUUSD",
    SILVER: "OANDA:XAGUSD",
    XAG: "OANDA:XAGUSD",
    OIL: "TVC:USOIL",
  };
  if (commodityMap[symbol]) return commodityMap[symbol];

  // US Stocks fallback
  return `NASDAQ:${symbol}`;
}
