import React, { useState } from "react";
import Icon from "../icons/Icon";

export default function RangItem({ rang, rangIndex, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }) {
const [isEditing, setIsEditing] = useState(false);
const [tempInstruction, setTempInstruction] = useState(rang.instruction);
const [tempMailles, setTempMailles] = useState(rang.mailles || "");
const [isSwipedOpen, setIsSwipedOpen] = useState(false);
const [swipeStartX, setSwipeStartX] = useState(0);
const [swipeCurrentX, setSwipeCurrentX] = useState(0);
const isNote = rang.isNote === true;
const handleSave = (e) => { e.preventDefault(); e.stopPropagation(); onUpdate(rang.id, { instruction: tempInstruction, mailles: tempMailles ? parseInt(tempMailles) : null }); setIsEditing(false); };
const handleCancel = (e) => { e.preventDefault(); e.stopPropagation(); setTempInstruction(rang.instruction); setTempMailles(rang.mailles || ""); setIsEditing(false); };
const handleEditClick = (e) => { if (isEditing || isSwipedOpen) return; e.preventDefault(); e.stopPropagation(); setIsEditing(true); };
const handleActionClick = (e, action) => { e.preventDefault(); e.stopPropagation(); setIsSwipedOpen(false); action(); };
// Carte note/texte
if (isNote) {
return (
<div onTouchStart={e => { setSwipeStartX(e.touches[0].clientX); setSwipeCurrentX(e.touches[0].clientX); }}
onTouchMove={e => setSwipeCurrentX(e.touches[0].clientX)}
onTouchEnd={() => { const d = swipeStartX - swipeCurrentX; if (d > 50) setIsSwipedOpen(true); else if (d < -50) setIsSwipedOpen(false); }}
onClick={() => { if (isSwipedOpen) setIsSwipedOpen(false); }}
style={{ background: "var(--k-surface)", border: "1px dashed #D9770644", borderRadius: 12, padding: 12, marginBottom: 8, position: "relative", overflow: "hidden" }}>
<div style={{ display: "flex", alignItems: "flex-start", gap: 12, transform: isSwipedOpen ? "translateX(-80px)" : "translateX(0)", transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
<div style={{ background: "#D9770622", borderRadius: 8, padding: "8px 10px", flexShrink: 0 }}>
<Icon name="note" size={16} color="#FCD34D" />
</div>
<div style={{ flex: 1 }}>
{isEditing ? (
<div>
<textarea value={tempInstruction} onChange={e => setTempInstruction(e.target.value)} onFocus={e => e.target.select()} rows={3} autoFocus
style={{ width: "100%", background: "var(--k-field)", border: "1px solid #D9770644", borderRadius: 8, padding: 12, color: "var(--k-text)", fontSize: 16, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 8 }} />
<div style={{ display: "flex", gap: 8 }}>
<button onClick={handleSave} style={{ background: "#D97706", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Sauvegarder</button>
<button onClick={handleCancel} style={{ background: "#666", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}>Annuler</button>
</div>
</div>
) : (
<div onClick={handleEditClick} style={{ cursor: "pointer" }}>
<div style={{ color: "#FCD34D", fontSize: 14, lineHeight: 1.5, wordWrap: "break-word", whiteSpace: "pre-wrap" }}>{rang.instruction}</div>
<div style={{ color: "#D97706", fontSize: 10, marginTop: 4, fontStyle: "italic" }}>Note • Ne compte pas comme un rang</div>
</div>
)}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
<button onClick={e => { e.stopPropagation(); onMoveUp(rang.id); }} disabled={isFirst} style={{ background: isFirst ? "#333" : "#D97706", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: isFirst ? "not-allowed" : "pointer" }}>↑</button>
<button onClick={e => { e.stopPropagation(); onMoveDown(rang.id); }} disabled={isLast} style={{ background: isLast ? "#333" : "#D97706", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: isLast ? "not-allowed" : "pointer" }}>↓</button>
</div>
</div>
<div style={{ position: "absolute", top: 12, right: isSwipedOpen ? 12 : -80, display: "flex", flexDirection: "column", gap: 4, transition: "right 260ms cubic-bezier(0.22, 1, 0.36, 1)", zIndex: 10 }}>
<button onClick={e => handleActionClick(e, () => onUpdate(rang.id, { isNote: false }))} style={{ background: "#7C3AED", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, cursor: "pointer" }}><Icon name="undo" size={16} color="#fff" /></button>
<button onClick={e => handleActionClick(e, () => onDelete(rang.id))} style={{ background: "#DC2626", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: "pointer" }}>✗</button>
</div>
</div>
);
}
// Carte rang normal
return (
<div onTouchStart={e => { if (!isEditing) { setSwipeStartX(e.touches[0].clientX); setSwipeCurrentX(e.touches[0].clientX); } }}
onTouchMove={e => { if (!isEditing) setSwipeCurrentX(e.touches[0].clientX); }}
onTouchEnd={() => { if (!isEditing) { const d = swipeStartX - swipeCurrentX; if (d > 50) setIsSwipedOpen(true); else if (d < -50) setIsSwipedOpen(false); } }}
onClick={() => { if (isSwipedOpen && !isEditing) setIsSwipedOpen(false); }}
style={{ background: "var(--k-field)", border: isSwipedOpen ? "1px solid #7C3AED44" : "1px solid var(--k-border)", borderRadius: 12, padding: 12, marginBottom: 8, position: "relative", overflow: "hidden" }}>
<div style={{ display: "flex", alignItems: "flex-start", gap: 12, transform: isSwipedOpen ? "translateX(-76px)" : "translateX(0)", transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
<div style={{ background: "#7C3AED22", borderRadius: 8, padding: "8px 12px", minWidth: 40, textAlign: "center", flexShrink: 0 }}>
<span style={{ color: "#A78BFA", fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>{rangIndex + 1}</span>
</div>
<div style={{ flex: 1 }}>
{isEditing ? (
<div style={{ width: "100%" }}>
<textarea value={tempInstruction} onChange={e => setTempInstruction(e.target.value)} onFocus={e => e.target.select()} placeholder="Instruction du rang..." rows={3} autoFocus
style={{ width: "100%", background: "var(--k-field)", border: "1px solid #A78BFA44", borderRadius: 8, padding: "12px", color: "var(--k-text)", fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
<input value={tempMailles} onChange={e => setTempMailles(e.target.value)} placeholder="Nb mailles" type="number"
style={{ background: "var(--k-field)", border: "1px solid #A78BFA44", borderRadius: 8, padding: "10px 12px", color: "var(--k-text)", fontSize: 16, width: 100, outline: "none" }} />
<button onClick={handleSave} style={{ background: "#059669", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Sauvegarder</button>
<button onClick={handleCancel} style={{ background: "#666", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}>Annuler</button>
</div>
</div>
) : (
<div style={{ width: "100%", cursor: "pointer" }} onClick={handleEditClick}>
<div style={{ color: "var(--k-text)", fontSize: 14, lineHeight: 1.5, marginBottom: 6, wordWrap: "break-word", whiteSpace: "pre-wrap" }}>{rang.instruction}</div>
{rang.mailles && <div style={{ color: "#A78BFA", fontSize: 12, fontFamily: "monospace", marginBottom: 4 }}>{rang.mailles} mailles</div>}
<div style={{ color: "#666", fontSize: 11, fontStyle: "italic" }}>Swipe ← pour actions • Clic pour modifier</div>
</div>
)}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
<button onClick={(e) => { e.stopPropagation(); onMoveUp(rang.id); }} disabled={isFirst} style={{ background: isFirst ? "#333" : "#7C3AED", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: isFirst ? "not-allowed" : "pointer" }}>↑</button>
<button onClick={(e) => { e.stopPropagation(); onMoveDown(rang.id); }} disabled={isLast} style={{ background: isLast ? "#333" : "#7C3AED", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: isLast ? "not-allowed" : "pointer" }}>↓</button>
</div>
</div>
<div style={{ position: "absolute", top: "50%", right: isSwipedOpen ? 8 : -80, transform: "translateY(-50%)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, transition: "right 260ms cubic-bezier(0.22, 1, 0.36, 1)", zIndex: 10, width: 72 }}>
<button onClick={(e) => handleActionClick(e, () => onUpdate(rang.id, { isNote: true }))} style={{ background: "#D97706", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, cursor: "pointer" }}><Icon name="note" size={15} color="#fff" /></button>
<button onClick={(e) => handleActionClick(e, () => onDuplicate(rang.id))} style={{ background: "#0891B2", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: "pointer" }}>⧉</button>
<button onClick={(e) => handleActionClick(e, () => onDelete(rang.id))} style={{ background: "#DC2626", border: "none", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, cursor: "pointer" }}>✗</button>
</div>
</div>
);
}
