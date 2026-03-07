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

<div className="watchlist">

<div className="watch-input">

<input
value={input}
placeholder="Add symbol"
onChange={(e)=>setInput(e.target.value)}
/>

<button onClick={add}>+</button>

</div>

{list.map(sym=>(

<div key={sym} className="watch-item">

<span onClick={()=>onSelect(sym)}>
{sym}
</span>

<span onClick={()=>remove(sym)}>
✕
</span>

</div>

))}

</div>

);

}
