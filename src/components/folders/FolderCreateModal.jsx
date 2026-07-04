import React, { useState } from "react";
import IconBadge from "../ui/IconBadge";

export default function FolderCreateModal({ sectionLabel = "cette section", onClose, onCreate }) {
  const [name, setName] = useState("");

  const submit = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    onCreate?.(cleanName);
    setName("");
  };

  return (
    <div data-kaleido-modal-backdrop="true" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 220, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div data-kaleido-modal-card="true" onClick={(e) => e.stopPropagation()} style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "24px 24px 0 0", padding: "24px 20px 38px", width: "100%", maxWidth: 430 }}>
        <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 22px" }} />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <IconBadge name="folder" tone="violet" size={24} />
        </div>
        <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 6px", textAlign: "center" }}>Nouveau dossier</h3>
        <p style={{ color: "var(--k-muted-2)", fontSize: 13, textAlign: "center", margin: "0 0 18px" }}>Dans {sectionLabel}</p>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          placeholder="Nom du dossier"
          style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--k-control-border)", background: "var(--k-surface-2)", color: "var(--k-text)", borderRadius: 14, padding: "14px 15px", outline: "none", fontSize: 16, fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim()}
          style={{ width: "100%", border: "none", borderRadius: 16, padding: "15px 18px", background: name.trim() ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "var(--k-muted-fill)", color: "#fff", fontWeight: 900, fontSize: 15, cursor: name.trim() ? "pointer" : "not-allowed" }}
        >
          Créer
        </button>
      </div>
    </div>
  );
}
