export default function ClientSummaryCard({ project, color, clientInitial, onEditClient, publicView = false }) {
  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${color.bg}30, var(--k-surface) var(--k-client-summary-main-stop), var(--k-surface-2))`,
        border: `1px solid ${color.light}33`,
        borderRadius: 26,
        padding: 18,
        marginBottom: 14,
        boxShadow: `0 18px 46px rgba(0,0,0,0.12), 0 0 28px ${color.bg}18, inset 0 1px 0 rgba(255,255,255,0.07)`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", right: -34, top: -36, width: 118, height: 118, borderRadius: "50%", background: `radial-gradient(circle, ${color.light}2E, transparent 68%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 19,
            background: `linear-gradient(135deg, ${color.bg}, ${color.light})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 24,
            fontWeight: 800,
            fontFamily: "'Syne', sans-serif",
            boxShadow: `0 14px 36px ${color.bg}66`,
            flexShrink: 0,
          }}
        >
          {clientInitial}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: "var(--k-text)", fontSize: 21, fontWeight: 800, fontFamily: "'Syne', sans-serif", lineHeight: 1.06, overflowWrap: "anywhere" }}>
            {project?.client || "Client sans nom"}
          </div>
          <div style={{ color: "var(--k-muted)", fontSize: 13, marginTop: 5, overflowWrap: "anywhere" }}>
            {project?.email || "Aucun courriel"}
          </div>
        </div>

        {!publicView && (
          <button
            onClick={() => onEditClient(project)}
            style={{
              border: `1px solid ${color.light}2E`,
              borderRadius: 13,
              background: "var(--k-muted-fill-2)",
              color: "var(--k-text)",
              padding: "10px 13px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            Modifier
          </button>
        )}
      </div>
    </section>
  );
}
