require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const ti = require("technicalindicators");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

/* ---------------- SYMBOL RESOLVER ---------------- */

async function resolveSymbol(input){

if(!input) return null;

const s = input.trim().toUpperCase();

if(
s.includes(".NS") ||
s.includes(".BO") ||
s.includes("-USD") ||
s.includes("=X")
){
return s;
}

try{
const r = await axios.get(
`https://query1.finance.yahoo.com/v1/finance/search?q=${s}&quotesCount=1`,
{ timeout:10000, headers:{'User-Agent':'Mozilla/5.0'} }
);

if(r.data.quotes?.length){
return r.data.quotes[0].symbol;
}
}catch(err){
console.log("SYMBOL ERROR:",err.message);
}

return s;
}

/* ---------------- QUOTE ---------------- */

async function fetchQuote(symbol){

try{
const r = await axios.get(
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=5m`,
{ timeout:10000, headers:{'User-Agent':'Mozilla/5.0'} }
);

const result = r.data?.chart?.result?.[0];
if(!result) return null;

const quote = result.indicators?.quote?.[0];
if(!quote) return null;

const closes = (quote.close || []).filter(v=>v!==null);
if(!closes.length) return null;

const price = closes[closes.length-1];
const prev = result.meta?.previousClose || price;

return{
symbol,
current:price,
change:price-prev,
changePct:((price-prev)/prev)*100
};

}catch(err){
console.log("QUOTE ERROR:",err.message);
return null;
}
}

/* ---------------- QUOTE API ---------------- */

app.get("/api/quote/:symbol", async(req,res)=>{
try{
const resolved = await resolveSymbol(req.params.symbol);
const data = await fetchQuote(resolved);

if(!data) return res.status(500).json({error:"Quote failed"});

res.json(data);

}catch(err){
res.status(500).json({error:"Quote failed"});
}
});

/* ---------------- PREDICTION ENGINE (PRO) ---------------- */

app.post("/api/predict", async(req,res)=>{

try{

const resolved = await resolveSymbol(req.body.symbol);

/* FETCH DATA */

const r = await axios.get(
`https://query1.finance.yahoo.com/v8/finance/chart/${resolved}?range=6mo&interval=1d`,
{ timeout:10000, headers:{'User-Agent':'Mozilla/5.0'} }
);

const result = r.data.chart.result[0];
const quote = result.indicators.quote[0];

/* CLEAN DATA */

const closes=[], highs=[], lows=[], volumes=[];

for(let i=0;i<quote.close.length;i++){
if(quote.close[i]!=null){
closes.push(quote.close[i]);
highs.push(quote.high[i]);
lows.push(quote.low[i]);
volumes.push(quote.volume[i] || 0);
}
}

/* INDICATORS */

const rsi = ti.RSI.calculate({period:14,values:closes});
const macd = ti.MACD.calculate({values:closes,fastPeriod:12,slowPeriod:26,signalPeriod:9});
const sma50 = ti.SMA.calculate({period:50,values:closes});
const sma200 = ti.SMA.calculate({period:200,values:closes});
const atr = ti.ATR.calculate({high:highs,low:lows,close:closes,period:14});

/* VALUES */

const price = closes[closes.length-1];
const latestRSI = rsi.at(-1) ?? 50;
const latestMACD = macd.at(-1) ?? {MACD:0,signal:0};
const ma50 = sma50.at(-1) ?? price;
const ma200 = sma200.at(-1) ?? price;
const latestATR = atr.at(-1) ?? 0;

/* SCORE */

let score=0;

if(latestRSI<35) score+=15;
if(latestRSI>70) score-=15;

if(latestMACD.MACD>latestMACD.signal) score+=20;
else score-=20;

if(price>ma50) score+=20;
else score-=20;

if(price>ma200) score+=20;
else score-=20;

/* SIGNAL LOGIC */

let signal="HOLD";

if(score>30) signal="STRONG BUY";
else if(score>10) signal="BUY";
else if(score<-30) signal="STRONG SELL";
else if(score<-10) signal="SELL";

/* CONFIDENCE */

let confidence = Math.min(100, Math.abs(score)*2);

/* QUALITY */

let quality="LOW";
if(confidence>75) quality="HIGH";
else if(confidence>55) quality="MEDIUM";

/* RESPONSE */

res.json({
symbol:resolved,
current:price,
signal,
trend: score>0?"BULLISH":score<0?"BEARISH":"SIDEWAYS",
confidence,
modelAccuracy: 65,
mlSignal: signal,
volatility: latestATR.toFixed(2),
system:"TradeDeck AI PRO",
quality
});

}catch(err){
console.log(err);
res.status(500).json({error:"Prediction failed"});
}

});

/* ---------------- START ---------------- */

app.listen(PORT,()=>{
console.log("Server running on "+PORT);
});