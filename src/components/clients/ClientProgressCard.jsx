import ClientSectionCard from "./ClientSectionCard";

export default function ClientProgressCard({ color, progress, elapsedTimeLabel, statusLabel }) {
  return (
    <ClientSectionCard
      title="Suivi du projet"
      right={
        <div
          style={{
            color: color.light,
            fontSize: 15,
            fontWeight: 800,
            fontFamily: "monospace",
            background: `${color.bg}22`,
            border: `1px solid ${color.light}22`,
            borderRadius: 999,
            padding: "7px 10px",
            flexShrink: 0,
          }}
        >
          {progress}%
        </div>
      }
    >
      <div style={{ height: 9, borderRadius: 999, background: "var(--k-muted-fill-2)", overflow: "hidden" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${color.bg}, ${color.light})`,
            boxShadow: `0 0 14px ${color.light}55`,
            transition: "width 260ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 13 }}>
        <div style={{ background: "var(--k-muted-fill)", borderRadius: 14, padding: 12, border: "1px solid var(--k-border)" }}>
          <div style={{ color: "var(--k-muted-2)", fontSize: 11, marginBottom: 3 }}>Temps</div>
          <div style={{ color: "var(--k-text)", fontSize: 13, fontWeight: 700 }}>{elapsedTimeLabel}</div>
        </div>
        <div style={{ background: "var(--k-muted-fill)", borderRadius: 14, padding: 12, border: "1px solid var(--k-border)" }}>
          <div style={{ color: "var(--k-muted-2)", fontSize: 11, marginBottom: 3 }}>Statut</div>
          <div style={{ color: "var(--k-text)", fontSize: 13, fontWeight: 700 }}>{statusLabel}</div>
        </div>
      </div>
    </ClientSectionCard>
  );
}
