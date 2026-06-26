import React from "react";

export default function PatronEditorHeader({
  isEditingNom,
  isPatronMode,
  navigateToHub,
  navigateToLibrary,
  onSave,
  onSaveNom,
  patron,
  setIsEditingNom,
  setTempNom,
  tempNom,
  totalRangsPatron,
}) {
  return (
    <div style={{ background: "linear-gradient(180deg, #1A0A2E 0%, #0D0D1A 100%)", padding: "44px 20px 20px", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button data-kaleido-back-button="true" onClick={isPatronMode ? navigateToLibrary : navigateToHub} style={{ background: "#1E1E32", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA", fontSize: 16, cursor: "pointer" }}>←</button>
        {isEditingNom
          ? <input value={tempNom} onChange={e => setTempNom(e.target.value)} onKeyDown={e => e.key === "Enter" && onSaveNom()} onBlur={onSaveNom} onFocus={e => e.target.select()} autoFocus style={{ background: "none", border: "none", outline: "none", color: "#F1F0EE", fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", flex: 1 }} />
          : <h1 onClick={() => setIsEditingNom(true)} style={{ color: "#F1F0EE", margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", flex: 1, cursor: "pointer" }}>{patron.nom}</h1>
        }
        <button onClick={onSave} style={{ background: "linear-gradient(135deg, #059669, #34D399)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sauvegarder</button>
      </div>
      <div style={{ color: "#A78BFA", fontSize: 13, fontFamily: "monospace" }}>{patron.parties.length} parties • {totalRangsPatron} rangs</div>
    </div>
  );
}
