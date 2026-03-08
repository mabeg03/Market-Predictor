import React from "react";

export default function AIGauge({confidence}:{confidence:number}){

return(

<div style={box}>

<h3>AI Confidence</h3>

<div style={bar}>
<div style={{...fill,width:`${confidence}%`}}/>
</div>

<p>{confidence}%</p>

</div>

);

}

const box={background:"#061820",padding:16,borderRadius:12};

const bar={height:10,background:"#0f2b36",borderRadius:6};

const fill={height:"100%",background:"#00d4ff",borderRadius:6};