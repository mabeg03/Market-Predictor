import React from "react";
import "./dashboardLayout.css";

export default function DashboardLayout({ title, children }) {
  return (
    <div className="dashboard-card">
      <h2 className="dashboard-title">{title}</h2>
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
=======

export default function DashboardLayout({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}
