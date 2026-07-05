import React from "react";
import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function FolderBubble({ folder, count = 0, onOpen, onMenuOpen }) {
  const color = KALEIDOSCOPE_COLORS[(Number(folder?.colorIdx) || 0) % KALEIDOSCOPE_COLORS.length];
  const size = "clamp(96px, 28vw, 110px)";
  const countLabel = Math.max(0, Number(count) || 0);
  const ringRadius = 51;

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
          <span style={{ position: "absolute", width: "97%", height: "97%", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: `linear-gradient(145deg, ${color.light}44, ${color.bg}CC)`, boxShadow: "0 10px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <span style={{ position: "absolute", inset: "18%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 68%)" }} />
            <span style={{ position: "relative", width: 66, height: 66, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="folder" size={64} color="#fff" stroke={1.75} />
              <span style={{ position: "absolute", left: "50%", top: "57%", transform: "translate(-50%, -50%)", minWidth: 24, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: countLabel > 99 ? 14 : 17, fontWeight: 900, lineHeight: 1, textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.32)" }}>
                {countLabel}
              </span>
            </span>
          </span>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} viewBox="0 0 110 110">
            <circle
              cx="55"
              cy="55"
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.86)"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.28))" }}
            />
          </svg>
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
