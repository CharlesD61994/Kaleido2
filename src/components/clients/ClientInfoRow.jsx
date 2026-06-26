export default function ClientInfoRow({ label, value }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div
        style={{
          color: "#6B6A7A",
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
          color: value ? "#F1F0EE" : "#77758A",
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
