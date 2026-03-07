import { useState, useEffect } from "react";

const API_BASE = "https://tradedeck-ltby.onrender.com";

/* ---------- STYLES ---------- */

const styles = `
body{
margin:0;
font-family:Arial, sans-serif;
background:#020c12;
color:#e6eef6;
}

:root{
--cyan:#00d4ff;
--green:#00e676;
--red:#ff4444;
--bg:#020c12;
--bg2:#071420;
--bg3:#0d1f2d;
--border:rgba(0,212,255,0.15);
}

/* MOBILE SIDEBAR */

.mobile-sidebar{
position:fixed;
top:0;
left:0;
width:260px;
height:100vh;
background:#071420;
border-right:1px solid var(--border);
padding:20px;
z-index:1000;
transform:translateX(-100%);
transition:.3s;
}

.mobile-sidebar.open{
transform:translateX(0);
}

.logo{
font-size:22px;
font-weight:bold;
color:#00d4ff;
margin-bottom:20px;
}

.search-row{
display:flex;
gap:6px;
}

.search-input{
flex:1;
padding:8px;
border-radius:6px;
border:1px solid var(--border);
background:#0d1f2d;
color:white;
}

.predict-btn{
background:#00d4ff;
border:none;
border-radius:6px;
padding:8px 12px;
font-weight:bold;
cursor:pointer;
}

.watch-item{
padding:8px;
border-bottom:1px solid var(--border);
cursor:pointer;
}

/* HAMBURGER */

.hamburger{
position:fixed;
top:18px;
left:18px;
width:42px;
height:42px;
background:#00d4ff;
border:none;
border-radius:8px;
cursor:pointer;
display:none;
z-index:1100;
}

/* MAIN */

.main{
padding:40px;
max-width:1100px;
}

.title{
font-size:32px;
margin-bottom:30px;
}

.card{
background:#071420;
border:1px solid var(--border);
border-radius:10px;
padding:20px;
margin-bottom:20px;
}

.price{
font-size:34px;
color:#00d4ff;
}

.pos{color:#00e676}
.neg{color:#ff4444}

/* MOBILE */

@media(max-width:900px){

.main{
padding:80px 20px 20px;
}

.hamburger{
display:block;
}

}
`;

/* ---------- COMPONENT ---------- */

export default function AIMarketPredictor(){

const [symbol,setSymbol]=useState("");
const [quote,setQuote]=useState<any>(null);
const [prediction,setPrediction]=useState<any>(null);
const [error,setError]=useState("");
const [loading,setLoading]=useState(false);
const [watchlist,setWatchlist]=useState<string[]>([]);
const [sidebarOpen,setSidebarOpen]=useState(false);

useEffect(()=>{

const style=document.createElement("style");
style.innerHTML=styles;
document.head.appendChild(style);

return()=>document.head.removeChild(style);

},[]);

/* API */

async function handlePredict(){

if(!symbol) return;

setSidebarOpen(false);

try{

setLoading(true);
setError("");

const sym=symbol.trim().toUpperCase();

if(!watchlist.includes(sym)){
setWatchlist(prev=>[...prev,sym]);
}

const quoteRes=await fetch(`${API_BASE}/api/quote/${sym}`);

if(!quoteRes.ok) throw new Error("Quote API failed");

const quoteData=await quoteRes.json();

setQuote(quoteData);

const predRes=await fetch(`${API_BASE}/api/predict`,{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({symbol:sym})
});

const predData=await predRes.json();

setPrediction(predData);

}
catch(e:any){
setError(e.message);
}
finally{
setLoading(false);
}

}

function fmt(v:any){
if(v==null) return "—";
return Number(v).toLocaleString(undefined,{maximumFractionDigits:2});
}

const isPos=quote && Number(quote.change)>=0;

return(

<>

<button
className="hamburger"
onClick={()=>setSidebarOpen(!sidebarOpen)}
>
☰
</button>

{/* MOBILE SIDEBAR */}

<div className={`mobile-sidebar ${sidebarOpen?"open":""}`}>

<div className="logo">TradeDeck</div>

<div className="search-row">

<input
className="search-input"
placeholder="Add symbol"
value={symbol}
onChange={(e)=>setSymbol(e.target.value)}
/>

<button
className="predict-btn"
onClick={handlePredict}
>
Run
</button>

</div>

<div style={{marginTop:20}}>

{watchlist.map(sym=>(

<div
key={sym}
className="watch-item"
onClick={()=>{

setSymbol(sym);
handlePredict();
setSidebarOpen(false);

}}
>
{sym}
</div>

))}

</div>

</div>

{/* MAIN */}

<main className="main">

<div className="title">AI Market Predictor</div>

{error && <div>{error}</div>}

{quote && (

<div className="card">

<h2>{quote.symbol}</h2>

<div className="price">₹{fmt(quote.current)}</div>

<div className={isPos?"pos":"neg"}>
{isPos?"▲":"▼"} {fmt(quote.change)}
</div>

</div>

)}

{prediction && (

<div className="card">

<h3>AI Prediction</h3>

<div><b>Trend:</b> {prediction.trend || "—"}</div>
<div><b>Signal:</b> {prediction.signal || "—"}</div>
<div><b>Confidence:</b> {prediction.confidence || "—"}</div>
<div><b>Advice:</b> {prediction.advice || "—"}</div>

</div>

)}

</main>

</>

);

}
