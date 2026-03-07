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
  --sidebar-w:260px;
}

/* SIDEBAR (MOBILE ONLY) */

.sidebar{
  position:fixed;
  top:0;
  left:0;
  width:var(--sidebar-w);
  height:100vh;
  background:var(--bg2);
  border-right:1px solid var(--border);
  padding:20px;
  transition:transform .3s;
  z-index:1000;

  display:none;
}

.sidebar.closed{
  transform:translateX(-100%);
}

.logo{
  font-size:22px;
  font-weight:bold;
  color:var(--cyan);
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
  background:var(--bg3);
  color:white;
}

.predict-btn{
  background:var(--cyan);
  border:none;
  border-radius:6px;
  padding:8px 12px;
  font-weight:bold;
  cursor:pointer;
}

.watchlist{
  margin-top:25px;
}

.watch-item{
  padding:8px;
  border-bottom:1px solid var(--border);
  cursor:pointer;
}

.watch-item:hover{
  background:rgba(0,212,255,0.1);
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
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:10px;
  padding:20px;
  margin-bottom:20px;
}

.price{
  font-size:34px;
  color:var(--cyan);
}

.pos{ color:var(--green); }
.neg{ color:var(--red); }

/* MOBILE */

@media(max-width:900px){

  .sidebar{
    display:block;
    transform:translateX(-100%);
  }

  .sidebar.open{
    transform:translateX(0);
  }

  .main{
    margin-left:0;
    padding:70px 20px 20px;
  }

  .hamburger{
    display:block;
  }

}
`;

/* ---------- SIDEBAR ---------- */

function Sidebar({watchlist,symbol,setSymbol,handlePredict,isOpen,onClose,loading}){

return(

<aside className={`sidebar ${isOpen?"open":"closed"}`}>

<div className="logo">TradeDeck</div>

<div className="search-row">

<input
className="search-input"
placeholder="Add symbol"
value={symbol}
onChange={e=>setSymbol(e.target.value)}
/>

<button
className="predict-btn"
onClick={handlePredict}
disabled={!symbol || loading}
>
Run
</button>

</div>

<div className="watchlist">

<h4>Watchlist</h4>

{watchlist.length===0 && <div>No symbols yet</div>}

{watchlist.map(sym=>(

<div
key={sym}
className="watch-item"
onClick={()=>{
setSymbol(sym);
handlePredict();
onClose();
}}
>
{sym}
</div>

))}

</div>

</aside>

);
}

/* ---------- MAIN APP ---------- */

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

/* API CALL */

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

const quoteRes=await fetch(\`\${API_BASE}/api/quote/\${sym}\`);

if(!quoteRes.ok) throw new Error("Quote API failed");

const quoteData=await quoteRes.json();

setQuote(quoteData);

const predRes=await fetch(\`\${API_BASE}/api/predict\`,{
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

/* UI */

return(

<>

<button
className="hamburger"
onClick={()=>setSidebarOpen(o=>!o)}
>
☰
</button>

<Sidebar
watchlist={watchlist}
symbol={symbol}
setSymbol={setSymbol}
handlePredict={handlePredict}
isOpen={sidebarOpen}
onClose={()=>setSidebarOpen(false)}
loading={loading}
/>

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
