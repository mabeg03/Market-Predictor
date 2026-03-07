
const stockMap = {
  "hdfc": "HDFCBANK.NS",
  "hdfcbank": "HDFCBANK.NS",
  "reliance": "RELIANCE.NS",
  "tcs": "TCS.NS",
  "infosys": "INFY.NS",
  "zomato": "ZOMATO.NS",
  "sbi": "SBIN.NS",
  "icici": "ICICIBANK.NS",
  "icicibank": "ICICIBANK.NS",
  "tata motors": "TATAMOTORS.NS",
  "tatamotors": "TATAMOTORS.NS",
  "wipro": "WIPRO.NS"
};

const cryptoMap = {
  "btc": "BTC-USD",
  "bitcoin": "BTC-USD",
  "eth": "ETH-USD",
  "ethereum": "ETH-USD",
  "doge": "DOGE-USD"
};

function resolveSymbol(input) {

  const key = input.trim().toLowerCase();

  if (cryptoMap[key]) return cryptoMap[key];

  if (stockMap[key]) return stockMap[key];

  if (/^[0-9]{5,6}$/.test(input)) return input + ".BO";

  return input.toUpperCase();

}

module.exports = { resolveSymbol };