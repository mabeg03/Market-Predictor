// client/src/Watchlist.tsx
import React, { useEffect, useState } from "react";
import { findBestSymbol } from "./symbolFixer";

export default function Watchlist({ onSelect }: { onSelect: (s: string) => void }) {
  const [list, setList] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("watchlist");
    if (s) setList(JSON.parse(s));
  }, []);
  useEffect(() => localStorage.setItem("watchlist", JSON.stringify(list)), [list]);

  function addSymbol() {
    const raw = (input || "").trim();
    if (!raw) return;
    const fix = findBestSymbol(raw);
    const toAdd = (fix && fix.score >= 0.6) ? fix.symbol : raw.toUpperCase();
    if (!list.includes(toAdd)) setList((l) => [...l, toAdd]);
    setInput("");
  }

  function removeSymbol(sym: string) { setList((l) => l.filter((x) => x !== sym)); }

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
  box: { background: "#061820", padding: 16, borderRadius: 12, color: "white" },
  title: { margin: "0 0 12px 0", fontWeight: 800 },
  addRow: { display: "flex", gap: 10, marginBottom: 12 },
  input: { flex: 1, padding: "8px 12px", background: "#081d28", borderRadius: 8, color: "#9be7ff", border: "1px solid rgba(255,255,255,0.06)" },
  btn: { padding: "0 14px", background: "#00d4ff", borderRadius: 8, border: "none", fontWeight: 800, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  item: { display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#041922", borderRadius: 8 },
  symbol: { fontWeight: 700, cursor: "pointer" },
  remove: { color: "#ff5b5b", cursor: "pointer" }
};
