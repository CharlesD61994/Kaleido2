import { cloneElement, isValidElement, useState } from "react";
import Icon from "../icons/Icon";

export default function WorkProjectHeader({
  title,
  subtitle,
  timeText,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
  onBack,
  clientName,
  unreadClientMessageCount = 0,
  onOpenClientPage,
  mainContent,
  showTimerButton = true,
}) {
  const [showTimer, setShowTimer] = useState(false);
  const backButton = (
    <button
      data-kaleido-back-button="true"
      onClick={onBack}
      style={{
        background: "var(--k-surface-2)",
        border: "1px solid var(--k-control-border)",
        borderRadius: 10,
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#A78BFA",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
  const clientButton = clientName ? (
    <button
      type="button"
      aria-label="Ouvrir la fiche client"
      title="Fiche client"
      onClick={onOpenClientPage}
      style={{
        position: "relative",
        zIndex: 26,
        background: unreadClientMessageCount > 0 ? "rgba(253,164,175,0.14)" : "var(--k-surface-2)",
        border: unreadClientMessageCount > 0 ? "1px solid rgba(253,164,175,0.44)" : "1px solid var(--k-control-border)",
        borderRadius: 10,
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: unreadClientMessageCount > 0 ? "#FECDD3" : "#A78BFA",
        cursor: "pointer",
        flexShrink: 0,
        boxShadow: unreadClientMessageCount > 0 ? "0 0 0 3px rgba(253,164,175,0.10), 0 0 14px rgba(253,164,175,0.30)" : "none",
      }}
    >
      <Icon name="client" size={19} stroke={2.1} color="currentColor" />
      {unreadClientMessageCount > 0 ? (
        <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "linear-gradient(135deg, #FDA4AF, #FB7185)", border: "2px solid var(--k-bg)", color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {unreadClientMessageCount > 9 ? "9+" : unreadClientMessageCount}
        </span>
      ) : null}
    </button>
  ) : null;
  const enhancedMainContent = mainContent && isValidElement(mainContent)
    ? cloneElement(mainContent, { clientButton })
    : mainContent;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: mainContent ? 6 : 12, position: "relative" }}>
      {mainContent ? null : backButton}

      <div style={{ flex: 1, minWidth: 0 }}>
        {enhancedMainContent || (
          <>
            <h1 style={{ color: "var(--k-text)", margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", lineHeight: 1.18, overflowWrap: "anywhere" }}>{title}</h1>
            {subtitle && <div style={{ color: "#A78BFA", fontSize: 11, fontFamily: "monospace", marginTop: 2, letterSpacing: 0.4 }}>{subtitle}</div>}
          </>
        )}
      </div>

      {!mainContent && clientButton}

      {showTimerButton ? (
        <button
          type="button"
          onClick={() => setShowTimer((value) => !value)}
          style={{
            border: "1px solid rgba(167,139,250,0.28)",
            borderRadius: 12,
            background: isTimerRunning ? "rgba(220,38,38,0.18)" : "rgba(5,150,105,0.16)",
            color: "var(--k-text)",
            padding: "7px 9px",
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: 800,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {timeText}
        </button>
      ) : null}

      {showTimer && showTimerButton ? (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            zIndex: 40,
            background: "var(--k-surface)",
            border: "1px solid rgba(167,139,250,0.26)",
            borderRadius: 16,
            padding: 12,
            boxShadow: "0 18px 48px rgba(0,0,0,0.46)",
            width: 184,
          }}
        >
          <div style={{ color: "var(--k-text)", fontSize: 20, fontFamily: "monospace", fontWeight: 800, textAlign: "center", marginBottom: 10 }}>{timeText}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button type="button" onClick={onToggleTimer} style={{ background: isTimerRunning ? "#DC2626" : "#059669", border: "none", borderRadius: 10, padding: "8px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}>{isTimerRunning ? "PAUSE" : "PLAY"}</button>
            <button type="button" onClick={onResetTimer} style={{ background: "#7C3AED", border: "none", borderRadius: 10, padding: "8px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 800 }}>RESET</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
