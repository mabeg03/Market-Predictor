require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const { resolveSymbol } = require("./symbolResolver");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

/* --------------------------------
   FETCH YAHOO DATA
-------------------------------- */

async function fetchYahoo(symbol) {

  try {

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;

    const r = await axios.get(url);

    const result = r.data.chart.result?.[0];

    if (!result) return null;

    const q = result.indicators.quote[0];

    const closes = (q.close || []).filter(v => v !== null);

    if (!closes.length) return null;

    const current = closes[closes.length - 1];
    const prev = result.meta.previousClose || current;

    return {
      symbol,
      current,
      previousClose: prev,
      open: q.open?.[0],
      high: Math.max(...q.high.filter(Boolean)),
      low: Math.min(...q.low.filter(Boolean)),
      change: current - prev,
      changePct: ((current - prev) / prev) * 100
    };

  } catch (err) {

    console.log("Yahoo error:", err.message);
    return null;

  }

}

/* --------------------------------
   FETCH MARKET
-------------------------------- */

async function fetchMarket(userInput) {

  const symbol = resolveSymbol(userInput);

  console.log("Fetching:", symbol);

  const data = await fetchYahoo(symbol);

  if (!data) return null;

  let market = "GLOBAL";

  if (symbol.includes(".NS")) market = "NSE";
  if (symbol.includes(".BO")) market = "BSE";
  if (symbol.includes("-USD")) market = "CRYPTO";

  return {
    market,
    ...data
  };

}

/* --------------------------------
   QUOTE API
-------------------------------- */

app.get("/api/quote/:symbol", async (req, res) => {

  try {

    const data = await fetchMarket(req.params.symbol);

    if (!data)
      return res.status(404).json({ error: "No data found" });

    res.json(data);

  } catch (err) {

    res.status(500).json({
      error: "Quote failed",
      details: err.message
    });

  }

});

/* --------------------------------
   AI PREDICTION API
-------------------------------- */

app.post("/api/predict", async (req, res) => {

  try {

    const d = await fetchMarket(req.body.symbol);

    if (!d || !d.current)
      return res.status(500).json({
        error: "No data for prediction"
      });

    const price = Number(d.current);
    const prev = Number(d.previousClose);

    const pct = ((price - prev) / prev) * 100;

    let trend = "Neutral";
    let signal = "HOLD";
    let advice = "Market is stable. Wait for clearer signals.";

    if (pct > 0.5) {
      trend = "Bullish";
      signal = "BUY";
      advice = "Momentum is positive. Buying opportunity may exist.";
    }

    if (pct < -0.5) {
      trend = "Bearish";
      signal = "SELL";
      advice = "Momentum is weakening. Consider selling or avoiding entry.";
    }

    const confidence =
      Math.abs(pct) > 1 ? "High" :
      Math.abs(pct) > 0.5 ? "Medium" :
      "Low";

    res.json({
      asset: d.symbol,
      currentPrice: price,

      prediction1Day: (price * (1 + pct / 250)).toFixed(2),
      prediction1Week: (price * (1 + pct / 90)).toFixed(2),
      prediction1Month: (price * (1 + pct / 40)).toFixed(2),

      trend: trend,
      signal: signal,
      advice: advice,
      confidence: confidence,

      source: d.market
    });

  } catch (err) {

    res.status(500).json({
      error: "Prediction failed",
      details: err.message
    });

  }

});

/* --------------------------------
   OHLC API
-------------------------------- */

app.get("/api/ohlc/:symbol", async (req, res) => {

  try {

    const symbol = resolveSymbol(req.params.symbol);

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=15m`;

    const r = await axios.get(url);

    const result = r.data.chart.result?.[0];

    if (!result) return res.json([]);

    const q = result.indicators.quote[0];
    const t = result.timestamp;

    const candles = t.map((time, i) => ({
      time: time * 1000,
      open: q.open[i],
      high: q.high[i],
      low: q.low[i],
      close: q.close[i]
    }));

    res.json(candles);

  } catch {

    res.json([]);

  }

});

/* --------------------------------
   START SERVER
-------------------------------- */

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);