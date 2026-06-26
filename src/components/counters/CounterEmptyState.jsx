import React from "react";
import IconBadge from "../ui/IconBadge";

export default function CounterEmptyState({ onBack, onNavigateEditor, patron, project }) {
  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "var(--k-text)", maxWidth: 430, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
        <button data-kaleido-back-button="true" onClick={onBack} style={{ background: "var(--k-surface-2)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA", fontSize: 16, cursor: "pointer" }}>←</button>
        <h1 style={{ color: "var(--k-text)", margin: 0, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>{patron.nom}</h1>
      </div>
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--k-muted-2)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><IconBadge name="yarn" tone="violet" size={24} badgeSize={52} /></div>
        <div style={{ fontSize: 16, marginBottom: 8, color: "var(--k-text)" }}>Aucun patron créé</div>
        <div style={{ fontSize: 13, marginBottom: 24 }}>Crée d'abord tes parties et rangs dans l'éditeur de patron</div>
        <button onClick={() => onNavigateEditor(project)} style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", border: "none", borderRadius: 12, padding: "12px 24px", color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Ouvrir l'éditeur</button>
      </div>
    </div>
  );
}
