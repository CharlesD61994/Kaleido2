import React from "react";
import Icon from "../icons/Icon";

export default function PersonalProjectToolbar({
  activeFilter,
  projects,
  search,
  setActiveFilter,
  setSearch,
  termines,
  totalRangs,
}) {
  const stats = [
    { label: "PROJETS", value: projects.length, icon: <Icon name="projects" size={28} stroke={2.2} color="#A78BFA" />, border: "#7C3AED", glow: "#7C3AED" },
    { label: "RANGS", value: totalRangs > 999 ? `${(totalRangs / 1000).toFixed(1)}k` : totalRangs, icon: <Icon name="chart" size={28} stroke={2.2} color="#22D3EE" />, border: "#0891B2", glow: "#0891B2" },
    { label: "TERMINÉS", value: termines, icon: <Icon name="checkBadge" size={28} stroke={2.2} color="#34D399" />, border: "#059669", glow: "#059669" },
  ];

  return (
    <div style={{ padding: "0 20px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ flex: 1, background: "#111128", borderRadius: 14, padding: "12px 8px", textAlign: "center", border: `1px solid ${stat.border}88`, boxShadow: `0 0 14px ${stat.glow}44, inset 0 0 12px ${stat.glow}11` }}>
            <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ color: "#F1F0EE", fontWeight: 700, fontSize: 20 }}>{stat.value}</div>
            <div style={{ color: "#6B6A7A", fontSize: 10, marginTop: 2, fontFamily: "monospace", letterSpacing: 0.5 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#1A1A2E", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.12)" }}>
        <span style={{ color: "#6B6A7A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="search" size={16} color="#6B6A7A" />
        </span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un projet..."
          style={{ background: "none", border: "none", outline: "none", color: "#F1F0EE", flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {["Tous", "En cours", "Terminés", "PDF", "Crochet", "Tricot"].map((filter) => (
          <button key={filter} onClick={() => setActiveFilter(filter)} style={{ padding: "5px 12px", borderRadius: 9999, border: `1px solid ${activeFilter === filter ? "#A78BFA" : "#333"}`, background: activeFilter === filter ? "#7C3AED33" : "none", color: activeFilter === filter ? "#A78BFA" : "#6B6A7A", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>{filter}</button>
        ))}
      </div>
    </div>
  );
}
