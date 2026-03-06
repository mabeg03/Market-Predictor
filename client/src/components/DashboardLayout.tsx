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