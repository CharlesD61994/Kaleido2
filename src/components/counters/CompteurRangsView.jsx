import React from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import { GLOBAL_MOTION_CSS } from "../../styles/motion";
import useRowCounterProgress from "../../hooks/useRowCounterProgress";
import WorkProjectHeader from "../work/WorkProjectHeader";
import CounterWidget, { ProgressionSwipeCard } from "./CounterWidget";
import CounterEmptyState from "./CounterEmptyState";
import PartieTransitionModals from "./PartieTransitionModals";
import InstructionHighlighter from "./InstructionHighlighter";

export default function CompteurRangsView({ project, onNavigateHub, onNavigateEditor, onSaveProgress, onOpenClientPage, unreadClientMessageCount = 0 }) {
  const {
    addCounter,
    allRangs,
    completeProject,
    confirmNextPartie,
    confirmPrevPartie,
    counters,
    currentCountIndex,
    currentIndex,
    currentPartie,
    currentPartieColor,
    currentPartieRangIndex,
    currentPartieTotal,
    currentRang,
    deleteCounter,
    elapsedTime,
    formatTime,
    goToPartie,
    handleBackToHub,
    hasParties,
    instructionHighlights,
    isTimerRunning,
    nextRang,
    patron,
    prevRang,
    resetTimer,
    setHighlightedInstruction,
    setShowNextPartieModal,
    setShowPrevPartieModal,
    setShowFinModal,
    showFinModal,
    showNextPartieModal,
    showPrevPartieModal,
    toggleTimer,
    totalRangs,
    updateCounter,
  } = useRowCounterProgress({ project, onNavigateHub, onSaveProgress });

  if (!hasParties) {
    return (
      <CounterEmptyState
        onBack={handleBackToHub}
        onNavigateEditor={onNavigateEditor}
        patron={patron}
        project={project}
      />
    );
  }

  const circ_r = 43.5;
  const circ_c = 2 * Math.PI * circ_r;
  const upcomingRangs = allRangs.slice(currentIndex + 1, currentIndex + 22);
  const getPreviewLabel = (rang) => {
    if (!rang) return "";
    if (rang.isNote) return "Note";
    const partie = patron.parties.find((item) => item.id === rang.partieId);
    const rangNumber = partie
      ? partie.rangs.slice(0, partie.rangs.findIndex((item) => item.id === rang.id) + 1).filter((item) => !item.isNote).length
      : 0;
    return `Rang ${Math.max(1, rangNumber)}`;
  };
  const getPreviewPartie = (rang) => patron.parties.find((item) => item.id === rang?.partieId);
  const upcomingItems = upcomingRangs.flatMap((rang, index) => {
    const previous = index === 0 ? currentRang : upcomingRangs[index - 1];
    const shouldShowPartie = rang?.partieId && rang.partieId !== previous?.partieId;
    const partie = getPreviewPartie(rang);
    return [
      ...(shouldShowPartie && partie ? [{ type: "partie", id: `partie-${rang.partieId}-${index}`, partie }] : []),
      { type: "rang", id: rang.globalId, rang },
    ];
  });

  return (
    <div style={{ background: "var(--k-bg)", color: "var(--k-text)", height: "100vh", fontFamily: "'DM Sans', sans-serif", maxWidth: 430, margin: "0 auto", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap'); ${GLOBAL_MOTION_CSS} ::-webkit-scrollbar { width: 0; height: 0; } .partiesStrip { scrollbar-width: none; -ms-overflow-style: none; } .partiesStrip::-webkit-scrollbar { width: 0; height: 0; display: none; } * { -webkit-tap-highlight-color: transparent; } input, textarea, select { font-size: 16px !important; } @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} } .kgbg { background: linear-gradient(-45deg, #0D0D1A, #1A0A2E, #0D0D1A, #1E1E32); background-size: 400% 400%; animation: gradientShift 18s linear infinite; } @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg);opacity:0.1} 50%{transform:translateY(-20px) rotate(180deg);opacity:0.3} }`}</style>
      <div className="kgbg" style={{ position: "absolute", inset: 0 }} />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} style={{ position: "absolute", top: `${20 + index * 15}%`, left: `${10 + index * 12}%`, width: 20, height: 20, borderRadius: "50%", background: `${currentPartieColor.light}22`, animation: `float ${3 + index * 0.5}s ease-in-out infinite`, animationDelay: `${index * 0.3}s` }} />
      ))}

      <div style={{ position: "relative", zIndex: 10, padding: "44px 8px 0 6px", background: "color-mix(in srgb, var(--k-bg) 95%, transparent)", backdropFilter: "blur(10px)", flexShrink: 0 }}>
        <WorkProjectHeader
          timeText={formatTime(elapsedTime)}
          isTimerRunning={isTimerRunning}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          onBack={handleBackToHub}
          clientName={project?.client}
          unreadClientMessageCount={unreadClientMessageCount}
          onOpenClientPage={onOpenClientPage}
          showTimerButton={false}
          mainContent={(
            <ProgressionSwipeCard
              currentPartieColor={currentPartieColor}
              currentIndex={currentIndex}
              totalRangs={totalRangs}
              circ_r={circ_r}
              circ_c={circ_c}
              currentPartie={currentPartie}
              currentPartieRangIndex={currentPartieRangIndex}
              currentPartieTotal={currentPartieTotal}
              onAddCounter={addCounter}
              currentCountIndex={currentCountIndex}
              compact
              timerProps={{
                timeText: formatTime(elapsedTime),
                isTimerRunning,
                onToggleTimer: toggleTimer,
                onResetTimer: resetTimer,
              }}
              onPrevRang={prevRang}
              onNextRang={nextRang}
              canPrev={currentIndex > 0}
              canNext={currentIndex < allRangs.length - 1}
            />
          )}
        />
      </div>

      {counters.length > 0 && (
        <div style={{ position: "relative", zIndex: 10, padding: "0 8px 8px", flexShrink: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: counters.length === 1 ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
            {counters.map((counter) => (
              <CounterWidget key={counter.id} counter={counter} onUpdate={(updates) => updateCounter(counter.id, updates)} onDelete={() => deleteCounter(counter.id)} onAddNew={addCounter} globalRangCount={currentPartieRangIndex + 1} />
            ))}
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 10, padding: "0 8px 10px", flexShrink: 0 }}>
        <div className="partiesStrip" style={{ display: "flex", gap: 8, overflowX: "auto", paddingLeft: 6, paddingBottom: 2 }}>
          {patron.parties.map((partie) => {
            const col = KALEIDOSCOPE_COLORS[partie.colorIdx % KALEIDOSCOPE_COLORS.length];
            const isActive = currentPartie?.id === partie.id;
            return (
              <button key={partie.id} type="button" onClick={() => goToPartie(partie.id)}
                style={{ background: isActive ? `linear-gradient(135deg, ${col.bg}, ${col.light})` : "#1E1E32", border: "none", borderRadius: 16, padding: "5px 15px", color: isActive ? "#fff" : col.light, fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", transform: isActive ? "scale(1.035)" : "scale(1)", textTransform: "uppercase", letterSpacing: 0.4, boxShadow: isActive ? `0 4px 12px ${col.bg}44` : "none", minWidth: 68, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", flexShrink: 0 }}>
                {partie.nom}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 10, padding: "0 8px 12px", flexShrink: 0 }}>
        <div style={{ background: "rgba(30,30,50,0.9)", backdropFilter: "blur(20px)", border: `2px solid ${currentPartieColor.light}44`, borderRadius: 20, padding: "16px 20px", textAlign: "center", boxShadow: `0 8px 32px ${currentPartieColor.bg}33` }}>
          <div style={{ background: `linear-gradient(135deg, ${currentPartieColor.bg}, ${currentPartieColor.light})`, borderRadius: 12, padding: "10px 16px", display: "inline-block", marginBottom: 12, boxShadow: `0 4px 16px ${currentPartieColor.bg}66` }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{currentRang?.isNote ? "Note" : `Rang ${Math.max(1, currentPartieRangIndex + 1)}`}</span>
          </div>
          <div style={{ color: "#F1F0EE", fontSize: 19, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, padding: "0 8px", marginBottom: 10 }}>
            <InstructionHighlighter
              text={currentRang?.instruction}
              selectedIndex={instructionHighlights?.[currentRang?.id]}
              onSelect={(index) => setHighlightedInstruction(currentRang?.id, index)}
              color={currentPartieColor}
            />
          </div>
          {currentRang?.mailles && (
            <div style={{ background: `${currentPartieColor.bg}22`, borderRadius: 10, padding: "8px 16px", display: "inline-block", border: `1px solid ${currentPartieColor.light}44` }}>
              <span style={{ color: currentPartieColor.light, fontSize: 14, fontFamily: "monospace", fontWeight: 600 }}>{currentRang.mailles} mailles</span>
            </div>
          )}
        </div>
      </div>

      {upcomingItems.length > 0 && (
        <div style={{ position: "relative", zIndex: 10, padding: "2px 8px 10px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ color: "#7F7A91", fontSize: 11, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>Prochains rangs</div>
          <div style={{ display: "grid", gap: 6, height: "calc(100% - 24px)", alignContent: "start", overflow: "hidden" }}>
            {upcomingItems.map((item, index) => {
              if (item.type === "partie") {
                const col = KALEIDOSCOPE_COLORS[item.partie.colorIdx % KALEIDOSCOPE_COLORS.length];
                return (
                  <div key={`${item.id}-${currentIndex}`} style={{ background: "rgba(13,13,26,0.62)", border: `1px solid ${col.light}10`, borderRadius: 10, padding: "6px 10px", color: `${col.light}99`, fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 800, letterSpacing: 0.45, textTransform: "uppercase" }}>
                    {item.partie.nom}
                  </div>
                );
              }

              const rang = item.rang;
              const visualIndex = upcomingItems.slice(0, index + 1).filter((entry) => entry.type === "rang").length - 1;
              return (
                <div
                  key={`${rang.globalId}-${currentIndex}`}
                  style={{
                    background: `linear-gradient(180deg, rgba(12,12,24,${0.94 - visualIndex * 0.03}), rgba(7,7,15,${0.98 - visualIndex * 0.025}))`,
                    border: "1px solid #ffffff08",
                    borderRadius: 14,
                    padding: "10px 14px",
                    opacity: Math.max(0.52, 0.82 - visualIndex * 0.06),
                    transform: `translateY(${visualIndex * -1}px) scale(${1 - visualIndex * 0.01})`,
                    boxShadow: "none",
                    transition: "transform 240ms ease, opacity 240ms ease",
                  }}
                >
                  <div style={{ color: "#746D80", fontSize: 11, fontFamily: "monospace", fontWeight: 800, marginBottom: 5 }}>{getPreviewLabel(rang)}</div>
                  <div style={{ color: "#81798D", fontSize: 12, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: visualIndex === 0 ? 2 : 1, WebkitBoxOrient: "vertical" }}>
                    {rang.instruction}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, pointerEvents: "none", background: `radial-gradient(circle at 50% 100%, ${currentPartieColor.bg}22 0%, transparent 68%)`, opacity: 0.55 }} />

      <PartieTransitionModals
        allRangs={allRangs}
        completeProject={completeProject}
        confirmNextPartie={confirmNextPartie}
        confirmPrevPartie={confirmPrevPartie}
        currentIndex={currentIndex}
        currentPartie={currentPartie}
        currentPartieColor={currentPartieColor}
        patron={patron}
        projectName={project?.name}
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
