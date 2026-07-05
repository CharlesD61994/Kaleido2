import React from "react";
import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function FolderBubble({ folder, count = 0, onOpen, onMenuOpen }) {
  const color = KALEIDOSCOPE_COLORS[(Number(folder?.colorIdx) || 0) % KALEIDOSCOPE_COLORS.length];
  const size = "clamp(96px, 28vw, 110px)";
  const countLabel = Math.max(0, Number(count) || 0);
  const ringRadius = 51;
  const ringLength = 2 * Math.PI * ringRadius;
  const halfRing = ringLength / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 4px 14px", cursor: "default" }}>
      <div style={{ position: "relative", width: size, height: size, overflow: "visible", isolation: "isolate" }}>
        <button
          type="button"
          onClick={() => onOpen?.(folder)}
          style={{
            position: "absolute",
            inset: 0,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease",
          }}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.94) translateY(3px)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
          onTouchCancel={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94) translateY(3px)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
        >
          <span style={{ position: "absolute", width: "86%", height: "86%", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "var(--k-surface)", boxShadow: "0 10px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", inset: "18%", borderRadius: "50%", background: `radial-gradient(circle, ${color.light}22 0%, transparent 68%)` }} />
            <Icon name="folder" size={48} color={color.light} stroke={1.85} />
          </span>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="5"
              strokeDasharray={`${halfRing} ${halfRing}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(90 55 55)"
            />
            <circle cx="55" cy="55" r={ringRadius} fill="none" stroke={color.light} strokeWidth="5"
              strokeDasharray={`${halfRing} ${halfRing}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 55 55)"
              style={{ filter: `drop-shadow(0 0 4px ${color.light})` }}
            />
          </svg>
          <span style={{ position: "absolute", top: "13%", right: "13%", minWidth: 25, height: 25, padding: "0 7px", borderRadius: 999, background: `linear-gradient(135deg, ${color.light}, ${color.bg})`, border: "2px solid var(--k-surface)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, lineHeight: 1, boxShadow: "0 8px 18px rgba(0,0,0,0.24)" }}>
            {countLabel}
          </span>
        </button>
        {onMenuOpen && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMenuOpen(folder, e); }}
            style={{ position: "absolute", top: -9, right: -9, transform: "translate(12%, -20%)", width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${color.light}, ${color.bg})`, border: "2.5px solid var(--k-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontStyle: "italic", fontWeight: 700, color: "#fff", boxShadow: "0 6px 14px rgba(0,0,0,0.35)", zIndex: 10 }}
          >
            i
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onOpen?.(folder)}
        style={{ width: size, maxWidth: 112, border: "none", background: "transparent", color: "var(--k-text)", fontSize: "clamp(10px, 2.8vw, 12px)", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textAlign: "center", padding: 0, cursor: "pointer" }}
      >
        {folder?.name || "Dossier"}
      </button>
    </div>
  );
}
