// src/Watchlist.tsx
import React, { useEffect, useState } from "react";
import { findBestSymbol } from "./symbolFixer";

export default function Watchlist({ onSelect }: { onSelect: (sym: string) => void }) {
  const [list, setList] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("watchlist");
    if (saved) setList(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(list));
  }, [list]);

  async function addSymbol() {
    const raw = input.trim();
    if (!raw) return;
    // run auto-fix
    const fix = findBestSymbol(raw);
    let toAdd = raw.toUpperCase();
    if (fix && fix.score >= 0.6) toAdd = fix.symbol;
    // if numeric and not in DB we still allow
    toAdd = toAdd.toUpperCase();

    if (!list.includes(toAdd)) setList((s) => [...s, toAdd]);
    setInput("");
  }

  function removeSymbol(sym: string) {
    setList((s) => s.filter((x) => x !== sym));
  }

  return (
    <div style={ui.box}>
      <h3 style={ui.title}>Watchlist</h3>

      <div style={ui.addRow}>
        <input style={ui.input} placeholder="Add symbol (TCS, 540614, BTC)" value={input} onChange={(e) => setInput(e.target.value)} />
        <button style={ui.btn} onClick={addSymbol}>+</button>
      </div>

      <div style={ui.list}>
        {list.length === 0 && <div style={{ color: "#7f9ab0", padding: 10 }}>No items yet</div>}
        {list.map((sym) => (
          <div key={sym} style={ui.item}>
            <span onClick={() => onSelect(sym)} style={ui.symbol}>{sym}</span>
            <span style={ui.remove} onClick={() => removeSymbol(sym)}>✕</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  box: { background: "#061820", padding: 16, borderRadius: 12, color: "white", width: "100%", border: "1px solid rgba(255,255,255,0.05)" },
  title: { margin: "0 0 14px 0", fontWeight: 800 },
  addRow: { display: "flex", gap: 10, marginBottom: 12 },
  input: { flex: 1, padding: "8px 12px", background: "#081d28", borderRadius: 8, color: "#9be7ff", border: "1px solid rgba(255,255,255,0.06)" },
  btn: { padding: "0 14px", background: "#00d4ff", borderRadius: 8, border: "none", fontWeight: 800, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  item: { display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#041922", borderRadius: 8, cursor: "pointer" },
  symbol: { fontWeight: 700, letterSpacing: 1, cursor: "pointer" },
  remove: { color: "#ff5b5b", cursor: "pointer", paddingLeft: 8 },
};
