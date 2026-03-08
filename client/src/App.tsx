import React, { useState } from "react";
import AIMarketPredictor from "./AIMarketPredictor";
import Watchlist from "./Watchlist";
import Portfolio from "./Portfolio";
import Alerts from "./Alerts";
import "./responsive.css";

export default function App() {

  const [selectedSymbol,setSelectedSymbol]=useState("");
  const [activeTab,setActiveTab]=useState<"predictor"|"portfolio"|"alerts">("predictor");
  const [sidebarOpen,setSidebarOpen]=useState(false);

  return(

<div className="app">

<header className="header">

<div className="logo">TradeDeck</div>

<button
className="hamburger"
onClick={()=>setSidebarOpen(!sidebarOpen)}
>
☰
</button>

</header>

<div className="layout">

<aside className={`sidebar ${sidebarOpen?"open":""}`}>

<Watchlist
onSelect={(s)=>{
setSelectedSymbol(s);
setSidebarOpen(false);
}}
/>

</aside>

<main className="main">

<div className="tabs">

<div
className={activeTab==="predictor"?"tab active":"tab"}
onClick={()=>setActiveTab("predictor")}
>
Predictor
</div>

<div
className={activeTab==="portfolio"?"tab active":"tab"}
onClick={()=>setActiveTab("portfolio")}
>
Portfolio
</div>

<div
className={activeTab==="alerts"?"tab active":"tab"}
onClick={()=>setActiveTab("alerts")}
>
Alerts
</div>

</div>

<div className="content">

{activeTab==="predictor" &&
<AIMarketPredictor externalSymbol={selectedSymbol} />
}

{activeTab==="portfolio" &&
<Portfolio onSelect={(s)=>setSelectedSymbol(s)} />
}

{activeTab==="alerts" &&
<Alerts onSelect={(s)=>setSelectedSymbol(s)} />
}

</div>

</main>

</div>

</div>

);

}
