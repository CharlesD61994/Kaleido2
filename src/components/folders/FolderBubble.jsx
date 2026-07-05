import React from "react";
import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function FolderBubble({ folder, count = 0, onOpen, onMenuOpen }) {
  const color = KALEIDOSCOPE_COLORS[(Number(folder?.colorIdx) || 0) % KALEIDOSCOPE_COLORS.length];
  const size = "clamp(96px, 28vw, 110px)";
  const countLabel = Math.max(0, Number(count) || 0);

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
          <span style={{ position: "absolute", inset: "-3%", borderRadius: "50%", opacity: 0.95, background: `radial-gradient(circle, ${color.bg}66 0%, ${color.bg}2A 42%, transparent 68%)`, boxShadow: `0 0 10px ${color.bg}66, 0 0 22px ${color.bg}33`, pointerEvents: "none" }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--k-surface)", border: `3px solid ${color.light}AA`, boxShadow: `0 10px 24px rgba(0,0,0,0.18), 0 0 18px ${color.bg}2F`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", inset: "18%", borderRadius: "50%", background: `radial-gradient(circle, ${color.light}22 0%, transparent 68%)` }} />
            <Icon name="folder" size={48} color={color.light} stroke={1.85} />
          </span>
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
