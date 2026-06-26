export default function ClientPageHeader({ project, color, onBack, publicView = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      {!publicView && (
        <button
          data-kaleido-back-button="true"
          onClick={onBack}
          style={{
            background: "var(--k-surface-2)",
            border: "none",
            borderRadius: 10,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#A78BFA",
            fontSize: 16,
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 8px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
          aria-label="Retour au projet"
        >
          ←
        </button>
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ color: "var(--k-text)", margin: 0, fontSize: 24, lineHeight: 1.05, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: 0 }}>
          {publicView ? "Suivi de projet" : "Fiche client"}
        </h1>
        <div
          style={{
            color: color.light,
            fontSize: 11,
            fontFamily: "monospace",
            marginTop: 4,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project?.name || "Projet"}
        </div>
      </div>
    </div>
  );
}
