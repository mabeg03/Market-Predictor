import React from "react";

export default function MarketMovers(){

const gainers=[
{symbol:"AAPL",change:"+3.1%"},
{symbol:"TSLA",change:"+2.4%"},
{symbol:"NVDA",change:"+1.8%"}
];

const losers=[
{symbol:"META",change:"-2.1%"},
{symbol:"AMD",change:"-1.7%"},
{symbol:"NFLX",change:"-1.5%"}
];

return(

<div style={box}>

<h3>Market Movers</h3>

<h4 style={{color:"#00e676"}}>Top Gainers</h4>

{gainers.map(g=>(
<div style={row} key={g.symbol}>
{g.symbol}
<span style={{color:"#00e676"}}>{g.change}</span>
</div>
))}

<h4 style={{color:"#ff5252",marginTop:10}}>Top Losers</h4>

{losers.map(l=>(
<div style={row} key={l.symbol}>
{l.symbol}
<span style={{color:"#ff5252"}}>{l.change}</span>
</div>
))}

</div>

);

}

const box={background:"#061820",padding:16,borderRadius:12};
const row={display:"flex",justifyContent:"space-between",padding:"6px 0"};