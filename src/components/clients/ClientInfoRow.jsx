export default function ClientInfoRow({ label, value }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--k-border)" }}>
      <div
        style={{
          color: "var(--k-muted-2)",
          fontSize: 11,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: value ? "var(--k-text)" : "var(--k-muted-3)",
          fontSize: 15,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value || "Non renseigné"}
      </div>
    </div>
  );
}
