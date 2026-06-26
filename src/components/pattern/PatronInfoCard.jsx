import React from "react";

export default function PatronInfoCard({ patron, updatePatronInfo }) {
  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div style={{ background: "#1A1A2E", borderRadius: 16, padding: 16, border: "1px solid #ffffff0A" }}>
        <h3 style={{ color: "#F1F0EE", margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Informations du patron</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#A78BFA", fontSize: 12, fontFamily: "monospace", display: "block", marginBottom: 6 }}>TYPE DE LAINE</label>
          <input value={patron.laine} onChange={e => updatePatronInfo("laine", e.target.value)} placeholder="Ex: Coton peigné, Laine mérinos DK..."
            style={{ width: "100%", background: "#13131F", border: "1px solid #ffffff0A", borderRadius: 8, padding: "12px", color: "#F1F0EE", fontSize: 16, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: "#A78BFA", fontSize: 12, fontFamily: "monospace", display: "block", marginBottom: 6 }}>TECHNIQUE</label>
            <select value={patron.technique} onChange={e => updatePatronInfo("technique", e.target.value)}
              style={{ width: "100%", background: "#13131F", border: "1px solid #ffffff0A", borderRadius: 8, padding: "12px", color: "#F1F0EE", fontSize: 16, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
              <option value="crochet">Crochet</option>
              <option value="crochet-tunisien">Crochet tunisien</option>
              <option value="tricot">Tricot</option>
            </select>
          </div>
          <div>
            <label style={{ color: "#A78BFA", fontSize: 12, fontFamily: "monospace", display: "block", marginBottom: 6 }}>{patron.technique === "tricot" ? "AIGUILLES" : "CROCHET"}</label>
            <input value={patron.outil} onChange={e => updatePatronInfo("outil", e.target.value)} placeholder={patron.technique === "tricot" ? "Ex: 4.5mm circulaires" : "Ex: 4.5mm"}
              style={{ width: "100%", background: "#13131F", border: "1px solid #ffffff0A", borderRadius: 8, padding: "12px", color: "#F1F0EE", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <div>
          <label style={{ color: "#A78BFA", fontSize: 12, fontFamily: "monospace", display: "block", marginBottom: 6 }}>NOTES & INFOS</label>
          <textarea value={patron.notes} onChange={e => updatePatronInfo("notes", e.target.value)} placeholder="Conseils, modifications, taille finale..." rows={3}
            style={{ width: "100%", background: "#13131F", border: "1px solid #ffffff0A", borderRadius: 8, padding: "12px", color: "#F1F0EE", fontSize: 16, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>
      </div>
    </div>
  );
}
