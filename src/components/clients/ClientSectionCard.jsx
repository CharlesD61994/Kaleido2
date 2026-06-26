export default function ClientSectionCard({ title, subtitle, right, children }) {
  return (
    <section
      style={{
        background: "var(--k-panel-gradient)",
        border: "1px solid var(--k-border)",
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
        boxShadow: "0 18px 52px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.055)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: children ? 12 : 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.15 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ color: "var(--k-muted-3)", fontSize: 12, marginTop: 3, lineHeight: 1.35 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
