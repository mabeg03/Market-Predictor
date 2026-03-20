import {
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts";

import { useState } from "react";
import { trendingStocks } from "./trendingStocks";
import { searchSymbol, stockDB } from "./symbolDatabase";
import "./AIMarketPredictor.css";

const API_BASE = "https://tradedeck-ltby.onrender.com";

export default function AIMarketPredictor(){

const [symbol,setSymbol] = useState("");
const [quote,setQuote] = useState<any>(null);
const [prediction,setPrediction] = useState<any>(null);

const [history,setHistory] = useState<{time:string,price:number}[]>([]);

const [suggestions,setSuggestions] = useState<any[]>([]);
const [showSuggestions,setShowSuggestions] = useState(false);

const [loading,setLoading] = useState(false);
const [error,setError] = useState<string | null>(null);


/* SEARCH */

function handleChangeInput(value:string){

setSymbol(value);

const q=value.trim();

if(!q){
setSuggestions(trendingStocks);
setShowSuggestions(true);
return;
}

const found = searchSymbol(q).slice(0,12);

setSuggestions(found);
setShowSuggestions(found.length>0);

}


/* PREDICT */

async function handlePredict(){

if(!symbol) return;

setPrediction(null);
setError(null);
setLoading(true);

let sym = symbol.trim().toUpperCase();

const found = stockDB.find(s=>s.symbol===sym);

if(found){
if(found.exchange==="NSE") sym=sym+".NS";
if(found.exchange==="BSE") sym=sym+".BO";
if(found.exchange==="CRYPTO") sym=sym+"-USD";
}

try{

const quoteRes = await fetch(`${API_BASE}/api/quote/${sym}`);
const quoteData = await quoteRes.json();

if(!quoteRes.ok){
setError("Quote failed");
setLoading(false);
return;
}

setQuote(quoteData);

const predRes = await fetch(`${API_BASE}/api/predict`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({symbol:sym})
});

const predData = await predRes.json();

if(!predRes.ok){
setError(predData.error || "Prediction failed");
setLoading(false);
return;
}

setPrediction(predData);

setHistory(prev=>[
...prev.slice(-29),
{
time:new Date().toLocaleTimeString(),
price:quoteData.current
}
]);

}catch{
setError("Network error");
}finally{
setLoading(false);
}

}


/* FORMAT */

function fmt(v:any){
const num = Number(v);
if(isNaN(num)) return "-";
return num.toLocaleString(undefined,{maximumFractionDigits:2});
}

const isPos = quote && quote.change>=0;


/* UI */

return(

<div className="predictor-root">

<h1 className="predictor-title">
TradeDeck AI Predictor
</h1>


<div className="predictor-search-row">

<input
className="predictor-search-input"
placeholder="Search stocks, crypto, forex..."
value={symbol}
onChange={(e)=>handleChangeInput(e.target.value)}
onFocus={()=>setShowSuggestions(true)}
onBlur={()=>setTimeout(()=>setShowSuggestions(false),200)}
/>

<button
className="predictor-search-button"
onClick={handlePredict}
disabled={loading}
>
{loading ? "Analyzing..." : "Predict"}
</button>

{showSuggestions && suggestions.length>0 && (

<div className="predictor-suggestion-card">

{suggestions.map((s:any,i)=>{

const sym = s.symbol || s;

return(

<div
key={i}
className="predictor-suggestion-item"
onMouseDown={()=>{
setSymbol(sym);
setShowSuggestions(false);
}}
>

<div className="suggestion-symbol">
{sym}
</div>

{s.name && (
<div className="suggestion-company">
{s.name}
</div>
)}

</div>

);

})}

</div>

)}

</div>


{error && (
<div className="predictor-card predictor-error">
{error}
</div>
)}


{quote && (

<div className="predictor-card">

<h2>{quote.symbol}</h2>

<div className="predictor-price">
{fmt(quote.current)}
</div>

<div className={isPos ? "pos":"neg"}>
{isPos ? "▲":"▼"} {fmt(quote.change)}
</div>

</div>

)}


{prediction && (

<div className="predictor-card">

<h3>AI Prediction</h3>

{/* Signal */}
<div className="predictor-row">
<span>Signal</span>
<b style={{
color:
prediction?.signal?.includes("BUY")
? "#22c55e"
: prediction?.signal?.includes("SELL")
? "#ef4444"
: "#facc15"
}}>
{prediction?.signal || "-"}
</b>
</div>

{/* Trend */}
<div className="predictor-row">
<span>Trend</span>
<b>{prediction?.trend || "-"}</b>
</div>

{/* Confidence */}
<div className="predictor-row">
<span>Confidence</span>
<b>{prediction?.confidence ? prediction.confidence + "%" : "-"}</b>
</div>

{/* Accuracy */}
<div className="predictor-row">
<span>Model Accuracy</span>
<b>{prediction?.modelAccuracy ? prediction.modelAccuracy + "%" : "-"}</b>
</div>

{/* ML Signal */}
<div className="predictor-row">
<span>ML Signal</span>
<b>{prediction?.mlSignal || "-"}</b>
</div>

{/* Volatility */}
<div className="predictor-row">
<span>Volatility</span>
<b>{prediction?.volatility || "-"}</b>
</div>

{/* Quality (NEW) */}
<div className="predictor-row">
<span>Quality</span>
<b style={{
color:
prediction?.quality === "HIGH"
? "#22c55e"
: prediction?.quality === "MEDIUM"
? "#facc15"
: "#ef4444"
}}>
{prediction?.quality || "-"}
</b>
</div>

{/* System */}
<div className="predictor-row">
<span>System</span>
<b>{prediction?.system || "-"}</b>
</div>

{/* AI Insight */}
<div className="predictor-section">
<h4>🧠 AI Insight</h4>
<ul>
<li>Trend indicates {prediction?.trend || "unknown"} market</li>
<li>Signal suggests {prediction?.signal || "no action"}</li>
<li>Confidence level is {prediction?.confidence || "-"}%</li>
<li>Trade quality: {prediction?.quality || "-"}</li>
</ul>
</div>

{/* Warning */}
<div className="predictor-warning">
<h4>⚠️ Risk Factors</h4>
<ul>
<li>Market volatility may affect outcome</li>
<li>External news not included</li>
<li>Short-term predictions may vary</li>
</ul>
</div>

</div>

)}

<p className="predictor-disclaimer">
This app is for educational purposes only. Not financial advice.
</p>

</div>

);

}