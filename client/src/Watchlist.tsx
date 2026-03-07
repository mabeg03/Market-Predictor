import React,{useState,useEffect} from "react";

export default function Watchlist({onSelect}:{onSelect:(s:string)=>void}){

const [list,setList]=useState<string[]>([]);
const [input,setInput]=useState("");

useEffect(()=>{

const s=localStorage.getItem("watchlist");
if(s) setList(JSON.parse(s));

},[]);

useEffect(()=>{

localStorage.setItem("watchlist",JSON.stringify(list));

},[list]);

function add(){

const sym=input.trim().toUpperCase();

if(!sym) return;

if(!list.includes(sym))
setList(l=>[...l,sym]);

setInput("");

}

function remove(sym:string){

setList(l=>l.filter(x=>x!==sym));

}

return(

<div style={ui.box}>

<div style={ui.row}>

<input
value={input}
placeholder="Add symbol"
onChange={(e)=>setInput(e.target.value)}
style={ui.input}
/>

<button onClick={add} style={ui.btn}>+</button>

</div>

<div style={ui.list}>

{list.map(sym=>(

<div key={sym} style={ui.item}>

<span
style={ui.symbol}
onClick={()=>onSelect(sym)}
>
{sym}
</span>

<span
style={ui.remove}
onClick={()=>remove(sym)}
>
✕
</span>

</div>

))}

</div>

</div>

);

}

const ui:any={

box:{
padding:10
},

row:{
display:"flex",
gap:6,
marginBottom:10
},

input:{
flex:1,
padding:6,
background:"#081d28",
borderRadius:6,
color:"#9be7ff"
},

btn:{
background:"#00d4ff",
border:"none",
padding:"4px 10px",
borderRadius:6,
cursor:"pointer"
},

list:{
display:"flex",
flexDirection:"column",
gap:6
},

item:{
display:"flex",
justifyContent:"space-between",
background:"#041922",
padding:"6px 8px",
borderRadius:6
},

symbol:{
cursor:"pointer"
},

remove:{
color:"#ff5252",
cursor:"pointer"
}

};