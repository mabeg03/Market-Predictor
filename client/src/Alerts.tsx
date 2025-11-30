// client/src/Alerts.tsx
import React, { useEffect, useState } from "react";
import { findBestSymbol } from "./symbolFixer";

type AlertItem = { id: string; symbol: string; target: number; direction: "above"|"below"; enabled: boolean; lastTriggeredAt?: number|null; };

export default function Alerts({ onSelect }: { onSelect?: (s: string) => void }) {
  const STORAGE_KEY = "alerts_v1";
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [symbol, setSymbol] = useState("");
  const [target, setTarget] = useState<number | "">("");
  const [direction, setDirection] = useState<"above"|"below">("above");
  const [running, setRunning] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setAlerts(JSON.parse(raw));
  }, []);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)), [alerts]);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;
    async function poll() {
      if (!mounted) return;
      if (!running) return;
      if (alerts.length === 0) { setStatusMsg("No alerts"); return; }
      setStatusMsg("Checking...");
      const checks = alerts.filter(a => a.enabled).map(async (a) => {
        try {
          const res = await fetch(`/api/quote/${encodeURIComponent(a.symbol)}`);
          const json = await res.json();
          return { a, price: Number(json.current ?? json.LTP ?? 0) };
        } catch { return { a, price: null }; }
      });
      const results = await Promise.all(checks);
      const now = Date.now();
      const newAlerts = [...alerts];
      for (const r of results) {
        const a = r.a;
        const price = r.price;
        if (price === null) continue;
        const should = (a.direction === "above" && price >= a.target) || (a.direction === "below" && price <= a.target);
        if (should) {
          const idx = newAlerts.findIndex(x => x.id === a.id);
          if (idx >= 0) {
            const last = newAlerts[idx].lastTriggeredAt || 0;
            if (now - last > 1000 * 60 * 5) {
              newAlerts[idx] = { ...newAlerts[idx], lastTriggeredAt: now };
              if (Notification.permission === "granted") new Notification(`${a.symbol} ${a.direction} ${a.target}`, { body: `Price: ${price}` });
              const soundEnabled = localStorage.getItem("sound_enabled") !== "0";
              if (soundEnabled) try { new Audio("/alert.mp3").play().catch(()=>{}); } catch {}
            }
          }
        }
      }
      setAlerts(newAlerts);
      setStatusMsg(`Last check: ${new Date().toLocaleTimeString()}`);
    }
    (async () => { await poll(); timer = window.setInterval(poll, 30000); })();
    return () => { mounted = false; if (timer) clearInterval(timer); };
    // eslint-disable-next-line
  }, [alerts, running]);

  function addAlert() {
    const raw = (symbol || "").trim();
    if (!raw) return setStatusMsg("Symbol required");
    const fix = findBestSymbol(raw);
    const toUse = (fix && fix.score >= 0.6) ? fix.symbol : raw.toUpperCase();
    const t = Number(target);
    if (!t) return setStatusMsg("Valid numeric target required");
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    setAlerts(a => [{ id, symbol: toUse, target: t, direction, enabled: true, lastTriggeredAt: null }, ...a]);
    setSymbol(""); setTarget("");
    setStatusMsg("Alert added");
  }

  function removeAlert(id: string) { setAlerts(a => a.filter(x => x.id !== id)); }
  function toggle(id: string) { setAlerts(a => a.map(x => x.id===id ? { ...x, enabled: !x.enabled } : x)); }
  function edit(id: string) { const a = alerts.find(x => x.id === id); if (!a) return; setSymbol(a.symbol); setTarget(a.target); setDirection(a.direction); setAlerts(x => x.filter(y => y.id !== id)); }

  useEffect(() => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(()=>{}); }, []);

  return (
    <div style={ui.box}>
      <h3 style={ui.title}>Alerts</h3>
      <div style={ui.form}>
        <input placeholder="Symbol e.g., TCS or 540614" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} style={ui.input} />
        <input placeholder="Target" value={target as any} onChange={e => setTarget(e.target.value===""? "" : Number(e.target.value))} style={{...ui.input, width:120}} />
        <select value={direction} onChange={e => setDirection(e.target.value as any)} style={ui.select}><option value="above">Above</option><option value="below">Below</option></select>
        <button onClick={addAlert} style={ui.addBtn}>Add</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ color: "#8fa6b3", fontSize: 12 }}>{statusMsg}</div>
        {alerts.length===0 && <div style={{color:"#7f9ab0"}}>No alerts</div>}
        {alerts.map(a => {
          const triggered = a.lastTriggeredAt && (Date.now() - (a.lastTriggeredAt||0) < 1000*60*60);
          return (
            <div key={a.id} style={ui.item}>
              <div style={{cursor:"pointer"}} onClick={() => onSelect?.(a.symbol)}>
                <div style={{fontWeight:800}}>{a.symbol}</div>
                <div style={{color:"#8fa6b3", fontSize:12}}>{a.direction} {a.target}</div>
              </div>
              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                {triggered && <div style={{color:"#7efcb0", fontWeight:700}}>Triggered</div>}
                <button style={ui.smallBtn} onClick={() => toggle(a.id)}>{a.enabled ? "On" : "Off"}</button>
                <button style={ui.smallBtn} onClick={() => edit(a.id)}>Edit</button>
                <button style={{...ui.smallBtn, background:"#ff5b5b"}} onClick={() => removeAlert(a.id)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ color: "#8fa6b3", fontSize: 12 }}><input type="checkbox" checked={running} onChange={e => setRunning(e.target.checked)} /> Polling</label>
        <div style={{ marginTop: 6 }}>
          <label style={{ color: "#8fa6b3", fontSize: 12 }}><input type="checkbox" defaultChecked onChange={e => localStorage.setItem("sound_enabled", e.target.checked ? "1" : "0")} /> Sound</label>
        </div>
      </div>
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  box: { background: "#061820", padding: 14, borderRadius: 12, color: "#e6eef6" }, title: { margin: 0, marginBottom: 8, fontWeight: 800 },
  form: { display: "flex", gap: 8, alignItems: "center", marginTop: 8 }, input: { padding: "8px 10px", background: "#071b24", borderRadius: 8, color: "#9be7ff" },
  select: { padding: "8px 10px", background: "#071b24", borderRadius: 8, color: "#9be7ff" }, addBtn: { padding: "8px 10px", background: "#00d4ff", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800 },
  item: { display: "flex", justifyContent: "space-between", padding: 10, background: "#041922", borderRadius: 8, marginBottom: 8 },
  smallBtn: { padding: "6px 8px", borderRadius: 6, background: "#0f2a36", color: "#9be7ff", border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }
};
