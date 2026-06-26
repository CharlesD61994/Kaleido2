import React from "react";
import usePdfPages from "../../hooks/usePdfPages";
import usePdfProgress from "../../hooks/usePdfProgress";
import CounterWidget from "../counters/CounterWidget";
import WorkProjectHeader from "../work/WorkProjectHeader";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import PdfCounterCard from "./PdfCounterCard";
import PdfProgressModals from "./PdfProgressModals";

export { default as ImportPdfModal } from "./ImportPdfModal";

function PdfPartiePickerModal({ currentPartieIdx, onClose, onSelect, pdfParties }) {
  if (!pdfParties?.length) return null;

  return (
    <div data-kaleido-modal-backdrop="true" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div data-kaleido-modal-card="true" onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 360, maxHeight: "78vh", overflowY: "auto", background: "#1A1A2E", border: "1px solid rgba(167,139,250,0.24)", borderRadius: 22, padding: 20, boxShadow: "0 18px 60px rgba(0,0,0,0.55)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ color: "#F1F0EE", fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>Choisir une partie</div>
            <div style={{ color: "#77758A", fontSize: 12, marginTop: 3 }}>Le compteur ira au premier rang choisi.</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#E2E0DC", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>x</button>
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
                  border: isActive ? `1.5px solid ${color.light}` : "1px solid rgba(255,255,255,0.08)",
                  background: isActive ? `${color.bg}28` : "rgba(255,255,255,0.035)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, boxShadow: `0 0 12px ${color.bg}66`, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", color: "#F1F0EE", fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{partie.nom || `Partie ${index + 1}`}</span>
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

export default function PdfViewerView({ project, onNavigateHub, onSaveProgress, onOpenClientPage, unreadClientMessageCount = 0 }) {
  const [showPartiePicker, setShowPartiePicker] = React.useState(false);
  const { pages, loading, loadError } = usePdfPages(project?.pdfId);
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
    resetTimer,
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
    let offset = 0;
    for (let i = 0; i < partieIndex; i++) {
      offset += Number(pdfParties[i]?.totalRangs) || 0;
    }
    setRang(offset + 1);
    setShowPartiePicker(false);
  };

  return (
    <div style={{ background: "#0D0D1A", height: "100vh", fontFamily: "'DM Sans', sans-serif", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar{width:0} * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ flexShrink: 0, position: "relative", zIndex: 10, background: "rgba(13,13,26,0.95)", backdropFilter: "blur(10px)", padding: "44px 8px 0 6px" }}>
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
              resetRang={() => setRang(0)}
              onOpenPartiePicker={() => setShowPartiePicker(true)}
              compact
              timerProps={{
                timeText: formatTime(elapsedTime),
                isTimerRunning,
                onToggleTimer: toggleTimer,
                onResetTimer: resetTimer,
              }}
            />
          )}
        />
      </div>

      {counters.length > 0 && (
        <div style={{ padding: "0px 16px 12px", background: "#0D0D1A", flexShrink: 0 }}>
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

      <div style={{ flex: 1, overflowY: "auto", background: "#111", WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 14 }}>
            <div style={{ fontSize: 14, color: "#A78BFA" }}>Chargement du PDF...</div>
          </div>
        ) : loadError ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 12 }}>
            <div style={{ fontSize: 14, color: "#F87171" }}>PDF introuvable</div>
          </div>
        ) : (
          pages.map((src, index) => (
            <div key={index} style={{ borderBottom: "2px solid #1A1A2E" }}>
              <img src={src} alt={`Page ${index + 1}`} style={{ width: "100%", display: "block" }} />
            </div>
          ))
        )}
      </div>

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
