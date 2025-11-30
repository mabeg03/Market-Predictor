require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

const NSE_URL = process.env.NSE_WORKER_URL;
const BSE_URL = process.env.BSE_WORKER_URL;
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

/* ----------------------------------------------------
   MARKET TYPE DETECTOR
---------------------------------------------------- */
function detectMarket(symbol) {
  symbol = symbol.trim().toUpperCase();

  if (/^\d{5,6}$/.test(symbol)) return "bse";
  if (["GOLD", "XAU", "SILVER", "XAG", "OIL"].includes(symbol)) return "commodity";
  if (symbol.includes("/")) return "forex";
  if (["BTC", "ETH", "DOGE"].includes(symbol)) return "crypto";
  if (/^[A-Z]{2,}$/.test(symbol)) return "nse";

  return "global";
}

/* ----------------------------------------------------
   NSE (Cloudflare Worker)
---------------------------------------------------- */
async function fetchNSE(symbol) {
  if (!NSE_URL) return null;

  const url = `${NSE_URL}/quote/${symbol}`;
  console.log("Fetching NSE:", url);

  try {
    const r = await axios.get(url, { timeout: 15000 });
    const d = r.data;

    if (!d?.priceInfo) throw new Error("NSE priceInfo missing");

    const p = d.priceInfo;

    return {
      market: "NSE",
      symbol,
      current: p.lastPrice,
      previousClose: p.previousClose,
      change: p.change,
      changePct: p.pChange,
      open: p.open ?? null,
      high: p.intraDayHighLow?.max ?? null,
      low: p.intraDayHighLow?.min ?? null,
    };
  } catch (err) {
    console.log("NSE Failed:", err.message);
    return null;
  }
}

/* ----------------------------------------------------
   BSE (Cloudflare Worker)
---------------------------------------------------- */
async function fetchBSE(symbol) {
  if (!BSE_URL) return null;

  const url = `${BSE_URL}/quote/${symbol}`;
  console.log("Fetching BSE:", url);

  try {
    const r = await axios.get(url, { timeout: 15000 });

    if (!r.data?.Data?.length) throw new Error("Invalid BSE Data");
    const p = r.data.Data[0];

    return {
      market: "BSE",
      symbol,
      current: Number(p.LTP),
      previousClose: Number(p.PreviousClose),
      change: Number(p.Change),
      changePct: Number(p.PerChange),
      open: Number(p.Open) || null,
      high: Number(p.High) || null,
      low: Number(p.Low) || null,
    };
  } catch (err) {
    console.log("BSE Failed:", err.message);
    return null;
  }
}

/* ----------------------------------------------------
   COMMODITIES (Metals API)
---------------------------------------------------- */
async function fetchCommodity(symbol) {
  const map = {
    GOLD: "XAU",
    XAU: "XAU",
    SILVER: "XAG",
    XAG: "XAG",
    OIL: "OIL"
  };

  const id = map[symbol];
  const url = `https://metals-api-proxy.vercel.app/latest/${id}`;
  console.log("Fetching Commodity:", url);

  try {
    const r = await axios.get(url, { timeout: 15000 });
    const d = r.data;

    return {
      market: "COMMODITY",
      symbol: id,
      current: d.price,
      previousClose: d.previousClose ?? d.price - d.change,
      change: d.change,
      changePct: d.changePct,
      open: d.open ?? null,
      high: d.high ?? null,
      low: d.low ?? null,
    };
  } catch (err) {
    console.log("Commodity Failed:", err.message);
    return null;
  }
}

/* ----------------------------------------------------
   GLOBAL (Finnhub)
---------------------------------------------------- */
async function fetchGlobal(symbol) {
  if (!FINNHUB_KEY) return null;

  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
  console.log("Fetching Finnhub:", url);

  try {
    const r = await axios.get(url);
    const d = r.data;

    if (!d || d.c === 0) throw new Error("No data");

    return {
      market: "GLOBAL",
      symbol,
      current: d.c,
      previousClose: d.pc,
      open: d.o,
      high: d.h,
      low: d.l,
      change: d.c - d.pc,
      changePct: ((d.c - d.pc) / d.pc) * 100,
    };
  } catch (err) {
    console.log("Finnhub Failed:", err.message);
    return null;
  }
}

