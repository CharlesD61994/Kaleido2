import React from "react";

export default function DeleteModal({ project, onConfirm, onClose }) {
  if (!project) return null;

  return (
    <div data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} data-kaleido-modal-card="true" style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 18, padding: 24, width: "100%", maxWidth: 340 }}>
        <h3 style={{ color: "var(--k-text)", fontFamily: "'DM Sans', sans-serif", margin: "0 0 10px" }}>Supprimer "{project.name}" ?</h3>
        <p style={{ color: "var(--k-muted)", fontSize: 13, margin: "0 0 20px" }}>Cette action est irréversible.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "1px solid var(--k-border-strong)", background: "none", color: "var(--k-muted)", cursor: "pointer", fontSize: 15 }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "none", background: "#EF4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 15 }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}
