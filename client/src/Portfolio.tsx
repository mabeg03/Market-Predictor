// src/Portfolio.tsx (updated)
import React, { useEffect, useState } from "react";
import { findBestSymbol } from "./symbolFixer";

/* ... keep rest of your existing Portfolio code but update the addOrUpdate function to auto-fix symbol ... */

// I will provide the full component replacing only the addOrUpdate logic to ensure integration.

type Holding = { id: string; symbol: string; qty: number; avgPrice: number; note?: string; };

export default function Portfolio({ onSelect }: { onSelect?: (sym: string) => void }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [avgPrice, setAvgPrice] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [liveMap, setLiveMap] = useState<Record<string, any>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState("");

  const STORAGE_KEY = "portfolio_v1";

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setHoldings(JSON.parse(raw));
      } catch {
        setHoldings([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    if (holdings.length > 0) fetchAllPrices();
    else setLiveMap({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings]);

  async function fetchAllPrices() {
    try {
      setLoadingPrices(true);
      const map: Record<string, any> = { ...liveMap };
      const fetches = holdings.map(async (h) => {
        try {
          const res = await fetch(`/api/quote/${encodeURIComponent(h.symbol)}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || json.details || "quote failed");
          map[h.symbol] = { symbol: h.symbol, current: Number(json.current ?? json.currentPrice ?? 0), prevClose: json.previousClose, market: json.market || json.source || "UNKNOWN" };
        } catch {
          map[h.symbol] = { symbol: h.symbol };
        }
      });
      await Promise.all(fetches);
      setLiveMap(map);
    } finally {
      setLoadingPrices(false);
    }
  }

  // ADD / UPDATE with AUTO-FIX
  function addOrUpdate() {
    setError("");
    const raw = symbol.trim();
    if (!raw) { setError("Symbol required"); return; }

    // run auto-fix and pick final symbol
    const fix = findBestSymbol(raw);
    let toUse = raw.toUpperCase();
    if (fix && fix.score >= 0.6) toUse = fix.symbol;

    const q = Number(qty);
    const a = Number(avgPrice);
    if (!q || q <= 0) { setError("Quantity must be > 0"); return; }
    if (!a || a <= 0) { setError("Avg price must be > 0"); return; }

    if (editingId) {
      setHoldings((h) => h.map((it) => (it.id === editingId ? { ...it, symbol: toUse, qty: q, avgPrice: a } : it)));
      setEditingId(null);
    } else {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setHoldings((h) => [...h, { id, symbol: toUse, qty: q, avgPrice: a }]);
    }

    setSymbol("");
    setQty("");
    setAvgPrice("");
  }

  function removeHolding(id: string) { setHoldings((h) => h.filter((it) => it.id !== id)); }
  function editHolding(id: string) { const h = holdings.find((x) => x.id === id); if (!h) return; setEditingId(id); setSymbol(h.symbol); setQty(h.qty); setAvgPrice(h.avgPrice); }
  function selectSymbol(sym: string) { if (onSelect) onSelect(sym); }

  function exportCSV() {
    const rows = [["symbol","qty","avgPrice","marketPrice","currentValue","pnl","pnlPct","note"]];
    for (const h of holdings) {
      const live = liveMap[h.symbol];
      const mp = Number(live?.current ?? 0);
      const currVal = (mp * h.qty) || 0;
      const cost = h.avgPrice * h.qty;
      const pnl = currVal - cost;
      const pnlPct = cost ? ((pnl / cost) * 100).toFixed(2) : "0.00";
      rows.push([h.symbol, String(h.qty), String(h.avgPrice), String(mp || ""), String(currVal.toFixed(2)), String(pnl.toFixed(2)), pnlPct, h.note ?? ""]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalCost = holdings.reduce((s, h) => s + h.avgPrice * h.qty, 0);
  const totalValue = holdings.reduce((s, h) => s + ((liveMap[h.symbol]?.current ?? 0) * h.qty), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div style={ui.box}>
      <h3 style={ui.title}>Portfolio</h3>

      <div style={ui.kvRow}>
        <div style={ui.kv}><div style={ui.kvLabel}>Cost</div><div style={ui.kvVal}>₹{Number(totalCost).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div></div>
        <div style={ui.kv}><div style={ui.kvLabel}>Value</div><div style={ui.kvVal}>₹{Number(totalValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div></div>
        <div style={ui.kv}><div style={ui.kvLabel}>P&L</div><div style={{ ...ui.kvVal, color: totalPnl >= 0 ? "#7efcb0" : "#ff7b7b" }}>₹{Number(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({totalPnlPct.toFixed(2)}%)</div></div>
      </div>

      <div style={ui.formRow}>
        <input placeholder="SYMBOL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} style={ui.input}/>
        <input placeholder="QTY" value={qty as any} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} style={{...ui.input, width: 80}}/>
        <input placeholder="AVG PRICE" value={avgPrice as any} onChange={(e) => setAvgPrice(e.target.value === "" ? "" : Number(e.target.value))} style={{...ui.input, width: 120}}/>
        <button onClick={addOrUpdate} style={ui.addBtn}>{editingId ? "Update" : "Add"}</button>
      </div>

      {error && <div style={ui.err}>{error}</div>}

      <div style={{ marginTop: 12, maxHeight: 300, overflowY: "auto" }}>
        {holdings.length === 0 && <div style={{ color: "#7f9ab0" }}>No holdings added</div>}
        {holdings.map((h) => {
          const live = liveMap[h.symbol];
          const mp = Number(live?.current ?? 0);
          const currVal = mp * h.qty;
          const cost = h.avgPrice * h.qty;
          const pnl = currVal - cost;
          const pnlPct = cost ? (pnl / cost) * 100 : 0;
          return (
            <div key={h.id} style={ui.rowItem}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div onClick={() => selectSymbol(h.symbol)} style={ui.symbolClickable}>{h.symbol}</div>
                  <div style={{ color: "#8fa6b3", fontSize: 12 }}>{live?.market ?? ""}</div>
                </div>

                <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                  <div>Qty: <b>{h.qty}</b></div>
                  <div>Avg: <b>₹{h.avgPrice}</b></div>
                  <div>Price: <b>₹{mp ? mp.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</b></div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800 }}>{currVal ? `₹${currVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}</div>
                <div style={{ color: pnl >= 0 ? "#7efcb0" : "#ff7b7b", fontWeight: 800 }}>{pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`} ({pnlPct.toFixed(2)}%)</div>

                <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={ui.smallBtn} onClick={() => editHolding(h.id)}>Edit</button>
                  <button style={{...ui.smallBtn, background: "#ff5b5b"}} onClick={() => removeHolding(h.id)}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={ui.actionBtn} onClick={() => fetchAllPrices()}>Refresh Prices</button>
        <button style={ui.actionBtn} onClick={exportCSV}>Export CSV</button>
        <button style={ui.actionBtn} onClick={() => { setHoldings([]); }}>Clear</button>
      </div>

      <div style={{ marginTop: 8, color: "#7f9ab0", fontSize: 12 }}>Tip: click symbol to load it in the main panel.</div>
    </div>
  );
}

/* reuse styles from earlier Portfolio file */
const ui: Record<string, React.CSSProperties> = {
  box: { background: "#061820", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", color: "#e6eef6", width: "100%" },
  title: { margin: "0 0 10px 0", fontWeight: 800 },
  kvRow: { display: "flex", gap: 12, marginBottom: 10 },
  kv: { minWidth: 0 },
  kvLabel: { color: "#8fa6b3", fontSize: 12 },
  kvVal: { fontWeight: 900, fontSize: 16 },
  formRow: { display: "flex", gap: 8, alignItems: "center", marginTop: 6 },
  input: { padding: "8px 10px", background: "#071b24", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, color: "#9be7ff" },
  addBtn: { padding: "8px 12px", background: "linear-gradient(90deg,#0f6bff,#00d4ff)", border: "none", borderRadius: 8, color: "#041423", fontWeight: 800, cursor: "pointer" },
  err: { color: "#ffb3b3", marginTop: 8 },
  rowItem: { display: "flex", gap: 12, padding: 10, background: "#041822", borderRadius: 8, marginBottom: 8, alignItems: "center" },
  symbolClickable: { fontWeight: 800, cursor: "pointer" },
  smallBtn: { padding: "6px 8px", borderRadius: 6, background: "#0f2a36", color: "#9be7ff", border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", fontSize: 12 },
  actionBtn: { padding: "8px 10px", background: "#081d28", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", color: "#9be7ff", fontWeight: 700 }
};
