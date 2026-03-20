import React from "react";

type Props = {
  active: string;
  setActive: (tab: string) => void;
};

export default function BottomNav({ active, setActive }: Props) {
  return (
    <div style={styles.nav}>

      <button
        style={active === "home" ? styles.active : styles.btn}
        onClick={() => setActive("home")}
      >
        📊
        <span>Home</span>
      </button>

      <button
        style={active === "portfolio" ? styles.active : styles.btn}
        onClick={() => setActive("portfolio")}
      >
        📁
        <span>Portfolio</span>
      </button>

      <button
        style={active === "alerts" ? styles.active : styles.btn}
        onClick={() => setActive("alerts")}
      >
        🔔
        <span>Alerts</span>
      </button>

    </div>
  );
}

const styles: any = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 60,
    background: "#020617",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    zIndex: 1000,
  },

  btn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: 12,
    cursor: "pointer",
  },

  active: {
    background: "transparent",
    border: "none",
    color: "#00d4ff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    cursor: "pointer",
  },
};