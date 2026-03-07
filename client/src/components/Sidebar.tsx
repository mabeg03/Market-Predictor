import React from "react";

export default function Sidebar({ watchlist }: any) {

  return (

    <div
      style={{
        width: 250,
        background: "#07121c",
        borderRight: "1px solid #0f2a3a",
        padding: 20,
        color: "white"
      }}
    >

      <h3 style={{ color: "#00d4ff" }}>Watchlist</h3>

      {watchlist.length === 0 && <p>No symbols</p>}

      {watchlist.map((s: string, i: number) => (
        <div key={i} style={{ padding: "8px 0" }}>
          {s}
        </div>
      ))}

    </div>

  );

}