/* ----------------------------------------------------
   MASTER FETCH FUNCTION
---------------------------------------------------- */
async function fetchMarket(symbol) {
  symbol = symbol.toUpperCase();

  if (symbol === "SETFGOLD") {
    const etf = await fetchNSE("SETFGOLD");
    if (etf) return etf;
  }

  const type = detectMarket(symbol);

  if (type === "bse") {
    const b = await fetchBSE(symbol);
    if (b) return b;
  }

  if (type === "nse") {
    const n = await fetchNSE(symbol);
    if (n) return n;
  }

  if (type === "commodity") {
    const c = await fetchCommodity(symbol);
    if (c) return c;
  }

  if (type === "forex") {
    const [a, b] = symbol.split("/");
    return await fetchGlobal(`OANDA:${a}${b}`);
  }

  if (type === "crypto") {
    const map = {
      BTC: "BINANCE:BTCUSDT",
      ETH: "BINANCE:ETHUSDT",
      DOGE: "BINANCE:DOGEUSDT",
    };
    return await fetchGlobal(map[symbol]);
  }

  return await fetchGlobal(symbol);
}

/* ----------------------------------------------------
   QUOTE ROUTE
---------------------------------------------------- */
app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const data = await fetchMarket(req.params.symbol);

    if (!data) return res.status(500).json({ error: "No market data found" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Quote failed", details: err.message });
  }
});

/* ----------------------------------------------------
   🔥 FIXED PREDICTION (WORKS FOR BSE)
---------------------------------------------------- */
app.post("/api/predict", async (req, res) => {
  try {
    const { symbol } = req.body;

    const d = await fetchMarket(symbol);
    if (!d) return res.status(500).json({ error: "No data found" });

    // NORMALIZE ALL DATA SOURCES
    const price = Number(d.current ?? d.currentPrice ?? d.LTP);
    const prev =
      Number(d.previousClose ?? d.prevClose ?? d.PreviousClose ?? price - d.change);

    if (!price || !prev)
      return res.status(500).json({ error: "Price normalization failed" });

    const changePct = ((price - prev) / prev) * 100;

    const result = {
      asset: symbol,
      currentPrice: price,
      prediction1Day: (price * (1 + changePct / 250)).toFixed(2),
      prediction1Week: (price * (1 + changePct / 90)).toFixed(2),
      prediction1Month: (price * (1 + changePct / 40)).toFixed(2),
      trend: changePct > 0 ? "Bullish" : "Bearish",
      confidence: Math.abs(changePct) > 0.4 ? "High" : "Medium",
      source: d.market,
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Prediction failed", details: err.message });
  }
});

/* ----------------------------------------------------
   OHLC ROUTE FOR CANDLESTICKS
---------------------------------------------------- */
app.get("/api/ohlc/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let url;

    if (symbol.includes("/")) {
      url = `https://finnhub.io/api/v1/forex/candle?symbol=OANDA:${symbol.replace("/", "")}&resolution=15&count=80&token=${FINNHUB_KEY}`;
    } else {
      url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=15&count=80&token=${FINNHUB_KEY}`;
    }

    const r = await axios.get(url);
    if (r.data.s !== "ok") return res.json([]);

    const candles = r.data.t.map((t, i) => ({
      time: t * 1000,
      open: r.data.o[i],
      high: r.data.h[i],
      low: r.data.l[i],
      close: r.data.c[i],
    }));

    res.json(candles);
  } catch (err) {
    res.json([]);
  }
});

/* ----------------------------------------------------
   START SERVER
---------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`🔥 Market backend running on http://localhost:${PORT}`);
});
