export default function ClientSummaryCard({ project, color, clientInitial, onEditClient, publicView = false }) {
  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${color.bg}30, rgba(26,26,46,0.98) 46%, rgba(30,30,50,0.96))`,
        border: `1px solid ${color.light}33`,
        borderRadius: 26,
        padding: 18,
        marginBottom: 14,
        boxShadow: `0 22px 70px rgba(0,0,0,0.36), 0 0 34px ${color.bg}18, inset 0 1px 0 rgba(255,255,255,0.07)`,
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
          <div style={{ color: "#F1F0EE", fontSize: 21, fontWeight: 800, fontFamily: "'Syne', sans-serif", lineHeight: 1.06, overflowWrap: "anywhere" }}>
            {project?.client || "Client sans nom"}
          </div>
          <div style={{ color: "#A8A6B8", fontSize: 13, marginTop: 5, overflowWrap: "anywhere" }}>
            {project?.email || "Aucun courriel"}
          </div>
        </div>

        {!publicView && (
          <button
            onClick={() => onEditClient(project)}
            style={{
              border: `1px solid ${color.light}2E`,
              borderRadius: 13,
              background: "rgba(255,255,255,0.07)",
              color: "#F1F0EE",
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
