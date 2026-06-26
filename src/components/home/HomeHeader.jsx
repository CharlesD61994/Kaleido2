import React from "react";
import Icon from "../icons/Icon";
import { LOGO_SRC } from "../splash/SplashScreen";

export default function HomeHeader({
  mode,
  setMode,
  navigateToLibrary,
  setShowSettingsModal,
}) {
  return (
    <div style={{ padding: "44px 20px 12px", background: "var(--k-header-gradient)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_SRC} alt="Kaleido" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, background: "linear-gradient(135deg, #A78BFA, #F472B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Kaleido</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={navigateToLibrary} aria-label="Ouvrir la bibliothèque de patrons" style={{ background: "var(--k-surface-2)", border: "1px solid var(--k-control-border)", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA", cursor: "pointer" }}>
            <Icon name="library" size={24} stroke={2.2} color="#A78BFA" />
          </button>
          <button onClick={() => setShowSettingsModal(true)} aria-label="Paramètres" style={{ background: "var(--k-surface-2)", border: "1px solid var(--k-control-border)", borderRadius: 10, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA" }}>
            <Icon name="settings" size={24} stroke={2.1} color="#A78BFA" />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", background: "var(--k-segment-bg)", border: "1px solid var(--k-segment-border)", borderRadius: 14, padding: 4, marginBottom: 10 }}>
        {["personal", "pro"].map((currentMode) => (
          <button
            key={currentMode}
            onClick={() => setMode(currentMode)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 11, border: "1px solid transparent", background: mode === currentMode ? "linear-gradient(135deg, #7C3AED, #DB2777)" : "var(--k-segment-idle-bg)", color: mode === currentMode ? "#fff" : "var(--k-segment-idle-color)", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            {currentMode === "personal" ? "Personnel" : "Professionnel"}
          </button>
        ))}
      </div>
    </div>
  );
}
