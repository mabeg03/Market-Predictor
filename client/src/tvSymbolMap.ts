export function mapToTradingView(symbol: string) {
  symbol = symbol.toUpperCase().trim();

  // Explicit commodity tickers (global)
  if (symbol === "XAUUSD") return "OANDA:XAUUSD";
  if (symbol === "XAGUSD") return "OANDA:XAGUSD";
  if (symbol === "GOLD" || symbol === "XAU") return "OANDA:XAUUSD";
  if (symbol === "SILVER" || symbol === "XAG") return "OANDA:XAGUSD";
  if (symbol === "OIL") return "TVC:USOIL";

  // NSE Direct Equities & ETFs (e.g. SETFGOLD, RELIANCE)
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

  // US Stocks fallback
  return `NASDAQ:${symbol}`;
}
