// client/src/Portfolio.tsx
import React, { useEffect, useState } from "react";
import { findBestSymbol } from "./symbolFixer";

type Holding = { id: string; symbol: string; qty: number; avgPrice: number; note?: string; };

export default function Portfolio({ onSelect }: { onSelect?: (s: string) => void }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [avgPrice, setAvgPrice] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [liveMap, setLiveMap] = useState<Record<string, any>>({});

  const STORAGE_KEY = "portfolio_v1";

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setHoldings(JSON.parse(raw));
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    if (holdings.length) fetchAllPrices();
    else setLiveMap({});
    // eslint-disable-next-line
  }, [holdings]);

  async function fetchAllPrices() {
    const map: Record<string, any> = {};
    await Promise.all(holdings.map(async (h) => {
      try {
        const res = await fetch(`/api/quote/${encodeURIComponent(h.symbol)}`);
        const json = await res.json();
        map[h.symbol] = { current: json.current ?? json.LTP ?? 0, market: json.market };
      } catch { map[h.symbol] = { current: 0 }; }
    }));
    setLiveMap(map);
  }

  function addOrUpdate() {
    const raw = (symbol || "").trim();
    if (!raw) return;
    const fix = findBestSymbol(raw);
    const toUse = (fix && fix.score >= 0.6) ? fix.symbol : raw.toUpperCase();
    const q = Number(qty); const a = Number(avgPrice);
    if (!q || !a) return;
    if (editingId) {
      setHoldings((h) => h.map((it) => it.id === editingId ? { ...it, symbol: toUse, qty: q, avgPrice: a } : it));
      setEditingId(null);
    } else {
      setHoldings((h) => [...h, { id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`, symbol: toUse, qty: q, avgPrice: a }]);
    }
    setSymbol(""); setQty(""); setAvgPrice("");
  }

  function removeHolding(id: string) { setHoldings((h) => h.filter((it) => it.id !== id)); }
  function editHolding(id: string) { const h = holdings.find(x => x.id === id); if (!h) return; setEditingId(id); setSymbol(h.symbol); setQty(h.qty); setAvgPrice(h.avgPrice); }

  const totalCost = holdings.reduce((s, h) => s + h.avgPrice * h.qty, 0);
  const totalValue = holdings.reduce((s, h) => s + ((liveMap[h.symbol]?.current ?? 0) * h.qty), 0);
  const totalPnl = totalValue - totalCost;

  return (
    <div style={ui.box}>
      <h3 style={ui.title}>Portfolio</h3>
      <div style={ui.kvRow}>
        <div><div style={ui.kvLabel}>Cost</div><div style={ui.kvVal}>₹{totalCost.toFixed(2)}</div></div>
        <div><div style={ui.kvLabel}>Value</div><div style={ui.kvVal}>₹{totalValue.toFixed(2)}</div></div>
        <div><div style={ui.kvLabel}>P&L</div><div style={{...ui.kvVal, color: totalPnl>=0?"#7efcb0":"#ff7b7b"}}>₹{totalPnl.toFixed(2)}</div></div>
      </div>

      <div style={ui.formRow}>
        <input placeholder="SYMBOL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} style={ui.input}/>
        <input placeholder="QTY" value={qty as any} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} style={{...ui.input, width: 80}}/>
        <input placeholder="AVG PRICE" value={avgPrice as any} onChange={(e) => setAvgPrice(e.target.value === "" ? "" : Number(e.target.value))} style={{...ui.input, width: 120}}/>
        <button onClick={addOrUpdate} style={ui.addBtn}>{editingId ? "Update" : "Add"}</button>
      </div>

      <div style={{ marginTop: 12, maxHeight: 300, overflowY: "auto" }}>
        {holdings.map(h => {
          const mp = liveMap[h.symbol]?.current ?? 0;
          const val = mp * h.qty; const cost = h.avgPrice * h.qty; const pnl = val - cost;
          return (
            <div key={h.id} style={ui.rowItem}>
              <div style={{flex:1}}>
                <div style={{display:"flex", gap:8, alignItems:"center"}}>
                  <div style={{fontWeight:800, cursor:"pointer"}} onClick={() => onSelect?.(h.symbol)}>{h.symbol}</div>
                  <div style={{color:"#8fa6b3", fontSize:12}}>{liveMap[h.symbol]?.market ?? ""}</div>
                </div>
                <div style={{marginTop:6, fontSize:13}}>Qty: <b>{h.qty}</b> Avg: <b>₹{h.avgPrice}</b> Price: <b>₹{mp.toFixed(2)}</b></div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:800}}>₹{val.toFixed(2)}</div>
                <div style={{color:pnl>=0?"#7efcb0":"#ff7b7b", fontWeight:800}}>{pnl>=0?`+₹${pnl.toFixed(2)}`:`-₹${Math.abs(pnl).toFixed(2)}`}</div>
                <div style={{marginTop:8, display:"flex", gap:8, justifyContent:"flex-end"}}>
                  <button style={ui.smallBtn} onClick={() => editHolding(h.id)}>Edit</button>
                  <button style={{...ui.smallBtn, background:"#ff5b5b"}} onClick={() => removeHolding(h.id)}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex", gap:8, marginTop:12}}>
        <button style={ui.actionBtn} onClick={() => fetchAllPrices()}>Refresh Prices</button>
        <button style={ui.actionBtn} onClick={() => { setHoldings([]); }}>Clear</button>
      </div>
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  box: { background: "#061820", padding: 14, borderRadius: 12, color: "#e6eef6" },
  title: { margin: "0 0 10px 0", fontWeight: 800 },
  kvRow: { display: "flex", gap: 12, marginBottom: 10 },
  kvLabel: { color: "#8fa6b3", fontSize: 12 }, kvVal: { fontWeight: 900, fontSize: 16 },
  formRow: { display: "flex", gap: 8, alignItems: "center", marginTop: 6 },
  input: { padding: "8px 10px", background: "#071b24", borderRadius: 8, color: "#9be7ff", border: "1px solid rgba(255,255,255,0.05)" },
  addBtn: { padding: "8px 12px", background: "linear-gradient(90deg,#0f6bff,#00d4ff)", border: "none", borderRadius: 8, color: "#041423", cursor: "pointer" },
  rowItem: { display: "flex", gap: 12, padding: 10, background: "#041822", borderRadius: 8, marginBottom: 8, alignItems: "center" },
  smallBtn: { padding: "6px 8px", borderRadius: 6, background: "#0f2a36", color: "#9be7ff", border: "1px solid rgba(255,255,255,0.04)" },
  actionBtn: { padding: "8px 10px", background: "#081d28", borderRadius: 8, cursor: "pointer", color: "#9be7ff", fontWeight: 700 }
};
