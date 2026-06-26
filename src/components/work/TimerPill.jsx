import { useState } from "react";

export default function TimerPill({ timeText, isTimerRunning, onToggleTimer, onResetTimer, color }) {
  const [open, setOpen] = useState(false);
  const accent = color?.light || "#A78BFA";
  const bg = color?.bg || "#7C3AED";

  return (
    <div style={{ display: "inline-flex", justifyContent: "flex-end", position: "relative", zIndex: 45, height: 15, alignItems: "center", transform: "translateY(-7px)" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          border: `1px solid ${accent}44`,
          borderRadius: 999,
          background: isTimerRunning ? `${bg}33` : "var(--k-muted-fill)",
          color: "var(--k-text)",
          padding: "1px 7px",
          fontSize: 11,
          fontFamily: "monospace",
          fontWeight: 900,
          cursor: "pointer",
          lineHeight: 1.15,
          boxShadow: isTimerRunning ? `0 0 16px ${bg}33` : "none",
        }}
      >
        {timeText}
      </button>

      {open ? (
        <div data-kaleido-modal-card="true" style={{ position: "absolute", top: 22, right: 0, background: "var(--k-surface)", border: `1px solid ${accent}44`, borderRadius: 14, padding: 10, boxShadow: "0 18px 48px rgba(0,0,0,0.30)", width: 172 }}>
          <div style={{ color: "var(--k-text)", fontSize: 18, fontFamily: "monospace", fontWeight: 900, textAlign: "center", marginBottom: 9 }}>{timeText}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button type="button" onClick={onToggleTimer} style={{ background: isTimerRunning ? "#DC2626" : "#059669", border: "none", borderRadius: 10, padding: "8px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}>{isTimerRunning ? "PAUSE" : "PLAY"}</button>
            <button type="button" onClick={onResetTimer} style={{ background: "#7C3AED", border: "none", borderRadius: 10, padding: "8px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}>RESET</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
