// Alerts.tsx
import React, { useEffect, useState } from "react";

/**
 * Alerts component
 * - stores alerts in localStorage under "alerts_v1"
 * - supports add / edit / remove / enable / disable
 * - polls /api/quote/:symbol every 30s to check triggers
 * - uses browser Notification API (asks permission)
 * - on trigger: shows visual badge + sends browser notification
 *
 * Alert shape:
 * { id, symbol, target: number, direction: 'above'|'below', enabled: boolean }
 */

type AlertItem = {
  id: string;
  symbol: string;
  target: number;
  direction: "above" | "below";
  enabled: boolean;
  lastTriggeredAt?: number | null;
};

export default function Alerts({ onSelect }: { onSelect?: (s: string) => void }) {
  const STORAGE_KEY = "alerts_v1";
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [symbol, setSymbol] = useState("");
  const [target, setTarget] = useState<number | "">("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [running, setRunning] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setAlerts(JSON.parse(raw));
      } catch {
        setAlerts([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Request notification permission on mount (if not denied)
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Polling loop
  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    async function pollOnce() {
      if (!mounted) return;
      if (!running) return;

      if (alerts.length === 0) {
        setStatusMsg("No alerts set");
        return;
      }

      setStatusMsg("Checking prices...");
      try {
        // Fetch all quotes in parallel
        const fetches = alerts
          .filter((a) => a.enabled)
          .map(async (a) => {
            try {
              const res = await fetch(`/api/quote/${encodeURIComponent(a.symbol)}`);
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || json.details || "noquote");
              const price = Number(json.current ?? json.currentPrice ?? json.current);
              return { alert: a, price };
            } catch {
              return { alert: a, price: null };
            }
          });

        const results = await Promise.all(fetches);

        // For each result, check trigger
        const newAlerts = [...alerts];
        for (const r of results) {
          const a = r.alert;
          const price = r.price as number | null;
          if (price === null || price === undefined) continue;

          const shouldTrigger =
            (a.direction === "above" && price >= a.target) ||
            (a.direction === "below" && price <= a.target);

          // throttle triggers: don't re-trigger within 5 minutes
          const now = Date.now();
          if (shouldTrigger) {
            const last = a.lastTriggeredAt || 0;
            if (now - last > 1000 * 60 * 5) {
              // mark triggered timestamp
              const idx = newAlerts.findIndex((x) => x.id === a.id);
              if (idx >= 0) newAlerts[idx] = { ...a, lastTriggeredAt: now };

              // visual + browser notification
              toastNotify(`${a.symbol} ${a.direction} ${a.target}`, `Price: ${price}`);
            }
          }
        }

        setAlerts(newAlerts);
        setStatusMsg(`Last check: ${new Date().toLocaleTimeString()}`);
      } catch (err: any) {
        setStatusMsg("Error checking prices");
      }
    }

    // start immediately then interval
    (async () => {
      await pollOnce();
      timer = window.setInterval(pollOnce, 30000); // 30s
    })();

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, running]);

  function toastNotify(title: string, body?: string) {
    // browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch {}
    }
    // also console + small visual flash handled elsewhere
    console.log("ALERT:", title, body);
  }

  function addAlert() {
    const sym = (symbol || "").trim().toUpperCase();
    if (!sym) return setStatusMsg("Symbol required");
    const t = Number(target);
    if (!t || isNaN(t)) return setStatusMsg("Valid numeric target required");
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const item: AlertItem = { id, symbol: sym, target: t, direction, enabled: true, lastTriggeredAt: null };
    setAlerts((s) => [item, ...s]);
    setSymbol("");
    setTarget("");
    setStatusMsg("Alert added");
  }

  function removeAlert(id: string) {
    setAlerts((s) => s.filter((a) => a.id !== id));
  }

  function toggleAlert(id: string) {
    setAlerts((s) => s.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }

  function editAlert(id: string) {
    const a = alerts.find((x) => x.id === id);
    if (!a) return;
    setSymbol(a.symbol);
    setTarget(a.target);
    setDirection(a.direction);
    // remove old and user will add updated one
    setAlerts((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div style={ui.box}>
      <h3 style={ui.title}>Alerts</h3>

      <div style={ui.form}>
        <input
          placeholder="Symbol e.g., TCS or 540614"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          style={ui.input}
        />
        <input
          placeholder="Target price"
          value={target as any}
          onChange={(e) => setTarget(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ ...ui.input, width: 120 }}
        />

        <select value={direction} onChange={(e) => setDirection(e.target.value as any)} style={ui.select}>
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>

        <button onClick={addAlert} style={ui.addBtn}>Add</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ color: "#8fa6b3", fontSize: 12, marginBottom: 8 }}>{statusMsg}</div>

        {alerts.length === 0 && <div style={{ color: "#7f9ab0" }}>No alerts yet</div>}

        {alerts.map((a) => {
          const triggered = a.lastTriggeredAt && (Date.now() - a.lastTriggeredAt) < 1000 * 60 * 60; // last 1h
          return (
            <div key={a.id} style={ui.item}>
              <div style={{ cursor: "pointer" }} onClick={() => onSelect?.(a.symbol)}>
                <div style={{ fontWeight: 800 }}>{a.symbol}</div>
                <div style={{ color: "#8fa6b3", fontSize: 12 }}>
                  {a.direction} {a.target}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {triggered && <div style={{ color: "#7efcb0", fontWeight: 700 }}>Triggered</div>}
                <button onClick={() => toggleAlert(a.id)} style={ui.smallBtn}>{a.enabled ? "On" : "Off"}</button>
                <button onClick={() => editAlert(a.id)} style={ui.smallBtn}>Edit</button>
                <button onClick={() => removeAlert(a.id)} style={{ ...ui.smallBtn, background: "#ff5b5b" }}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ color: "#8fa6b3", fontSize: 12 }}>
          <input type="checkbox" checked={running} onChange={(e) => setRunning(e.target.checked)} /> Polling
        </label>
      </div>
    </div>
  );
}

/* Styles */
const ui: Record<string, React.CSSProperties> = {
  box: {
    background: "#061820",
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.04)",
    color: "#e6eef6",
    width: "100%",
  },
  title: { margin: 0, marginBottom: 8, fontWeight: 800 },
  form: { display: "flex", gap: 8, alignItems: "center", marginTop: 8 },
  input: { padding: "8px 10px", background: "#071b24", borderRadius: 8, color: "#9be7ff", border: "1px solid rgba(255,255,255,0.04)" },
  select: { padding: "8px 10px", background: "#071b24", borderRadius: 8, color: "#9be7ff", border: "1px solid rgba(255,255,255,0.04)" },
  addBtn: { padding: "8px 10px", background: "#00d4ff", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800 },
  item: { display: "flex", justifyContent: "space-between", padding: 10, background: "#041922", borderRadius: 8, marginBottom: 8 },
  smallBtn: { padding: "6px 8px", borderRadius: 6, background: "#0f2a36", color: "#9be7ff", border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }
};
