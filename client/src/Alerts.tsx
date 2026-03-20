import { useEffect, useState } from "react";

type Alert = {
  id: string;
  symbol: string;
  price: number;
  triggered?: boolean;
};

export default function Alerts({ onSelect }: any) {

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState<number | "">("");

  const STORAGE_KEY = "alerts_v1";

  const isMobile = window.innerWidth < 600;

  /* 🔔 REQUEST NOTIFICATION PERMISSION */
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  /* LOAD FROM STORAGE */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  /* SAVE TO STORAGE */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  /* 🔔 SEND NOTIFICATION */
  function sendNotification(title: string, body: string) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/logo192.png",
      });
    }
  }

  /* ADD ALERT */
  function addAlert() {
    if (!symbol || !price) return;

    setAlerts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        symbol: symbol.toUpperCase(),
        price: Number(price),
        triggered: false,
      },
    ]);

    setSymbol("");
    setPrice("");
  }

  function removeAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  /* 🔁 CHECK ALERTS EVERY 10s */
  useEffect(() => {

    const interval = setInterval(async () => {

      if (!alerts.length) return;

      const updated = await Promise.all(
        alerts.map(async (a) => {

          if (a.triggered) return a;

          try {
            const res = await fetch(`/api/quote/${a.symbol}`);
            const data = await res.json();

            const current = data.current ?? data.LTP ?? 0;

            if (current >= a.price) {

              /* 🔔 NOTIFICATION */
              sendNotification(
                "🚀 Price Alert",
                `${a.symbol} reached ₹${a.price}`
              );

              /* 🔊 SOUND */
              const audio = new Audio("/alert.mp3");
              audio.play().catch(() => {});

              return { ...a, triggered: true };
            }

            return a;

          } catch {
            return a;
          }

        })
      );

      setAlerts(updated);

    }, 10000);

    return () => clearInterval(interval);

  }, [alerts]);

  return (
    <div style={ui.container}>

      <h2 style={ui.title}>🔔 Price Alerts</h2>

      {/* INPUT */}
      <div
        style={{
          ...ui.formRow,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <input
          placeholder="SYMBOL"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={ui.input}
        />

        <input
          placeholder="TARGET PRICE"
          value={price as any}
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          style={ui.input}
        />

        <button style={ui.addBtn} onClick={addAlert}>
          Add Alert
        </button>
      </div>

      {/* LIST */}
      <div style={ui.list}>

        {alerts.length === 0 && (
          <p style={ui.empty}>No alerts yet</p>
        )}

        {alerts.map((a) => (

          <div
            key={a.id}
            style={{
              ...ui.card,
              flexDirection: isMobile ? "column" : "row",
            }}
          >

            {/* LEFT */}
            <div style={{ flex: 1 }}>
              <div
                style={ui.symbol}
                onClick={() => onSelect?.(a.symbol)}
              >
                {a.symbol}
              </div>

              <div style={ui.meta}>
                Target: ₹{a.price}
              </div>

              {a.triggered && (
                <div style={ui.triggered}>
                  ✅ Triggered
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div
              style={{
                ...ui.right,
                alignItems: isMobile ? "flex-start" : "flex-end",
              }}
            >
              <button
                style={ui.removeBtn}
                onClick={() => removeAlert(a.id)}
              >
                Remove
              </button>
            </div>

          </div>

        ))}

      </div>

      {/* DISCLAIMER */}
      <p style={ui.disclaimer}>
        Alerts are indicative only and not financial advice.
      </p>

    </div>
  );
}

/* UI */
const ui: any = {

  container: {
    padding: 12,
    backdropFilter: "blur(10px)",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    color: "#e6eef6",
  },

  title: {
    marginBottom: 12,
    fontWeight: 800,
  },

  formRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#071b24",
    color: "#9be7ff",
  },

  addBtn: {
    padding: "10px 14px",
    background: "linear-gradient(135deg,#00d4ff,#0f6bff)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },

  list: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  card: {
    display: "flex",
    gap: 12,
    padding: 12,
    background: "#041822",
    borderRadius: 10,
  },

  symbol: {
    fontWeight: 800,
    cursor: "pointer",
  },

  meta: {
    fontSize: 13,
    color: "#8fa6b3",
    marginTop: 4,
  },

  triggered: {
    marginTop: 4,
    color: "#22c55e",
    fontSize: 12,
  },

  right: {
    display: "flex",
    justifyContent: "flex-end",
  },

  removeBtn: {
    padding: "6px 10px",
    background: "#ef4444",
    border: "none",
    borderRadius: 6,
    color: "white",
    cursor: "pointer",
  },

  empty: {
    color: "#8fa6b3",
    textAlign: "center",
  },

  disclaimer: {
    marginTop: 20,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
};