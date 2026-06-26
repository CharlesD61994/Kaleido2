import { useState } from "react";
import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function ContextMenu({ project, position, onClose, onRename, onDelete, onChangePhoto, onChangeColor, onEditClient, onComplete, onRestore }) {
const [showColors, setShowColors] = useState(false);
if (!project) return null;
const color = KALEIDOSCOPE_COLORS[project.colorIdx % KALEIDOSCOPE_COLORS.length];
const isCompleted = project?.status === "termine";
const menuIconColor = "var(--k-text-soft)";
const actions = isCompleted ? [
{ icon: <Icon name="edit" size={21} color="currentColor" />, label: "Renommer", action: onRename },
onRestore ? { icon: <Icon name="undo" size={21} color="#86EFAC" />, label: "Ramener en cours", action: onRestore } : null,
].filter(Boolean) : [
{ icon: <Icon name="edit" size={21} color="currentColor" />, label: "Renommer", action: onRename },
onEditClient ? { icon: <Icon name="projects" size={21} color="currentColor" />, label: "Modifier la fiche client", action: onEditClient } : null,
{ icon: <Icon name="image" size={21} color="currentColor" />, label: "Changer la photo", action: onChangePhoto },
onComplete && !isCompleted ? { icon: <Icon name="checkBadge" size={21} color="#86EFAC" />, label: "Termine", action: onComplete } : null,
].filter(Boolean);
return (
<>
<div onClick={e => { e.stopPropagation(); onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
<div style={{ position: "fixed", top: Math.max(90, Math.min(position.y, window.innerHeight - (onEditClient ? 430 : 260))), left: Math.min(position.x - 10, window.innerWidth - 200), zIndex: 101, background: "var(--k-surface)", border: `1px solid ${color.light}44`, borderRadius: 16, padding: "8px 0", minWidth: 200, maxHeight: "min(72vh, 420px)", overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 8px 40px rgba(0,0,0,0.24)" }}>
<div style={{ padding: "8px 16px 6px", borderBottom: `1px solid ${color.light}22`, marginBottom: 4 }}>
<div style={{ color: color.light, fontSize: 11, fontFamily: "monospace", textTransform: "uppercase" }}>{project.name}</div>
</div>
{actions.map(item => (
<button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: menuIconColor, fontSize: 14, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
<span>{item.icon}</span><span>{item.label}</span>
</button>
))}
{!isCompleted && (
<>
{/* Couleur de la bulle */}
<button onClick={() => setShowColors(s => !s)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: menuIconColor, fontSize: 14, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
<div style={{ width: 18, height: 18, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, flexShrink: 0 }} />
<span>Couleur de la bulle</span>
</button>
{showColors && (
<div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 16px 10px" }}>
{KALEIDOSCOPE_COLORS.map((c, i) => (
<div key={i} onClick={() => { onChangeColor(i); onClose(); }}
style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${c.bg}, ${c.light})`, cursor: "pointer", border: project.colorIdx === i ? "3px solid #fff" : "2px solid transparent", boxSizing: "border-box" }} />
))}
</div>
)}
</>
)}
<button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: "#F87171", fontSize: 14, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
<span><Icon name="trash" size={21} color="#F87171" /></span><span>Supprimer</span>
</button>
</div>
</>
);
}
