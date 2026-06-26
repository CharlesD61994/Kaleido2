import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

const formatTime = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatDate = (value) => {
  if (!value) return "Non indique";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non indique";
  return date.toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric" });
};

const getProjectParts = (project = {}) => {
  if (project.projectType === "pdf") {
    return (project.pdfParties || []).map((part, index) => ({
      id: String(part.id ?? index),
      name: part.nom || `Partie ${index + 1}`,
      rows: Number(part.totalRangs) || 0,
    }));
  }

  return (project.parties || []).map((part, index) => ({
    id: String(part.id ?? index),
    name: part.nom || part.name || `Partie ${index + 1}`,
    rows: (part.rangs || []).filter((rang) => !rang?.isNote).length,
  }));
};

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "var(--k-muted-fill)", border: "1px solid var(--k-border)", borderRadius: 14, padding: "12px 10px" }}>
      <div style={{ color: "var(--k-muted-3)", fontSize: 10, fontFamily: "monospace", fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ color, fontSize: 18, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
    </div>
  );
}

export default function ProjectStatsModal({ project, onClose, onOpenClientPage }) {
  if (!project) return null;

  const color = KALEIDOSCOPE_COLORS[(project.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const rowsDone = Number(project.rang) || 0;
  const totalRows = Number(project.total) || rowsDone;
  const elapsedTime = Number(project.elapsedTime) || 0;
  const averageTime = rowsDone > 0 ? elapsedTime / rowsDone : 0;
  const parts = getProjectParts(project);
  const partTimes = project.partieTimes || {};
  const canOpenClientPage = typeof onOpenClientPage === "function" && project.client;

  return (
    <div data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 230, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} data-kaleido-modal-card="true" style={{ width: "100%", maxWidth: 380, maxHeight: "84vh", overflowY: "auto", background: "#141426", border: `1px solid ${color.light}55`, borderRadius: 20, boxShadow: `0 22px 70px rgba(0,0,0,0.55), 0 0 30px ${color.bg}22`, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="chart" size={25} color="#fff" stroke={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--k-text)", fontSize: 19, fontWeight: 800, lineHeight: 1.15, fontFamily: "'DM Sans', sans-serif" }}>{project.name || "Patron terminé"}</div>
            <div style={{ color: "#8F8A9D", fontSize: 12, marginTop: 5, fontFamily: "monospace" }}>
              Termine le {formatDate(project.completedAt)}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-muted-fill)", color: "var(--k-text-soft)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>x</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <StatBox label="Rangs" value={`${rowsDone}/${totalRows || rowsDone}`} color="var(--k-text)" />
          <StatBox label="Temps total" value={formatTime(elapsedTime)} color={color.light} />
          <StatBox label="Moyenne" value={averageTime ? formatTime(averageTime) : "00:00:00"} color="#22D3EE" />
          <StatBox label="Type" value={project.projectType === "pdf" ? "PDF" : "Custom"} color="#C4B5FD" />
        </div>

        <div style={{ color: "var(--k-text)", fontSize: 13, fontWeight: 800, margin: "4px 0 10px", fontFamily: "'DM Sans', sans-serif" }}>Temps par partie</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {parts.length > 0 ? parts.map((part) => {
            const time = Number(partTimes[String(part.id)]) || 0;
            return (
              <div key={part.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--k-muted-fill)", border: "1px solid var(--k-border)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--k-text-soft)", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{part.name}</div>
                  <div style={{ color: "#77758A", fontSize: 11, marginTop: 2 }}>{part.rows} rangs</div>
                </div>
                <div style={{ color: color.light, fontSize: 13, fontWeight: 800, fontFamily: "monospace", flexShrink: 0 }}>{formatTime(time)}</div>
              </div>
            );
          }) : (
            <div style={{ color: "var(--k-muted-3)", fontSize: 13, background: "var(--k-muted-fill)", border: "1px solid var(--k-border)", borderRadius: 12, padding: 12 }}>
              Aucun détail par partie pour ce projet.
            </div>
          )}
        </div>

        {canOpenClientPage ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => onOpenClientPage(project)} style={{ minHeight: 44, padding: "11px 16px", borderRadius: 13, border: `1px solid ${color.light}55`, background: `${color.bg}44`, color: "var(--k-text)", cursor: "pointer", fontWeight: 800 }}>
              Fiche client
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
