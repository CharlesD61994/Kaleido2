export default function ClientPageHeader({ project, onBack, publicView = false, themeMode = "dark", onToggleTheme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      {!publicView && (
        <button
          data-kaleido-back-button="true"
          onClick={onBack}
          style={{
            background: "var(--k-surface-2)",
            border: "1px solid var(--k-control-border)",
            borderRadius: 10,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#A78BFA",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Retour au projet"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ color: "var(--k-text)", margin: 0, fontSize: 24, lineHeight: 1.05, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: 0 }}>
          {publicView ? "Suivi de projet" : "Fiche client"}
        </h1>
        <div
          style={{
            color: "var(--k-muted)",
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

      {publicView && typeof onToggleTheme === "function" ? (
        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            border: "1px solid var(--k-control-border)",
            borderRadius: 999,
            background: "var(--k-surface-2)",
            color: "var(--k-text)",
            padding: "8px 11px",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {themeMode === "light" ? "Sombre" : "Clair"}
        </button>
      ) : null}
    </div>
  );
}
