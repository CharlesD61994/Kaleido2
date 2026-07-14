import React from "react";
import usePdfProgress from "../../hooks/usePdfProgress";
import CounterWidget from "../counters/CounterWidget";
import WorkProjectHeader from "../work/WorkProjectHeader";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import PdfCounterCard from "./PdfCounterCard";
import PdfProgressModals from "./PdfProgressModals";
import NativePdfViewport from "./NativePdfViewport";
import { IOS_READER_TOP_PADDING } from "../../styles/layout";
import { isNativePdfViewerTarget } from "../../services/nativePdfViewer";

export { default as ImportPdfModal } from "./ImportPdfModal";

function PdfPartiePickerModal({ currentPartieIdx, onClose, onSelect, pdfParties }) {
  if (!pdfParties?.length) return null;

  return (
    <div data-kaleido-modal-backdrop="true" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div data-kaleido-modal-card="true" onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 360, maxHeight: "78vh", overflowY: "auto", background: "var(--k-surface)", border: "1px solid rgba(167,139,250,0.24)", borderRadius: 22, padding: 20, boxShadow: "0 18px 60px rgba(0,0,0,0.30)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ color: "var(--k-text)", fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>Choisir une partie</div>
            <div style={{ color: "#77758A", fontSize: 12, marginTop: 3 }}>Le compteur ira au premier rang choisi.</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-muted-fill)", color: "var(--k-text-soft)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>x</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pdfParties.map((partie, index) => {
            const color = KALEIDOSCOPE_COLORS[(partie.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
            const isActive = index === currentPartieIdx;
            return (
              <button
                key={partie.id || index}
                type="button"
                onClick={() => onSelect(index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  minHeight: 54,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: isActive ? `1.5px solid ${color.light}` : "1px solid var(--k-border)",
                  background: isActive ? `${color.bg}28` : "var(--k-muted-fill)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, boxShadow: `0 0 12px ${color.bg}66`, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", color: "var(--k-text)", fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{partie.nom || `Partie ${index + 1}`}</span>
                  <span style={{ display: "block", color: "#77758A", fontSize: 11, marginTop: 2 }}>{partie.totalRangs || 0} rangs</span>
                </span>
                {isActive ? <span style={{ color: color.light, fontSize: 11, fontWeight: 900, fontFamily: "monospace" }}>ACTIF</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PdfViewerView({ project, onNavigateHub, onSaveProgress, onOpenClientPage, unreadClientMessageCount = 0, nativePdfEnabled = true, themeMode = "light" }) {
  const [showPartiePicker, setShowPartiePicker] = React.useState(false);
  const [nativePdfUnavailable, setNativePdfUnavailable] = React.useState(false);
  const [nativePdfError, setNativePdfError] = React.useState("");
  const useNativePdf = nativePdfEnabled && isNativePdfViewerTarget();
  const {
    addCounter,
    color,
    completeProject,
    counters,
    currentPartie,
    currentPartieIdx,
    decrementRang,
    deleteCounter,
    elapsedTime,
    formatTime,
    handleBack,
    incrementRang,
    isTimerRunning,
    pct,
    pdfParties,
    rang,
    rangDansPartie,
    repeatBadge,
    resetTimer,
    goToPartieIndex,
    setCurrentPartieIdx,
    setRang,
    setShowFinModal,
    setShowNextPartieModal,
    setShowPrevPartieModal,
    showFinModal,
    showNextPartieModal,
    showPrevPartieModal,
    toggleTimer,
    total,
    totalPartieCourante,
    updateCounter,
  } = usePdfProgress({ project, onNavigateHub, onSaveProgress });

  const selectPdfPartie = (partieIndex) => {
    goToPartieIndex(partieIndex);
    setShowPartiePicker(false);
  };

  const savePdfViewportState = React.useCallback((pdfViewportState) => {
    if (typeof onSaveProgress === "function" && pdfViewportState) {
      onSaveProgress(rang, total, elapsedTime, { pdfViewportState });
    }
  }, [elapsedTime, onSaveProgress, rang, total]);

  const nativeHeaderState = React.useMemo(() => {
    const localProgress = currentPartie && totalPartieCourante > 0
      ? Math.round((rangDansPartie / totalPartieCourante) * 100)
      : pct;
    const isLightTheme = themeMode !== "dark";
    return {
      themeMode,
      backgroundColor: isLightTheme ? "#F7F4FB" : "#0D0D1A",
      textColor: isLightTheme ? "#14111F" : "#FFFFFF",
      trackColor: isLightTheme ? "#E5E0EA" : "#242432",
      colorBg: color.bg,
      colorLight: color.light,
      currentPartieName: currentPartie?.nom || "Progression",
      totalPartieCourante,
      rangDansPartie,
      rang,
      total,
      pct,
      localProgress,
      timeText: formatTime(elapsedTime),
      isTimerRunning,
      hasClient: Boolean(project?.client),
      unreadClientMessageCount,
      repeatBadgeLabel: repeatBadge?.label || "",
    };
  }, [color.bg, color.light, currentPartie?.nom, elapsedTime, formatTime, isTimerRunning, pct, project?.client, rang, rangDansPartie, repeatBadge?.label, themeMode, total, totalPartieCourante, unreadClientMessageCount]);

  const handleNativePdfAction = React.useCallback((action) => {
    if (action === "decrementRang") decrementRang();
    if (action === "incrementRang") incrementRang();
    if (action === "toggleTimer") toggleTimer();
    if (action === "resetTimer") resetTimer();
    if (action === "openClientPage" && typeof onOpenClientPage === "function") onOpenClientPage();
    if (action === "openPartiePicker") setShowPartiePicker(true);
  }, [decrementRang, incrementRang, onOpenClientPage, resetTimer, toggleTimer]);

  const hideNativePdf = showPartiePicker || showFinModal || showNextPartieModal || showPrevPartieModal;

  return (
    <div style={{ background: "var(--k-bg)", color: "var(--k-text)", height: "100vh", fontFamily: "'DM Sans', sans-serif", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar{width:0} * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ flexShrink: 0, position: "relative", zIndex: 10, background: "var(--k-bg)", padding: `${IOS_READER_TOP_PADDING} 20px 3px 6px`, borderBottom: "1px solid var(--k-bg)", overflow: "hidden" }}>
        <WorkProjectHeader
          timeText={formatTime(elapsedTime)}
          isTimerRunning={isTimerRunning}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          onBack={handleBack}
          clientName={project?.client}
          unreadClientMessageCount={unreadClientMessageCount}
          onOpenClientPage={onOpenClientPage}
          showTimerButton={false}
          mainContent={(
            <PdfCounterCard
              color={color}
              currentPartie={currentPartie}
              totalPartieCourante={totalPartieCourante}
              rangDansPartie={rangDansPartie}
              rang={rang}
              total={total}
              pct={pct}
              decrementRang={decrementRang}
              incrementRang={incrementRang}
              addCounter={addCounter}
              resetRang={() => setRang(1)}
              onOpenPartiePicker={() => setShowPartiePicker(true)}
              compact
              timerProps={{
                timeText: formatTime(elapsedTime),
                isTimerRunning,
                onToggleTimer: toggleTimer,
                onResetTimer: resetTimer,
              }}
              repeatBadge={repeatBadge}
            />
          )}
        />
      </div>

      {counters.length > 0 && (
        <div style={{ padding: "0px 16px 12px", background: "var(--k-bg)", flexShrink: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {counters.map((counter) => (
              <div key={counter.id} style={{ flex: "1 1 calc(50% - 4px)", minWidth: 140 }}>
                <CounterWidget counter={counter}
                  onUpdate={(updates) => updateCounter(counter.id, updates)}
                  onDelete={() => deleteCounter(counter.id)}
                  onAddNew={null}
                  globalRangCount={rang} />
              </div>
            ))}
          </div>
        </div>
      )}

      {useNativePdf && !nativePdfUnavailable ? (
        <NativePdfViewport
          pdfId={project?.pdfId}
          initialState={project?.pdfViewportState}
          hidden={hideNativePdf}
          headerState={nativeHeaderState}
          onAction={handleNativePdfAction}
          onUnavailable={(message) => {
            setNativePdfError(message || "Le lecteur PDF natif iOS n'a pas pu demarrer.");
            setNativePdfUnavailable(true);
          }}
          onStateChange={savePdfViewportState}
        />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#111", padding: 24, textAlign: "center" }}>
          <div style={{ color: nativePdfUnavailable ? "#F87171" : "#A78BFA", fontSize: 14, lineHeight: 1.4 }}>
            {nativePdfUnavailable ? nativePdfError || "Le lecteur PDF natif iOS n'a pas pu demarrer." : "Le lecteur PDF est disponible dans l'app iOS installee."}
          </div>
        </div>
      )}

      <PdfPartiePickerModal
        currentPartieIdx={currentPartieIdx}
        onClose={() => setShowPartiePicker(false)}
        onSelect={selectPdfPartie}
        pdfParties={showPartiePicker ? pdfParties : []}
      />

      <PdfProgressModals
        color={color}
        completeProject={completeProject}
        currentPartie={currentPartie}
        currentPartieIdx={currentPartieIdx}
        pdfParties={pdfParties}
        project={project}
        setCurrentPartieIdx={setCurrentPartieIdx}
        setRang={setRang}
        setShowFinModal={setShowFinModal}
        setShowNextPartieModal={setShowNextPartieModal}
        setShowPrevPartieModal={setShowPrevPartieModal}
        showFinModal={showFinModal}
        showNextPartieModal={showNextPartieModal}
        showPrevPartieModal={showPrevPartieModal}
      />
    </div>
  );
}
