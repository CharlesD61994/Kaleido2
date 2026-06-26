import React, { useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import TimerPill from "../work/TimerPill";

export default function CounterWidget({ counter, onUpdate, onDelete, onAddNew, globalRangCount }) {
const [isEditing, setIsEditing] = useState(false);
const [tempName, setTempName] = useState(counter.name);
const [isSwipedOpen, setIsSwipedOpen] = useState(false);
const [swipeStartX, setSwipeStartX] = useState(0);
const [isEditingMax, setIsEditingMax] = useState(false);
const [tempMax, setTempMax] = useState("");
const col = KALEIDOSCOPE_COLORS[counter.colorIdx % KALEIDOSCOPE_COLORS.length];
const displayValue = counter.syncWithGlobal ? ((globalRangCount - 1) % (counter.maxRepeats || 4)) + 1 : counter.value;
// Swipe handlers — séparés pour éviter les conflits
const onTS = (e) => { if (!isEditing && !isEditingMax) setSwipeStartX(e.touches[0].clientX); };
const onTM = (e) => { if (!isEditing && !isEditingMax && swipeStartX - e.touches[0].clientX > 30) setIsSwipedOpen(true); };
const onTE = (e) => { const t = e.changedTouches?.[0]; if (t && !isEditing && !isEditingMax && swipeStartX - t.clientX < -30) setIsSwipedOpen(false); };
// Action bouton: stopPropagation pour ne pas fermer le menu
const doAction = (e, fn) => { e.stopPropagation(); fn(); };
return (
<div onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
onClick={e => { if (isSwipedOpen && !isEditing && !isEditingMax) { e.stopPropagation(); setIsSwipedOpen(false); } }}
style={{ background: "rgba(30,30,50,0.8)", backdropFilter: "blur(10px)", border: `1px solid ${col.light}44`, borderRadius: 12, padding: 12, textAlign: "center", position: "relative", overflow: "hidden" }}>
<div style={{ transform: isSwipedOpen ? "translateX(-95px)" : "translateX(0)", transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
<div style={{ marginBottom: 8 }}>
{isEditing
? <input value={tempName} onChange={e => setTempName(e.target.value)}
onKeyDown={e => e.key === "Enter" && (onUpdate({ name: tempName }), setIsEditing(false))}
onBlur={() => (onUpdate({ name: tempName }), setIsEditing(false))}
onFocus={e => e.target.select()} autoFocus style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${col.light}44`, borderRadius: 6, padding: "4px 8px", color: "#F1F0EE", fontSize: 16, outline: "none", textAlign: "center", fontFamily: "'DM Sans', sans-serif", width: "100%", fontWeight: 600 }} />
: <div onClick={e => { e.stopPropagation(); setIsEditing(true); }} style={{ color: col.light, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", fontWeight: 600 }}>{counter.name}</div>
}
</div>
<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
<button onClick={e => { e.stopPropagation(); if (!counter.syncWithGlobal) onUpdate({ value: counter.value <= 1 ? (counter.maxRepeats || 4) : counter.value - 1 }); }} disabled={counter.syncWithGlobal}
style={{ background: counter.syncWithGlobal ? "#333" : col.bg, border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: counter.syncWithGlobal ? "not-allowed" : "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
<span style={{ color: "#F1F0EE", fontSize: 24, fontWeight: 700, fontFamily: "monospace", minWidth: 50, textAlign: "center" }}>{displayValue}</span>
<button onClick={e => { e.stopPropagation(); if (!counter.syncWithGlobal) onUpdate({ value: counter.value >= (counter.maxRepeats || 4) ? 1 : counter.value + 1 }); }} disabled={counter.syncWithGlobal}
style={{ background: counter.syncWithGlobal ? "#333" : col.bg, border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: counter.syncWithGlobal ? "not-allowed" : "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Nouveau projet">+</button>
</div>
{counter.syncWithGlobal && <div style={{ color: "#666", fontSize: 10, marginTop: 6, fontStyle: "italic" }}>Sync • Reset après {counter.maxRepeats || 4}</div>}
</div>
{/* Actions swipe — stopPropagation sur chaque bouton */}
<div style={{ position: "absolute", top: "50%", right: isSwipedOpen ? 6 : -95, transform: "translateY(-50%)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, transition: "right 260ms cubic-bezier(0.22, 1, 0.36, 1)", zIndex: 10, width: 85 }}>
<button onClick={e => doAction(e, () => onUpdate({ syncWithGlobal: !counter.syncWithGlobal }))}
style={{ background: counter.syncWithGlobal ? col.bg : "#666", border: "none", borderRadius: 6, padding: "4px 5px", color: "#fff", fontSize: 9, cursor: "pointer", fontWeight: 600, height: 28 }}>SYNC</button>
{isEditingMax
? <input value={tempMax} onChange={e => setTempMax(e.target.value)}
onKeyDown={e => { if (e.key === "Enter") { onUpdate({ maxRepeats: Math.max(2, Math.min(20, parseInt(tempMax) || 4)) }); setIsEditingMax(false); setTempMax(""); setIsSwipedOpen(false); } }}
onBlur={() => { onUpdate({ maxRepeats: Math.max(2, Math.min(20, parseInt(tempMax) || 4)) }); setIsEditingMax(false); setTempMax(""); }}
onFocus={e => e.target.select()} autoFocus type="number" min="2" max="20"
onClick={e => e.stopPropagation()}
style={{ background: "#333", border: `1px solid ${col.light}44`, borderRadius: 6, padding: "4px 5px", color: "#F1F0EE", fontSize: 16, outline: "none", textAlign: "center", width: "100%", height: 28 }} />
: <button onClick={e => doAction(e, () => { setTempMax(String(counter.maxRepeats || 4)); setIsEditingMax(true); })}
style={{ background: "#7C3AED", border: "none", borderRadius: 6, padding: "4px 5px", color: "#fff", fontSize: 9, cursor: "pointer", fontWeight: 600, height: 28 }}>MAX {counter.maxRepeats || 4}</button>
}
{onAddNew && <button onClick={e => doAction(e, () => { onAddNew(); setIsSwipedOpen(false); })}
style={{ background: "#059669", border: "none", borderRadius: 6, padding: "4px 5px", color: "#fff", fontSize: 9, cursor: "pointer", fontWeight: 600, height: 28 }}>ADD</button>}
<button onClick={e => doAction(e, onDelete)}
style={{ background: "#DC2626", border: "none", borderRadius: 6, padding: "4px 5px", color: "#fff", fontSize: 9, cursor: "pointer", fontWeight: 600, height: 28 }}>DEL</button>
</div>
{isSwipedOpen && <div style={{ position: "absolute", bottom: 6, right: 8, color: col.light, fontSize: 8, opacity: 0.7 }}>→</div>}
</div>
);
}
// ═══════════════════════════════════════════════════════════════
// COMPTEUR DE RANGS (composant indépendant — corrige le bug reset)
// ═══════════════════════════════════════════════════════════════
export function ProgressionSwipeCard({ currentPartieColor, currentIndex, totalRangs, circ_r, circ_c, currentPartie, currentPartieRangIndex, currentPartieTotal, onAddCounter, currentCountIndex, compact = false, timerProps = null, onPrevRang = null, onNextRang = null, canPrev = true, canNext = true }) {
const [swiped, setSwiped] = useState(false);
const [startX, setStartX] = useState(0);
const circleSize = compact ? 82 : 95;
const circleCenter = circleSize / 2;
const circleRadius = compact ? 35 : circ_r;
const circleCirc = 2 * Math.PI * circleRadius;
const labelSize = compact ? 12 : 13;
const countSize = compact ? 28 : 26;
const barHeight = compact ? 8 : 8;
const localRangNumber = Math.max(0, currentPartieRangIndex + 1);
const showInlineControls = compact && typeof onPrevRang === "function" && typeof onNextRang === "function";
return (
<div
onTouchStart={e => setStartX(e.touches[0].clientX)}
onTouchMove={e => { if (startX - e.touches[0].clientX > 40) setSwiped(true); }}
onTouchEnd={e => { if (startX - e.changedTouches[0].clientX < -40) setSwiped(false); }}
onClick={() => swiped && setSwiped(false)}
style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 16, paddingBottom: compact ? 0 : 12, position: "relative", overflow: "hidden", width: "100%" }}>
<div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 16, flex: 1, minWidth: 0, padding: compact && showInlineControls ? "18px 0 7px" : 0, transform: swiped ? `translateX(${compact ? "-84px" : "-110px"})` : "translateX(0)", transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
{/* Cercle */}
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
<div style={{ color: currentPartieColor.light, fontSize: labelSize, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Global</div>
<div key={`progress-${currentCountIndex}-${totalRangs}`} style={{ position: "relative", width: circleSize, height: circleSize, filter: `drop-shadow(0 0 10px ${currentPartieColor.bg}33)`, transformOrigin: "center", animation: "kaleidoProgressCleanPulse 340ms cubic-bezier(0.25, 0.9, 0.35, 1)" }}>
<svg width={circleSize} height={circleSize} style={{ transform: "rotate(-90deg)" }}>
<circle cx={circleCenter} cy={circleCenter} r={circleRadius} stroke="rgba(255,255,255,0.1)" strokeWidth={compact ? 3 : 4} fill="none" />
<circle cx={circleCenter} cy={circleCenter} r={circleRadius} stroke="url(#kg)" strokeWidth={compact ? 3 : 4} fill="none"
strokeDasharray={circleCirc} strokeDashoffset={circleCirc * (1 - Math.max(0, currentCountIndex + 1) / totalRangs)}
strokeLinecap="round" style={{
  transition: "stroke-dashoffset 0.56s cubic-bezier(0.22, 1, 0.36, 1)",
  color: currentPartieColor.light,
  filter: "drop-shadow(0 0 4px currentColor)",
  animation: "kaleidoProgressCleanGlow 340ms cubic-bezier(0.25, 0.9, 0.35, 1)"
}} />
<defs><linearGradient id="kg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stopColor={currentPartieColor.bg} />
<stop offset="100%" stopColor={currentPartieColor.light} />
</linearGradient></defs>
</svg>
<div style={{ position: "absolute", top:0, left:0, right:0, bottom:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
<div style={{ color: "#F1F0EE", fontSize: countSize, fontWeight: 700, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{Math.max(0, currentCountIndex + 1)}</div>
<div style={{ color: currentPartieColor.light, fontSize: compact ? 10 : 12, fontFamily: "monospace", marginTop: compact ? 1 : 3 }}>/ {totalRangs}</div>
</div>
</div>
{!compact && <div style={{ color: "#6B6A7A", fontSize: 10, fontFamily: "monospace" }}>{Math.round(Math.max(0, currentCountIndex + 1)/totalRangs*100)}%</div>}
</div>
{/* Barre partie */}
<div style={{ flex: 1, minWidth: 0, maxWidth: compact ? 230 : "none", position: "relative" }}>
{compact && timerProps ? (
<div style={{ position: "absolute", top: -12, right: 0 }}>
<TimerPill {...timerProps} color={currentPartieColor} />
</div>
) : null}
<div style={{ transform: showInlineControls ? "translateY(9px)" : "translateY(0)" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: compact ? 4 : 6, gap: 8 }}>
<div style={{ color: "#F1F0EE", fontSize: compact ? 15 : 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentPartie?.nom}</div>
<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
<div style={{ color: currentPartieColor.light, fontSize: compact ? 13 : 13, fontFamily: "monospace", fontWeight: 600 }}>{localRangNumber}/{currentPartieTotal}</div>
</div>
</div>
<div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, height: barHeight, overflow: "hidden" }}>
<div style={{ background: `linear-gradient(90deg, ${currentPartieColor.bg}, ${currentPartieColor.light})`, width: `${localRangNumber / currentPartieTotal * 100}%`, height: "100%", transition: "width 0.56s cubic-bezier(0.22, 1, 0.36, 1)", boxShadow: `0 0 18px ${currentPartieColor.bg}44` }} />
</div>
{showInlineControls ? (
<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 9 }}>
<button type="button" onClick={onPrevRang} disabled={!canPrev} style={{ width: 34, height: 34, borderRadius: "50%", background: canPrev ? `${currentPartieColor.bg}33` : "rgba(255,255,255,0.06)", border: `1.5px solid ${currentPartieColor.light}44`, color: canPrev ? currentPartieColor.light : "#5B5A66", fontSize: 20, fontWeight: 700, cursor: canPrev ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
<span style={{ color: "#F1F0EE", fontSize: 28, fontWeight: 700, fontFamily: "'Syne', sans-serif", minWidth: 34, textAlign: "center", lineHeight: 1 }}>{localRangNumber}</span>
<button type="button" onClick={onNextRang} disabled={!canNext} style={{ width: 34, height: 34, borderRadius: "50%", background: canNext ? `linear-gradient(135deg, ${currentPartieColor.bg}, ${currentPartieColor.light})` : "rgba(255,255,255,0.06)", border: "none", color: canNext ? "#fff" : "#5B5A66", fontSize: 20, fontWeight: 700, cursor: canNext ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: canNext ? `0 3px 10px ${currentPartieColor.bg}55` : "none" }}>+</button>
</div>
) : null}
</div>
</div>
</div>
{/* Bouton swipe */}
<div style={{ position: "absolute", top: "50%", right: swiped ? 0 : compact ? -92 : -120, transform: "translateY(-60%)", transition: "right 260ms cubic-bezier(0.22, 1, 0.36, 1)", zIndex: 10 }}>
<button onClick={e => { e.stopPropagation(); onAddCounter(); setSwiped(false); }}
style={{ background: "#059669", border: "none", borderRadius: 8, padding: compact ? "8px 10px" : "10px 14px", color: "#fff", fontSize: compact ? 10 : 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Compteur</button>
</div>
{swiped && <div style={{ position: "absolute", bottom: 14, right: 4, color: currentPartieColor.light, fontSize: 8, opacity: 0.6 }}>→</div>}
</div>
);
}
