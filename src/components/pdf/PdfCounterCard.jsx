import React, { useState } from "react";
import TimerPill from "../work/TimerPill";

export default function PdfCounterCard({
  color,
  currentPartie,
  totalPartieCourante,
  displayTotalPartieCourante = null,
  rangDansPartie,
  displayRangDansPartie = null,
  rang,
  displayRang = null,
  total,
  displayTotal = null,
  pct,
  globalProgressRatio = null,
  partProgressRatio = null,
  decrementRang,
  incrementRang,
  addCounter,
  resetRang,
  onOpenPartiePicker,
  compact = false,
  timerProps = null,
  clientButton = null,
  repeatBadge = null,
  sectionRepeatBadge = null,
}) {
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleTouchMove = (event) => {
    if (startX - event.touches[0].clientX > 40) setSwiped(true);
  };

  const handleTouchEnd = (event) => {
    if (startX - event.changedTouches[0].clientX < -40) setSwiped(false);
  };

  if (compact) {
    const circleSize = 95;
    const circleCenter = circleSize / 2;
    const circleRadius = 40.5;
    const circleCirc = 2 * Math.PI * circleRadius;
    const circleStroke = 6;
    const barHeight = 9;
    const clientButtonTop = 71;
    const localProgress = currentPartie && totalPartieCourante > 0
      ? Math.round((rangDansPartie / totalPartieCourante) * 100)
      : pct;
    const displayGlobalRang = displayRang ?? rang;
    const displayGlobalTotal = displayTotal ?? (total > 0 ? total : "-");
    const displayPartRang = displayRangDansPartie ?? rangDansPartie;
    const displayPartTotal = displayTotalPartieCourante ?? totalPartieCourante;
    const safeGlobalProgress = typeof globalProgressRatio === "number"
      ? Math.max(0, Math.min(1, globalProgressRatio))
      : Math.max(0, Math.min(1, pct / 100));
    const safeLocalProgress = typeof partProgressRatio === "number"
      ? Math.round(Math.max(0, Math.min(1, partProgressRatio)) * 100)
      : localProgress;

    return (
      <div
        onTouchStart={(event) => setStartX(event.touches[0].clientX)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => swiped && setSwiped(false)}
        style={{ background: "transparent", borderRadius: 0, border: "none", padding: "12px 0 9px", display: "flex", alignItems: "center", gap: 10, position: "relative", overflow: "hidden", width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, transform: swiped ? "translateX(-104px)" : "translateX(0)", transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
          <div style={{ position: "relative", flexShrink: 0, width: circleSize }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ color: color.bg, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 800 }}>Global</div>
              <div style={{ position: "relative", width: circleSize, height: circleSize }}>
                <svg width={circleSize} height={circleSize} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={circleCenter} cy={circleCenter} r={circleRadius} stroke="var(--k-muted-fill-2)" strokeWidth={circleStroke} fill="none" />
                  <circle
                    cx={circleCenter}
                    cy={circleCenter}
                    r={circleRadius}
                    stroke={color.bg}
                    strokeWidth={circleStroke}
                    fill="none"
                    strokeDasharray={circleCirc}
                    strokeDashoffset={circleCirc * (1 - safeGlobalProgress)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.52s cubic-bezier(0.22, 1, 0.36, 1)" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "var(--k-text)", fontSize: 32, fontWeight: 700, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{displayGlobalRang}</span>
                  <span style={{ color: color.bg, fontSize: 13, fontFamily: "monospace", marginTop: 1, fontWeight: 800 }}>/ {displayGlobalTotal}</span>
                </div>
              </div>
            </div>
            {clientButton && !repeatBadge ? (
              <div style={{ position: "absolute", left: circleSize + 16, top: clientButtonTop + 1, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>
                {clientButton}
              </div>
            ) : null}
          </div>

          <div style={{ flex: 1, minWidth: 0, maxWidth: "none", position: "relative" }}>
            {timerProps ? (
              <div style={{ position: "absolute", top: -12, right: 0 }}>
                <TimerPill {...timerProps} color={color} />
              </div>
            ) : null}
            {sectionRepeatBadge ? (
              <div style={{ position: "absolute", top: -12, left: 0, height: 20, minWidth: 92, maxWidth: "calc(100% - 104px)", borderRadius: 999, border: `1px solid ${color.bg}28`, background: `${color.bg}18`, color: color.bg, padding: "2px 10px", boxSizing: "border-box", fontSize: 12, fontWeight: 900, fontFamily: "'DM Sans', sans-serif", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {sectionRepeatBadge.label}
              </div>
            ) : null}
            {repeatBadge ? (
              <button type="button" onClick={repeatBadge.onClick} style={{ position: "absolute", left: 4, top: 72, minWidth: 46, height: 30, borderRadius: 999, border: `1px solid ${color.bg}44`, background: `${color.bg}18`, color: color.bg, fontSize: 12, fontWeight: 900, fontFamily: "'DM Sans', sans-serif", cursor: repeatBadge.onClick ? "pointer" : "default", zIndex: 5 }}>
                {repeatBadge.label}
              </button>
            ) : null}
            <div style={{ transform: "translateY(9px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (currentPartie && typeof onOpenPartiePicker === "function") onOpenPartiePicker();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: color.bg,
                    fontSize: 16,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: currentPartie ? "pointer" : "default",
                    textAlign: "left",
                    minWidth: 0,
                  }}
                >
                  {currentPartie?.nom || "Progression"}
                </button>
                <span style={{ color: color.bg, fontSize: 14, fontFamily: "monospace", fontWeight: 800, flexShrink: 0 }}>{currentPartie ? `${displayPartRang}/${displayPartTotal}` : `${pct}%`}</span>
              </div>
              <div style={{ background: "var(--k-muted-fill-2)", borderRadius: 12, height: barHeight, overflow: "hidden", marginBottom: 9, boxShadow: `inset 0 0 0 1px ${color.bg}18` }}>
                <div style={{ background: `linear-gradient(90deg, ${color.bg}, ${color.light})`, width: `${safeLocalProgress}%`, height: "100%", transition: "width 0.56s cubic-bezier(0.22, 1, 0.36, 1)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                <button onClick={decrementRang} style={{ width: 40, height: 40, borderRadius: "50%", background: `${color.bg}24`, border: `1.5px solid ${color.bg}55`, color: color.bg, fontSize: 22, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                <span style={{ color: "var(--k-text)", fontSize: 32, fontWeight: 700, fontFamily: "'Syne', sans-serif", minWidth: 40, textAlign: "center", lineHeight: 1 }}>{currentPartie ? displayPartRang : displayGlobalRang}</span>
                <button onClick={incrementRang} style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, border: "none", color: "#fff", fontSize: 22, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                {clientButton && repeatBadge ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 9, transform: "translateY(1px)", flexShrink: 0 }}>
                    {clientButton}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", top: "50%", right: swiped ? 8 : -96, transform: "translateY(-50%)", transition: "right 260ms cubic-bezier(0.22, 1, 0.36, 1)", zIndex: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={(event) => { event.stopPropagation(); addCounter(); setSwiped(false); }} style={{ background: "#059669", border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Compteur</button>
          <button onClick={(event) => { event.stopPropagation(); resetRang(); setSwiped(false); }} style={{ background: "#DC2626", border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Reset</button>
        </div>
      </div>
    );
  }

  const globalProgress = total > 0 ? 1 - rang / total : 1;
  const partProgress = totalPartieCourante > 0 ? Math.round((rangDansPartie / totalPartieCourante) * 100) : 0;

  return (
    <div
      onTouchStart={(event) => setStartX(event.touches[0].clientX)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => swiped && setSwiped(false)}
      style={{ background: "linear-gradient(180deg, var(--k-surface), var(--k-surface-2))", borderRadius: 14, border: `1px solid ${color.bg}44`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, position: "relative", overflow: "hidden", boxShadow: `0 8px 28px ${color.bg}18` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, transform: swiped ? "translateX(-100px)" : "translateX(0)", transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: 80, flexShrink: 0 }}>
          <div style={{ color: color.bg, fontSize: 14, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3, textAlign: "center", lineHeight: 1.2, fontWeight: 800 }}>Global</div>
          <div key={`pdf-progress-${rang}-${total}`} style={{ position: "relative", width: 64, height: 64, filter: `drop-shadow(0 0 10px ${color.bg}30)`, transformOrigin: "center", animation: "kaleidoProgressCleanPulse 320ms cubic-bezier(0.25, 0.9, 0.35, 1)" }}>
            <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="32" cy="32" r="27" stroke="var(--k-muted-fill-2)" strokeWidth="3.5" fill="none" />
              <circle cx="32" cy="32" r="27" stroke="url(#pgc)" strokeWidth="3.5" fill="none" strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * globalProgress} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.52s cubic-bezier(0.22, 1, 0.36, 1)", color: color.light, filter: "drop-shadow(0 0 4px currentColor)", animation: "kaleidoProgressCleanGlow 320ms cubic-bezier(0.25, 0.9, 0.35, 1)" }} />
              <defs>
                <linearGradient id="pgc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color.bg} />
                  <stop offset="100%" stopColor={color.light} />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "var(--k-text)", fontSize: 19, fontWeight: 700, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{rang}</span>
              <span style={{ color: color.bg, fontSize: 11, fontFamily: "monospace", marginTop: 1, fontWeight: 800 }}>/ {total > 0 ? total : "-"}</span>
            </div>
          </div>
          {total > 0 && <span style={{ color: "var(--k-muted-2)", fontSize: 9, fontFamily: "monospace" }}>{pct}%</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", marginTop: -4 }}>
          {currentPartie ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (typeof onOpenPartiePicker === "function") onOpenPartiePicker();
                  }}
                  style={{ background: "none", border: "none", padding: 0, color: color.bg, fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 800, cursor: "pointer", textAlign: "left" }}
                >
                  {currentPartie.nom}
                </button>
                <span style={{ color: color.bg, fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 800 }}>{rangDansPartie}/{totalPartieCourante}</span>
              </div>
              <div style={{ background: "var(--k-muted-fill-2)", borderRadius: 6, height: 4, overflow: "hidden", marginTop: 2, marginBottom: 16 }}>
                <div style={{ background: `linear-gradient(90deg, ${color.bg}, ${color.light})`, width: `${partProgress}%`, height: "100%", transition: "width 260ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
              </div>
            </>
          ) : total > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: color.bg, fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 800 }}>Progression</span>
                <span style={{ color: "var(--k-muted-2)", fontSize: 10, fontFamily: "monospace" }}>{rang}/{total}</span>
              </div>
              <div style={{ background: "var(--k-muted-fill-2)", borderRadius: 6, height: 4, overflow: "hidden", marginTop: 2, marginBottom: 16 }}>
                <div style={{ background: `linear-gradient(90deg, ${color.bg}, ${color.light})`, width: `${pct}%`, height: "100%", transition: "width 260ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
              </div>
            </>
          ) : <div style={{ marginBottom: 16 }} />}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transform: "translateX(-16px)" }}>
            <button onClick={decrementRang} style={{ width: 42, height: 42, borderRadius: "50%", background: `${color.bg}24`, border: `1.5px solid ${color.bg}55`, color: color.bg, fontSize: 22, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
            <span style={{ color: "var(--k-text)", fontSize: 34, fontWeight: 700, fontFamily: "'Syne', sans-serif", minWidth: 44, textAlign: "center", lineHeight: 1 }}>{currentPartie ? rangDansPartie : rang}</span>
            <button onClick={incrementRang} style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, border: "none", color: "#fff", fontSize: 22, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${color.bg}55` }}>+</button>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: "50%", right: swiped ? 10 : -110, transform: "translateY(-50%)", transition: "right 260ms cubic-bezier(0.22, 1, 0.36, 1)", zIndex: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <button onClick={(event) => { event.stopPropagation(); addCounter(); setSwiped(false); }} style={{ background: "#059669", border: "none", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Compteur</button>
        <button onClick={(event) => { event.stopPropagation(); resetRang(); setSwiped(false); }} style={{ background: "#DC2626", border: "none", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Reset</button>
      </div>
      {swiped && <div style={{ position: "absolute", bottom: 4, right: 8, color: color.light, fontSize: 8, opacity: 0.6 }}>{">"}</div>}
    </div>
  );
}
