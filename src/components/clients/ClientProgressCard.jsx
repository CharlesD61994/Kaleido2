import ClientSectionCard from "./ClientSectionCard";
import { formatTimeMs, getProjectStats } from "../../utils/projectStats";

function StatTile({ label, value, color }) {
  return (
    <div style={{ background: "var(--k-muted-fill)", borderRadius: 14, padding: 12, border: "1px solid var(--k-border)" }}>
      <div style={{ color: "var(--k-muted-2)", fontSize: 11, marginBottom: 3 }}>{label}</div>
      <div style={{ color, fontSize: 13, fontWeight: 800, fontFamily: label === "Temps total" || label === "Moyenne" ? "monospace" : "'DM Sans', sans-serif" }}>{value}</div>
    </div>
  );
}

export default function ClientProgressCard({ color, progress, project, statusLabel }) {
  const stats = getProjectStats(project);
  const isCompleted = project?.status === "termine";

  return (
    <ClientSectionCard
      title="Statistiques du projet"
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
        <StatTile label="Rangs" value={`${stats.rowsDone}/${stats.totalRows || stats.rowsDone}`} color="var(--k-text)" />
        <StatTile label="Temps total" value={stats.elapsedTimeLabel} color={color.light} />
        {isCompleted ? <StatTile label="Moyenne" value={stats.averageTimeLabel} color="#22D3EE" /> : null}
        <StatTile label={isCompleted ? "Type" : "Statut"} value={isCompleted ? stats.typeLabel : statusLabel} color={isCompleted ? "#C4B5FD" : "var(--k-text)"} />
      </div>

      {isCompleted ? (
        <>
          <div style={{ color: "var(--k-text)", fontSize: 13, fontWeight: 800, margin: "16px 0 9px" }}>Temps par partie</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.parts.length > 0 ? stats.parts.map((part) => {
              const time = Number(stats.partTimes[String(part.id)]) || 0;
              return (
                <div key={part.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--k-muted-fill)", border: "1px solid var(--k-border)", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--k-text-soft)", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{part.name}</div>
                    <div style={{ color: "var(--k-muted-3)", fontSize: 11, marginTop: 2 }}>{part.rows} rangs</div>
                  </div>
                  <div style={{ color: color.light, fontSize: 13, fontWeight: 800, fontFamily: "monospace", flexShrink: 0 }}>{formatTimeMs(time)}</div>
                </div>
              );
            }) : (
              <div style={{ color: "var(--k-muted-3)", fontSize: 13, background: "var(--k-muted-fill)", border: "1px solid var(--k-border)", borderRadius: 12, padding: 12 }}>
                Aucun detail par partie pour ce projet.
              </div>
            )}
          </div>
        </>
      ) : null}
    </ClientSectionCard>
  );
}
