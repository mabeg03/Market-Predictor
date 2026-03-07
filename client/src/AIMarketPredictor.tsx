import { useState, useEffect } from "react";

const API_BASE = "https://tradedeck-ltby.onrender.com";

/* ---------- STYLES ---------- */

const styles = `
  body {
    font-family: Arial, sans-serif;
    background: #020c12;
    color: #e6eef6;
    margin:0;
  }

  :root {
    --cyan:#00d4ff;
    --green:#00e676;
    --red:#ff4444;
    --bg:#020c12;
    --bg2:#071420;
    --bg3:#0d1f2d;
    --border:rgba(0,212,255,0.15);
    --sidebar-w:270px;
  }

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
  }

  .sidebar.open{ transform:translateX(0); }
  .sidebar{ transform:translateX(-100%); }

  .sidebar-header{
    margin-bottom:20px;
  }

  .logo{
    font-size:22px;
    font-weight:bold;
    color:var(--cyan);
  }

  .search-row{
    display:flex;
    gap:6px;
    margin-top:10px;
  }

  .search-input{
    flex:1;
    padding:8px;
    background:var(--bg3);
    border:1px solid var(--border);
    border-radius:6px;
    color:white;
  }

  .predict-btn{
    background:var(--cyan);
    border:none;
    padding:8px 12px;
    border-radius:6px;
    font-weight:bold;
    cursor:pointer;
  }

  .watchlist{
    margin-top:25px;
  }

  .watch-item{
    padding:8px;
    cursor:pointer;
    border-bottom:1px solid var(--border);
  }

  .watch-item:hover{
    background:rgba(0,212,255,0.1);
  }

  .hamburger{
    position:fixed;
    top:15px;
    left:15px;
    z-index:1100;
    background:var(--cyan);
    border:none;
    padding:8px 12px;
    border-radius:6px;
    cursor:pointer;
  }

  .main{
    margin-left:var(--sidebar-w);
    padding:40px;
  }

  .card{
    background:var(--bg2);
    border:1px solid var(--border);
    border-radius:10px;
    padding:20px;
    margin-bottom:20px;
  }

  .price{
    font-size:32px;
    color:var(--cyan);
  }

  @media(max-width:900px){
    .main{ margin-left:0; padding-top:70px; }
  }
`;

/* ---------- SIDEBAR ---------- */

function Sidebar({ watchlist, symbol, setSymbol, handlePredict, isOpen, onClose, loading }) {

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>

      <div className="sidebar-header">
        <div className="logo">TradeDeck</div>
      </div>

      {/* SEARCH INPUT INSIDE SIDEBAR */}

      <div>
        <div>Analyze Symbol</div>

        <div className="search-row">
          <input
            className="search-input"
            placeholder="RELIANCE"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
          />

          <button
            className="predict-btn"
            onClick={handlePredict}
            disabled={loading || !symbol}
          >
            Run
          </button>
        </div>
      </div>

      {/* WATCHLIST */}

      <div className="watchlist">

        <h4>Watchlist</h4>

        {watchlist.length === 0 && <div>No symbols yet</div>}

        {watchlist.map(sym => (

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
  const [quote,setQuote]=useState(null);
  const [prediction,setPrediction]=useState(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [watchlist,setWatchlist]=useState([]);
  const [sidebarOpen,setSidebarOpen]=useState(false);

  useEffect(()=>{
    const style=document.createElement("style");
    style.innerHTML=styles;
    document.head.appendChild(style);
    return ()=>document.head.removeChild(style);
  },[]);

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

    }catch(e){
      setError(e.message);
    }
    finally{
      setLoading(false);
    }
  }

  function fmt(v){
    if(v==null) return "—";
    return Number(v).toLocaleString(undefined,{maximumFractionDigits:2});
  }

  const isPos = quote && Number(quote.change)>=0;

  return(
    <>
      {/* HAMBURGER */}
      <button
        className="hamburger"
        onClick={()=>setSidebarOpen(o=>!o)}
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <Sidebar
        watchlist={watchlist}
        symbol={symbol}
        setSymbol={setSymbol}
        handlePredict={handlePredict}
        isOpen={sidebarOpen}
        onClose={()=>setSidebarOpen(false)}
        loading={loading}
      />

      {/* MAIN */}
      <main className="main">

        <h1>AI Market Predictor</h1>

        {error && <div>{error}</div>}

        {quote && (

          <div className="card">

            <h2>{quote.symbol}</h2>

            <div className="price">
              ₹{fmt(quote.current)}
            </div>

            <div style={{color:isPos?"#00e676":"#ff4444"}}>
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
