import React, { useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import Icon from "../icons/Icon";

export default function ImportPdfModal({ onClose, onCreate }) {
const [name, setName] = useState("");
const [pdfData, setPdfData] = useState(null);
const [pdfName, setPdfName] = useState("");
const [loading, setLoading] = useState(false);
const [configRangs, setConfigRangs] = useState(false);
const [totalRangs, setTotalRangs] = useState("");
const [parties, setParties] = useState([]);
const [colorPickerPartie, setColorPickerPartie] = useState(null);
const handleFile = (e) => {
const file = e.target.files[0];
if (!file || file.type !== "application/pdf") return;
setLoading(true); setPdfName(file.name);
if (!name) setName(file.name.replace(".pdf", ""));
const reader = new FileReader();
reader.onload = (ev) => { setPdfData(ev.target.result); setLoading(false); };
reader.readAsDataURL(file);
};
const addPartie = () => setParties(prev => [...prev, { id: Date.now(), nom: "", rangs: "", colorIdx: prev.length % KALEIDOSCOPE_COLORS.length }]);
const updatePartie = (id, field, val) => setParties(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
const removePartie = (id) => setParties(prev => prev.filter(p => p.id !== id));
const totalFromParties = parties.reduce((s, p) => s + (parseInt(p.rangs) || 0), 0);
const total = configRangs ? (parties.length > 0 ? totalFromParties : parseInt(totalRangs) || 0) : 0;
const canCreate = name.trim() && pdfData && !loading;
return (
<div data-kaleido-modal-backdrop="true" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
<div data-kaleido-modal-card="true" onClick={e => e.stopPropagation()} style={{ background: "var(--k-surface)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto", border: "1px solid #0891B244" }}>
<div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 20px" }} />
<h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 20px", textAlign: "center" }}>Importer un patron PDF</h3>
{/* Nom */}
<div style={{ marginBottom: 14 }}>
<label style={{ color: "#22D3EE", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nom du projet</label>
<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tuque Noël, Écharpe hiver..."
style={{ width: "100%", background: "var(--k-field)", border: "1px solid #0891B244", borderRadius: 10, padding: "12px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
</div>
{/* Upload PDF */}
<div style={{ marginBottom: 20 }}>
<label style={{ color: "#22D3EE", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Fichier PDF</label>
<label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: pdfData ? "rgba(8,145,178,0.15)" : "var(--k-field)", border: `1px dashed ${pdfData ? "#22D3EE" : "#0891B244"}`, borderRadius: 10, cursor: "pointer" }}>
<span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{loading ? <Icon name="settings" size={18} color="#22D3EE" style={{ opacity: 0.9 }} /> : pdfData ? <Icon name="checkCircle" size={18} color="#22D3EE" /> : <Icon name="file" size={18} color="#6B6A7A" />}</span>
<div>
<div style={{ color: pdfData ? "#22D3EE" : "#6B6A7A", fontSize: 14, fontWeight: pdfData ? 600 : 400 }}>
{loading ? "Chargement..." : pdfData ? pdfName : "Appuyer pour choisir un PDF"}
</div>
{pdfData && <div style={{ color: "#6B6A7A", fontSize: 11, marginTop: 2 }}>PDF chargé ✓</div>}
</div>
<input type="file" accept="application/pdf" onChange={handleFile} style={{ display: "none" }} />
</label>
</div>
{/* Toggle configurer rangs */}
<div style={{ marginBottom: configRangs ? 16 : 24 }}>
<button onClick={() => setConfigRangs(r => !r)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: configRangs ? "rgba(8,145,178,0.15)" : "var(--k-field)", border: `1px solid ${configRangs ? "#22D3EE44" : "var(--k-border)"}`, color: configRangs ? "#22D3EE" : "var(--k-muted-2)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "'DM Sans', sans-serif" }}>
<span>{configRangs ? <Icon name="checkCircle" size={16} color="#22D3EE" /> : <Icon name="square" size={16} color="#6B6A7A" />}</span>
<span>Configurer les rangs et parties <span style={{ color: "#6B6A7A", fontSize: 12 }}>(optionnel)</span></span>
</button>
</div>
{/* Section rangs optionnelle */}
{configRangs && (
<div style={{ marginBottom: 24, padding: 16, background: "var(--k-field)", borderRadius: 14, border: "1px solid #0891B233" }}>
{/* Total rangs (seulement si pas de parties) */}
{parties.length === 0 && (
<div style={{ marginBottom: 14 }}>
<label style={{ color: "#22D3EE", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nombre total de rangs</label>
<input value={totalRangs} onChange={e => setTotalRangs(e.target.value)} placeholder="Ex: 120" type="number"
style={{ width: "100%", background: "var(--k-surface)", border: "1px solid #0891B244", borderRadius: 10, padding: "11px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
</div>
)}
{/* Parties */}
<label style={{ color: "#22D3EE", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Parties <span style={{ color: "#6B6A7A", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
{parties.map((p, i) => (
<div key={p.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", width: "100%", minWidth: 0 }}>
<button
type="button"
onClick={() => setColorPickerPartie(p)}
aria-label="Choisir la couleur de la partie"
style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg, ${KALEIDOSCOPE_COLORS[(p.colorIdx ?? i) % KALEIDOSCOPE_COLORS.length].bg}, ${KALEIDOSCOPE_COLORS[(p.colorIdx ?? i) % KALEIDOSCOPE_COLORS.length].light})`, flexShrink: 0, border: "2px solid rgba(255,255,255,0.32)", padding: 0, cursor: "pointer", boxShadow: "0 0 12px rgba(0,0,0,0.35)" }}
/>
<input value={p.nom} onChange={e => updatePartie(p.id, "nom", e.target.value)} placeholder={`Partie ${i + 1}`}
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
<button
key={idx}
type="button"
onClick={() => { updatePartie(colorPickerPartie.id, "colorIdx", idx); setColorPickerPartie(null); }}
style={{ aspectRatio: "1", borderRadius: "50%", background: `linear-gradient(135deg, ${c.bg}, ${c.light})`, border: (colorPickerPartie.colorIdx ?? 0) === idx ? "3px solid #fff" : "2px solid rgba(255,255,255,0.16)", cursor: "pointer", boxShadow: (colorPickerPartie.colorIdx ?? 0) === idx ? `0 0 20px ${c.bg}88` : "none" }}
/>
))}
</div>
<button type="button" onClick={() => setColorPickerPartie(null)} style={{ width: "100%", marginTop: 18, padding: "11px 14px", borderRadius: 12, border: "1px solid #333", background: "none", color: "#A8A6B8", cursor: "pointer", fontWeight: 700 }}>Annuler</button>
</div>
</div>
)}
<button onClick={addPartie} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: "1px dashed #0891B244", color: "#22D3EE", fontSize: 13, cursor: "pointer", marginTop: 4 }}>
+ Ajouter une partie
</button>
{parties.length > 0 && (
<div style={{ color: "#6B6A7A", fontSize: 12, textAlign: "center", marginTop: 10 }}>Total : {totalFromParties} rangs</div>
)}
</div>
)}
<div style={{ display: "flex", gap: 12 }}>
<button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #333", background: "none", color: "#999", fontSize: 14, cursor: "pointer" }}>Annuler</button>
<button onClick={() => canCreate && onCreate(name.trim(), pdfData, total, parties)} disabled={!canCreate}
style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: canCreate ? "linear-gradient(135deg, #0891B2, #22D3EE)" : "#333", color: canCreate ? "#fff" : "#666", fontSize: 14, fontWeight: 700, cursor: canCreate ? "pointer" : "not-allowed" }}>
Créer la bulle
</button>
</div>
</div>
</div>
);
}
