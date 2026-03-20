import { symbolDatabase } from "../symbolDatabase"
import React, { useState } from "react";
import stocks from "../data/stocks";

function StockSearch() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (value) => {
    setQuery(value);

    if (value === "") {
      setResults([]);
      return;
    }

    const filtered = stocks.filter(stock =>
      stock.toLowerCase().startsWith(value.toLowerCase())
    );

    setResults(filtered);
  };

  return (
    <div style={{width:"300px", margin:"20px auto"}}>

      <input
        type="text"
        placeholder="Search stocks..."
        value={query}
        onChange={(e)=>handleSearch(e.target.value)}
        style={{
          width:"100%",
          padding:"10px",
          borderRadius:"6px",
          border:"1px solid #ccc"
        }}
      />

      {results.length > 0 && (
        <ul style={{
          listStyle:"none",
          padding:"0",
          background:"#0a1a22",
          color:"#fff"
        }}>
          {results.map((stock,i)=>(
            <li key={i} style={{padding:"8px"}}>
              {stock}
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

export default StockSearch;