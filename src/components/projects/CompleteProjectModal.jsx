import React from "react";

export default function CompleteProjectModal({ project, onConfirm, onClose }) {
  if (!project) return null;

  return (
    <div data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} data-kaleido-modal-card="true" style={{ background: "#1A1A2E", borderRadius: 18, padding: 24, width: "100%", maxWidth: 340, border: "1px solid rgba(52,211,153,0.24)" }}>
        <h3 style={{ color: "#F1F0EE", fontFamily: "'DM Sans', sans-serif", margin: "0 0 10px" }}>Terminer le patron ?</h3>
        <p style={{ color: "#999", fontSize: 13, lineHeight: 1.4, margin: "0 0 20px" }}>
          Le projet sera deplace dans les patrons termines.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "1px solid #333", background: "none", color: "#999", cursor: "pointer", fontSize: 15 }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #059669, #34D399)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>Terminer</button>
        </div>
      </div>
    </div>
  );
}
