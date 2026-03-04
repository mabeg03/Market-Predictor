require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const serverless = require("serverless-http");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// ENV values
const NSE_URL = process.env.NSE_WORKER_URL || "";
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

/* ----------------------------------------------------
   DETECT MARKET
---------------------------------------------------- */
function detectMarket(symbol) {
  const s = symbol.trim().toUpperCase();

  // If numeric 5 or 6 digits → BSE
  if (/^[0-9]{5,6}$/.test(s)) return "BSE";

  // NSE if pure alphabets
  if (/^[A-Z]+$/.test(s)) return "NSE";

  if (s.includes("/")) return "FOREX";

  if (["BTC", "ETH", "DOGE"].includes(s)) return "CRYPTO";

  if (["GOLD", "SILVER", "XAU", "XAG", "OIL"].includes(s))
    return "COMMODITY";

  return "GLOBAL";
}

/* ----------------------------------------------------
   FETCH NSE (Worker)
---------------------------------------------------- */
async function fetchNSE(symbol) {
  if (!NSE_URL) return null;

  try {
    const url = `${NSE_URL}/quote/${symbol}`;
    const r = await axios.get(url, { timeout: 15000 });
    const d = r.data;

    if (!d?.priceInfo) return null;

    const p = d.priceInfo;

    return {
      market: "NSE",
      symbol,
      current: p.lastPrice,
      previousClose: p.previousClose,
      change: p.change,
      changePct: p.pChange,
      open: p.open,
      high: p.intraDayHighLow?.max,
      low: p.intraDayHighLow?.min
    };
  } catch (err) {
    console.log("NSE ERROR:", err.message);
    return null;
  }
}

/* ----------------------------------------------------
   FETCH BSE (Yahoo Finance)
---------------------------------------------------- */
async function fetchBSE(symbol) {
  try {
    const yahooSymbol = `${symbol}.BO`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=1m`;

    console.log("Fetching BSE (Yahoo):", url);

    const r = await axios.get(url, { timeout: 15000 });
    const data = r.data.chart.result?.[0];
    if (!data) return null;

    const meta = data.meta;
    const current = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const prices = data.indicators.quote[0];

    const open = prices.open[0];
    const high = Math.max(...prices.high.filter(Boolean));
    const low = Math.min(...prices.low.filter(Boolean));

    // FIX: Auto fallback when previousClose missing
    const prev = prevClose || open || current;

    return {
      market: "BSE",
      symbol,
      current,
      previousClose: prev,
      open,
      high,
      low,
      change: current - prev,
      changePct: prev ? ((current - prev) / prev) * 100 : 0
    };

  } catch (err) {
    console.log("Yahoo BSE ERROR:", err.message);
    return null;
  }
}


/* ----------------------------------------------------
   FETCH GLOBAL / CRYPTO / FOREX — Finnhub
---------------------------------------------------- */
async function fetchGlobal(symbol) {
  if (!FINNHUB_KEY) return null;

  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;

  try {
    const r = await axios.get(url);
    const d = r.data;

    if (!d || d.c === undefined) return null;

    return {
      market: "GLOBAL",
      symbol,
      current: d.c,
      previousClose: d.pc,
      open: d.o,
      high: d.h,
      low: d.l,
      change: d.c - d.pc,
      changePct: ((d.c - d.pc) / (d.pc || 1)) * 100
    };
  } catch (err) {
    console.log("GLOBAL ERROR:", err.message);
    return null;
  }
}

/* ----------------------------------------------------
   MASTER MARKET FETCHER
---------------------------------------------------- */
async function fetchMarket(symbol) {
  const s = symbol.toUpperCase();
  const m = detectMarket(s);

  // BSE (numeric scripcode)
  if (m === "BSE") {
    const b = await fetchBSE(s);
    if (b) return b;
    return { market: "BSE", symbol: s, current: 0 };
  }

  // NSE
  if (m === "NSE") {
    const n = await fetchNSE(s);
    if (n) return n;
  }

  // COMMODITIES
  if (m === "COMMODITY") return await fetchGlobal(s);

  // CRYPTO
  if (m === "CRYPTO") {
    const map = {
      BTC: "BINANCE:BTCUSDT",
      ETH: "BINANCE:ETHUSDT",
      DOGE: "BINANCE:DOGEUSDT"
    };
    return await fetchGlobal(map[s]);
  }

  // FOREX
  if (m === "FOREX") {
    return await fetchGlobal(`OANDA:${s.replace("/", "")}`);
  }

  // FALLBACK → global
  return await fetchGlobal(s);
}

/* ----------------------------------------------------
   API: QUOTE
---------------------------------------------------- */
app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const sym = req.params.symbol;
    const data = await fetchMarket(sym);
    if (!data) return res.status(500).json({ error: "No data found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Quote failed", details: err.message });
  }
});

/* ----------------------------------------------------
   API: PREDICT
---------------------------------------------------- */
app.post("/api/predict", async (req, res) => {
  try {
    const sym = req.body.symbol;
    const d = await fetchMarket(sym);
    if (!d || !d.current) return res.status(500).json({ error: "No data for prediction" });

    const price = Number(d.current);
    const prev = Number(d.previousClose) || (price - Number(d.change || 0));

    const pct = ((price - prev) / prev) * 100;

    res.json({
      asset: sym,
      currentPrice: price,
      prediction1Day: (price * (1 + pct / 250)).toFixed(2),
      prediction1Week: (price * (1 + pct / 90)).toFixed(2),
      prediction1Month: (price * (1 + pct / 40)).toFixed(2),
      trend: pct >= 0 ? "Bullish" : "Bearish",
      confidence: Math.abs(pct) > 0.4 ? "High" : "Medium",
      source: d.market
    });
  } catch (err) {
    res.status(500).json({ error: "Prediction failed", details: err.message });
  }
});

/* ----------------------------------------------------
   API: OHLC (via Finnhub)
---------------------------------------------------- */
app.get("/api/ohlc/:symbol", async (req, res) => {
  try {
    if (!FINNHUB_KEY) return res.json([]);
    const symbol = req.params.symbol.toUpperCase();
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=15&count=80&token=${FINNHUB_KEY}`;

    const r = await axios.get(url);
    const d = r.data;

    if (d.s !== "ok") return res.json([]);

    const candles = d.t.map((t, i) => ({
      time: t * 1000,
      open: d.o[i],
      high: d.h[i],
      low: d.l[i],
      close: d.c[i]
    }));

    res.json(candles);
  } catch {
    res.json([]);
  }
});

/* ----------------------------------------------------
   START SERVER
---------------------------------------------------- */
module.exports = serverless(app);