import React from "react";

export default function Tabs({ active, setActive }) {
  const tabs = ["Stocks", "Commodities", "Forex", "Crypto", "Watchlist"];

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          style={{
            padding: "10px 20px",
            background: active === t ? "#2563eb" : "#e5e7eb",
            color: active === t ? "#fff" : "#111",
            borderRadius: 10,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
