import React, { useEffect, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import RangItem from "./RangItem";

export function PartieSection({ partie, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast, onAddRang, onUpdateRang, onDeleteRang, onDuplicateRang, onMoveRangUp, onMoveRangDown }) {
const [isCollapsed, setIsCollapsed] = useState(false);
const [isEditingNom, setIsEditingNom] = useState(false);
const [showColorPicker, setShowColorPicker] = useState(false);
const [tempNom, setTempNom] = useState(partie.nom);
const [displayNom, setDisplayNom] = useState(partie.nom || "Nouvelle partie");
const color = KALEIDOSCOPE_COLORS[partie.colorIdx % KALEIDOSCOPE_COLORS.length];
useEffect(() => {
const syncedNom = partie.nom || "Nouvelle partie";
setTempNom(syncedNom);
setDisplayNom(syncedNom);
}, [partie.nom]);
const handleSaveNom = () => {
const cleanNom = (tempNom || "").trim();
const finalNom = cleanNom || "Nouvelle partie";
setTempNom(finalNom);
setDisplayNom(finalNom);
onUpdate(partie.id, { nom: finalNom });
setIsEditingNom(false);
};
const handleStartEditNom = (e) => {
e.preventDefault();
e.stopPropagation();
setTempNom(displayNom || partie.nom || "Nouvelle partie");
setIsEditingNom(true);
};
const act = (e, fn) => { e.preventDefault(); e.stopPropagation(); fn(); };
return (
<div style={{ background: "#1A1A2E", border: `1px solid ${color.light}22`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
{/* Header partie */}
<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isCollapsed ? 0 : 12 }}>
{/* Rond couleur cliquable */}
<div style={{ position: "relative", flexShrink: 0 }}>
<div onClick={() => setShowColorPicker(s => !s)}
style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, cursor: "pointer", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
{showColorPicker && (
<>
<div onClick={e => { e.stopPropagation(); setShowColorPicker(false); }} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
<div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 30, left: 0, zIndex: 51, background: "#1A1A2E", border: `1px solid ${color.light}44`, borderRadius: 14, padding: 10, display: "flex", flexWrap: "wrap", gap: 8, width: 152, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
{KALEIDOSCOPE_COLORS.map((c, i) => (
<div key={i} onClick={() => { onUpdate(partie.id, { colorIdx: i }); setShowColorPicker(false); }}
style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${c.bg}, ${c.light})`, cursor: "pointer", border: partie.colorIdx === i ? "3px solid #fff" : "2px solid transparent", boxSizing: "border-box" }} />
))}
</div>
</>
)}
</div>
{/* Nom centré + rangs centré — deux colonnes */}
<div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
<div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
{isEditingNom
? <input value={tempNom} onChange={e => { const nextNom = e.target.value; setTempNom(nextNom); setDisplayNom(nextNom || "Nouvelle partie"); }} onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") handleSaveNom(); if (e.key === "Escape") { const fallbackNom = partie.nom || "Nouvelle partie"; setTempNom(fallbackNom); setDisplayNom(fallbackNom); setIsEditingNom(false); } }} onBlur={handleSaveNom} onClick={e => e.stopPropagation()} onFocus={e => { e.stopPropagation(); e.target.select(); }} autoFocus style={{ background: "none", border: "none", outline: "none", color: "#F1F0EE", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textAlign: "center", width: "100%" }} />
: <h3 onClick={handleStartEditNom} style={{ color: "#F1F0EE", margin: 0, fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", textAlign: "center", wordBreak: "break-word" }}>{displayNom}</h3>
}
</div>
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
<span style={{ color: "#F1F0EE", fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{partie.rangs.filter(r => !r.isNote).length}</span>
<span style={{ color: color.light, fontSize: 10, fontFamily: "monospace" }}>rangs</span>
</div>
</div>
<button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: "none", border: "none", color: color.light, fontSize: 14, cursor: "pointer", padding: 4, flexShrink: 0 }}>{isCollapsed ? "▼" : "▲"}</button>
<div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
{[
{ icon: "↑", dis: isFirst, fn: () => onMoveUp(partie.id), bg: isFirst ? "#333" : color.bg },
{ icon: "↓", dis: isLast, fn: () => onMoveDown(partie.id), bg: isLast ? "#333" : color.bg },
{ icon: "⧉", dis: false, fn: () => onDuplicate(partie.id), bg: color.bg },
{ icon: "✗", dis: false, fn: () => onDelete(partie.id), bg: "#DC2626" },
].map((b, i) => (
<button key={i} onClick={e => act(e, b.fn)} disabled={b.dis} style={{ background: b.bg, border: "none", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: b.dis ? "not-allowed" : "pointer" }}>{b.icon}</button>
))}
</div>
</div>
{!isCollapsed && (
<>
<div style={{ color: "#666", fontSize: 11, marginBottom: 12, fontStyle: "italic", textAlign: "center", padding: "6px 12px", background: `${color.bg}11`, borderRadius: 6, border: `1px dashed ${color.light}22` }}>
Swipe vers la gauche sur les rangs pour dupliquer ⧉ et supprimer ✗
</div>
<div style={{ marginBottom: 12 }}>
{(() => {
let rangCounter = 0;
return partie.rangs.map((rang, index) => {
const isNote = rang.isNote === true;
const displayIndex = isNote ? -1 : rangCounter++;
return (
<RangItem key={rang.id} rang={rang} rangIndex={displayIndex}
onUpdate={(rangId, updates) => onUpdateRang(partie.id, rangId, updates)}
onDelete={(rangId) => onDeleteRang(partie.id, rangId)}
onDuplicate={(rangId) => onDuplicateRang(partie.id, rangId)}
onMoveUp={(rangId) => onMoveRangUp(partie.id, rangId)}
onMoveDown={(rangId) => onMoveRangDown(partie.id, rangId)}
isFirst={index === 0} isLast={index === partie.rangs.length - 1} />
);
});
})()}
</div>
<button onClick={() => onAddRang(partie.id)} style={{ width: "100%", padding: "12px", borderRadius: 12, background: `${color.bg}22`, border: `1px dashed ${color.light}44`, color: color.light, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
+ Ajouter un rang
</button>
</>
)}
</div>
);
}
// ═══════════════════════════════════════════════════════════════
// COMPTEUR WIDGET (indépendant, swipe corrigé)
// ═══════════════════════════════════════════════════════════════
