import React from "react";
import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function FolderBubble({ folder, count = 0, onOpen, onMenuOpen }) {
  const color = KALEIDOSCOPE_COLORS[(Number(folder?.colorIdx) || 0) % KALEIDOSCOPE_COLORS.length];
  const size = "clamp(96px, 28vw, 110px)";
  const countLabel = Math.max(0, Number(count) || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 4px", cursor: "default" }}>
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
          <span style={{ position: "absolute", inset: "3%", borderRadius: "50%", opacity: 0.95, background: `radial-gradient(circle, ${color.bg}4D 0%, ${color.bg}1F 46%, transparent 72%)`, boxShadow: `0 0 14px ${color.bg}44, 0 0 28px ${color.bg}22` }} />
          <span style={{ position: "absolute", inset: "8%", borderRadius: "50%", background: `linear-gradient(145deg, ${color.light}38, ${color.bg}B8)`, border: `2px solid ${color.light}70`, boxShadow: "0 12px 26px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="folder" size={42} color="#fff" stroke={1.8} />
          </span>
          <span style={{ position: "absolute", top: "15%", right: "15%", minWidth: 25, height: 25, padding: "0 7px", borderRadius: 999, background: "var(--k-surface)", border: `1.5px solid ${color.light}88`, color: "var(--k-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, lineHeight: 1, boxShadow: "0 8px 18px rgba(0,0,0,0.22)" }}>
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
