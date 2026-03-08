require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;


/* --------------------------------
   AUTO SYMBOL RESOLVER
-------------------------------- */

async function resolveSymbol(input){

if(!input) return "AAPL";

const s = input.trim().toUpperCase();

/* TRY NSE FIRST */

const nseSymbol = `${s}.NS`;

try{

const testUrl =
`https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}?range=1d&interval=1d`;

const r = await axios.get(testUrl);

if(r.data.chart?.result){
return nseSymbol;
}

}catch{}

/* FALLBACK TO YAHOO SEARCH */

try{

const url =
`https://query1.finance.yahoo.com/v1/finance/search?q=${s}&quotesCount=1&newsCount=0`;

const r = await axios.get(url);

const quotes = r.data.quotes;

if(quotes && quotes.length){
return quotes[0].symbol;
}

}catch{}

return null;

}


/* --------------------------------
   FETCH MARKET DATA
-------------------------------- */

async function fetchYahoo(symbol){

try{

const url =
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;

const r = await axios.get(url,{
headers:{
"User-Agent":"Mozilla/5.0"
}
});

const result = r.data.chart?.result?.[0];

if(!result) return null;

const quote = result.indicators?.quote?.[0];

if(!quote) return null;

const closes = (quote.close || []).filter(v=>v!==null);

if(!closes.length) return null;

const highs = (quote.high || []).filter(v=>v!==null);
const lows = (quote.low || []).filter(v=>v!==null);

const current = closes[closes.length-1];

const prev = result.meta?.previousClose || current;

return{

symbol,

current,

previousClose: prev,

open: quote.open?.[0] || current,

high: highs.length ? Math.max(...highs) : current,

low: lows.length ? Math.min(...lows) : current,

change: current - prev,

changePct: ((current-prev)/prev)*100

};

}catch(err){

console.log("Yahoo error:",err.message);

return null;

}

}


/* --------------------------------
   FETCH MARKET
-------------------------------- */

async function fetchMarket(input){

const symbol = await resolveSymbol(input);

if(!symbol) return null;

console.log("Resolved:",symbol);

const data = await fetchYahoo(symbol);

if(!data) return null;

let market = "GLOBAL";

if(symbol.includes(".NS")) market = "NSE";
if(symbol.includes(".BO")) market = "BSE";
if(symbol.includes("-USD")) market = "CRYPTO";
if(symbol.includes("=X")) market = "FOREX";
if(symbol.includes("=F")) market = "COMMODITY";

return{
market,
...data
};

}


/* --------------------------------
   QUOTE API
-------------------------------- */

app.get("/api/quote/:symbol", async(req,res)=>{

try{

const data = await fetchMarket(req.params.symbol);

if(!data)
return res.status(404).json({error:"No data found"});

res.json(data);

}catch(err){

res.status(500).json({
error:"Quote failed",
details:err.message
});

}

});


/* --------------------------------
   PREDICTION API
-------------------------------- */

app.post("/api/predict", async(req,res)=>{

try{

const d = await fetchMarket(req.body.symbol);

if(!d)
return res.status(500).json({error:"No data"});

const price = Number(d.current);
const prev = Number(d.previousClose);

const pct = ((price-prev)/prev)*100;

let trend="Neutral";
let signal="HOLD";
let advice="Market is stable.";

if(pct>0.5){
trend="Bullish";
signal="BUY";
advice="Momentum is positive.";
}

if(pct<-0.5){
trend="Bearish";
signal="SELL";
advice="Momentum is weakening.";
}

res.json({

asset:d.symbol,

currentPrice:price,

prediction1Day:(price*(1+pct/250)).toFixed(2),

prediction1Week:(price*(1+pct/90)).toFixed(2),

prediction1Month:(price*(1+pct/40)).toFixed(2),

trend,
signal,
advice,

confidence:
Math.abs(pct)>1?"High":
Math.abs(pct)>0.5?"Medium":
"Low",

source:d.market

});

}catch(err){

res.status(500).json({
error:"Prediction failed",
details:err.message
});

}

});


/* --------------------------------
   OHLC CANDLES
-------------------------------- */

app.get("/api/ohlc/:symbol", async(req,res)=>{

try{

const symbol = await resolveSymbol(req.params.symbol);

if(!symbol) return res.json([]);

const url =
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=15m`;

const r = await axios.get(url);

const result = r.data.chart.result?.[0];

if(!result) return res.json([]);

const q = result.indicators.quote[0];
const t = result.timestamp;

const candles = t.map((time,i)=>({

time:time*1000,

open:q.open[i],

high:q.high[i],

low:q.low[i],

close:q.close[i]

}));

res.json(candles);

}catch{

res.json([]);

}

});


/* --------------------------------
   SEARCH API
-------------------------------- */

app.get("/api/search/:query", async(req,res)=>{

try{

const url =
`https://query1.finance.yahoo.com/v1/finance/search?q=${req.params.query}&quotesCount=10&newsCount=0`;

const r = await axios.get(url);

const quotes = r.data.quotes || [];

const results = quotes.map(q=>({

symbol:q.symbol,

name:q.shortname || q.longname || "",

exchange:q.exchange || "",

type:q.quoteType

}));

res.json(results);

}catch{

res.json([]);

}

});


/* --------------------------------
   START SERVER
-------------------------------- */

app.listen(PORT, ()=>{

console.log(`Server running on http://localhost:${PORT}`);

});