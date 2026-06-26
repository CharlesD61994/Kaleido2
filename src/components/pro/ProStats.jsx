import Icon from "../icons/Icon";

export default function ProStats({ projectCount, totalRangs, completedCount }) {
  const stats = [
    { label: "PROJETS", value: projectCount, icon: <Icon name="projects" size={28} stroke={2.2} color="#A78BFA" />, border: "#7C3AED", glow: "#7C3AED" },
    { label: "RANGS", value: totalRangs > 999 ? `${(totalRangs / 1000).toFixed(1)}k` : totalRangs, icon: <Icon name="chart" size={28} stroke={2.2} color="#22D3EE" />, border: "#0891B2", glow: "#0891B2" },
    { label: "TERMINÉS", value: completedCount, icon: <Icon name="checkBadge" size={28} stroke={2.2} color="#34D399" />, border: "#059669", glow: "#059669" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            flex: 1,
            background: "#111128",
            borderRadius: 14,
            padding: "12px 8px",
            textAlign: "center",
            border: `1px solid ${stat.border}88`,
            boxShadow: `0 0 14px ${stat.glow}44, inset 0 0 12px ${stat.glow}11`,
          }}
        >
          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
            {stat.icon}
          </div>
          <div style={{ color: "#F1F0EE", fontWeight: 700, fontSize: 20 }}>{stat.value}</div>
          <div style={{ color: "#6B6A7A", fontSize: 10, marginTop: 2, fontFamily: "monospace", letterSpacing: 0.5 }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
