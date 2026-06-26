import React, { useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import Icon from "../icons/Icon";

export default function EditPdfPatronModal({ patron, onClose, onSave }) {
  const [name, setName] = useState(patron.name || "");
  const [configRangs, setConfigRangs] = useState((patron.pdfParties||[]).length > 0 || (patron.total||0) > 0);
  const [totalRangs, setTotalRangs] = useState(String(patron.total || ""));
  const [parties, setParties] = useState((patron.pdfParties || []).map((p, index) => ({ id: p.id, nom: p.nom, rangs: String(p.totalRangs), colorIdx: Number.isInteger(p.colorIdx) ? p.colorIdx : index % KALEIDOSCOPE_COLORS.length })));
  const [colorPickerPartie, setColorPickerPartie] = useState(null);
  const addPartie = () => setParties(prev => [...prev, { id: Date.now(), nom: "", rangs: "", colorIdx: prev.length % KALEIDOSCOPE_COLORS.length }]);
  const updatePartie = (id, field, val) => setParties(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  const removePartie = (id) => setParties(prev => prev.filter(p => p.id !== id));
  const totalFromParties = parties.reduce((s, p) => s + (parseInt(p.rangs) || 0), 0);
  const total = configRangs ? (parties.length > 0 ? totalFromParties : parseInt(totalRangs) || 0) : 0;
  const handleSave = () => {
    const pdfParties = parties
      .filter(p => p.nom.trim())
      .map((p, i) => ({ id: i+1, nom: p.nom.trim(), totalRangs: parseInt(p.rangs)||0, colorIdx: Number.isInteger(p.colorIdx) ? p.colorIdx : i % KALEIDOSCOPE_COLORS.length }));
    const updates = { name: name.trim(), total, pdfParties };
    onSave(updates);
  };
  return (
    <div data-kaleido-modal-backdrop="true" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div data-kaleido-modal-card="true" onClick={e => e.stopPropagation()} style={{ background: "var(--k-surface)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto", border: "1px solid #0891B244" }}>
        <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 20px" }} />
        <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 20px", textAlign: "center" }}>Modifier le patron PDF</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "#22D3EE", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nom du patron</label>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ width: "100%", background: "var(--k-field)", border: "1px solid #0891B244", borderRadius: 10, padding: "12px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={() => setConfigRangs(r => !r)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: configRangs ? "rgba(8,145,178,0.15)" : "var(--k-field)", border: `1px solid ${configRangs ? "#22D3EE44" : "var(--k-border)"}`, color: configRangs ? "#22D3EE" : "var(--k-muted-2)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: configRangs ? 16 : 24 }}>
          <span>{configRangs ? <Icon name="checkCircle" size={16} color="#22D3EE" /> : <Icon name="square" size={16} color="#6B6A7A" />}</span>
          <span>Configurer les rangs et parties</span>
        </button>
        {configRangs && (
          <div style={{ marginBottom: 24, padding: 16, background: "var(--k-field)", borderRadius: 14, border: "1px solid #0891B233" }}>
            {parties.length === 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: "#22D3EE", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nombre total de rangs</label>
                <input value={totalRangs} onChange={e => setTotalRangs(e.target.value)} type="number"
                  style={{ width: "100%", background: "var(--k-surface)", border: "1px solid #0891B244", borderRadius: 10, padding: "11px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
              </div>
            )}
            <label style={{ color: "#22D3EE", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Parties</label>
            {parties.map((p, i) => (
              <div key={p.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", width: "100%", minWidth: 0 }}>
                <button type="button" onClick={() => setColorPickerPartie(p)} aria-label="Choisir la couleur de la partie" style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg, ${KALEIDOSCOPE_COLORS[(p.colorIdx ?? i) % KALEIDOSCOPE_COLORS.length].bg}, ${KALEIDOSCOPE_COLORS[(p.colorIdx ?? i) % KALEIDOSCOPE_COLORS.length].light})`, flexShrink: 0, border: "2px solid rgba(255,255,255,0.32)", padding: 0, cursor: "pointer", boxShadow: "0 0 12px rgba(0,0,0,0.35)" }} />
                <input value={p.nom} onChange={e => updatePartie(p.id, "nom", e.target.value)} placeholder={`Partie ${i+1}`}
                  style={{ flex: 1, minWidth: 0, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", color: "#F1F0EE", fontSize: 15, outline: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }} />
                <input value={p.rangs} onChange={e => updatePartie(p.id, "rangs", e.target.value)} placeholder="Rangs" type="number"
                  style={{ width: 64, flexShrink: 0, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 8px", color: "#F1F0EE", fontSize: 15, outline: "none", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }} />
                <button onClick={() => removePartie(p.id)} style={{ width: 28, height: 28, borderRadius: 6, background: "#DC262633", border: "none", color: "#F87171", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
            ))}
            {colorPickerPartie && (
              <div onClick={() => setColorPickerPartie(null)} style={{ position: "fixed", inset: 0, zIndex: 360, background: "rgba(0,0,0,0.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 300, background: "#1A1A2E", border: "1px solid #22D3EE33", borderRadius: 20, padding: 18, boxShadow: "0 18px 60px rgba(0,0,0,0.56)" }}>
                  <h4 style={{ color: "#F1F0EE", fontFamily: "'Syne', sans-serif", fontSize: 17, margin: "0 0 6px", textAlign: "center" }}>Couleur de la partie</h4>
                  <div style={{ color: "#6B6A7A", fontSize: 12, textAlign: "center", marginBottom: 16 }}>{colorPickerPartie.nom || "Nouvelle partie"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {KALEIDOSCOPE_COLORS.map((c, idx) => (
                      <button key={idx} type="button" onClick={() => { updatePartie(colorPickerPartie.id, "colorIdx", idx); setColorPickerPartie(null); }} style={{ aspectRatio: "1", borderRadius: "50%", background: `linear-gradient(135deg, ${c.bg}, ${c.light})`, border: (colorPickerPartie.colorIdx ?? 0) === idx ? "3px solid #fff" : "2px solid rgba(255,255,255,0.16)", cursor: "pointer", boxShadow: (colorPickerPartie.colorIdx ?? 0) === idx ? `0 0 20px ${c.bg}88` : "none" }} />
                    ))}
                  </div>
                  <button type="button" onClick={() => setColorPickerPartie(null)} style={{ width: "100%", marginTop: 18, padding: "11px 14px", borderRadius: 12, border: "1px solid #333", background: "none", color: "#A8A6B8", cursor: "pointer", fontWeight: 700 }}>Annuler</button>
                </div>
              </div>
            )}
            <button onClick={addPartie} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: "1px dashed #0891B244", color: "#22D3EE", fontSize: 13, cursor: "pointer", marginTop: 4 }}>+ Ajouter une partie</button>
            {parties.length > 0 && <div style={{ color: "#6B6A7A", fontSize: 12, textAlign: "center", marginTop: 10 }}>Total : {totalFromParties} rangs</div>}
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #333", background: "none", color: "#999", fontSize: 14, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSave} disabled={!name.trim()}
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: name.trim() ? "linear-gradient(135deg, #0891B2, #22D3EE)" : "#333", color: name.trim() ? "#fff" : "#666", fontSize: 14, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed" }}>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
