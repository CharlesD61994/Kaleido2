import React from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import IconBadge from "../ui/IconBadge";

function PartieSummary({ color, label, partie }) {
  if (!partie) return null;

  return (
    <div style={{ background: `${color.bg}22`, border: `1px solid ${color.light}44`, borderRadius: 14, padding: "12px 16px", marginBottom: 24 }}>
      <div style={{ color: color.light, fontSize: 12, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#F1F0EE", fontSize: 17, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{partie.nom}</div>
      <div style={{ color: "#6B6A7A", fontSize: 12, marginTop: 4 }}>{partie.totalRangs} rangs</div>
    </div>
  );
}

function ProgressModal({ borderColor, children }) {
  return (
    <div data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div data-kaleido-modal-card="true" style={{ background: "#1A1A2E", borderRadius: 24, padding: 28, width: "100%", maxWidth: 360, textAlign: "center", border: `1px solid ${borderColor}33` }}>
        {children}
      </div>
    </div>
  );
}

export default function PdfProgressModals({
  color,
  completeProject,
  currentPartie,
  currentPartieIdx,
  pdfParties,
  project,
  setCurrentPartieIdx,
  setRang,
  setShowFinModal,
  setShowNextPartieModal,
  setShowPrevPartieModal,
  showFinModal,
  showNextPartieModal,
  showPrevPartieModal,
}) {
  const nextPartie = pdfParties[currentPartieIdx + 1];
  const nextColor = nextPartie ? KALEIDOSCOPE_COLORS[nextPartie.colorIdx % KALEIDOSCOPE_COLORS.length] : color;
  const prevPartie = pdfParties[currentPartieIdx - 1];
  const prevColor = prevPartie ? KALEIDOSCOPE_COLORS[prevPartie.colorIdx % KALEIDOSCOPE_COLORS.length] : color;

  return (
    <>
      {showNextPartieModal && (
        <ProgressModal borderColor={color.light}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><IconBadge name="sparkles" tone="amber" size={24} badgeSize={56} /></div>
          <div style={{ color: color.light, fontSize: 13, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Partie terminee</div>
          <h2 style={{ color: "#F1F0EE", fontSize: 20, fontFamily: "'Syne', sans-serif", margin: "0 0 8px" }}>{currentPartie?.nom}</h2>
          <p style={{ color: "#6B6A7A", fontSize: 14, margin: "0 0 24px" }}>Tu veux passer a la partie suivante ?</p>
          <PartieSummary color={nextColor} label="Prochaine partie" partie={nextPartie} />
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setShowNextPartieModal(false)} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #333", background: "none", color: "#999", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Rester ici
            </button>
            <button
              onClick={() => {
                let offset = 0;
                for (let i = 0; i <= currentPartieIdx; i++) offset += pdfParties[i].totalRangs;
                setRang(offset + 1);
                setShowNextPartieModal(false);
              }}
              style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${nextColor.bg}, ${nextColor.light})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Continuer
            </button>
          </div>
        </ProgressModal>
      )}

      {showPrevPartieModal && (
        <ProgressModal borderColor={color.light}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><IconBadge name="undo" tone="slate" size={22} badgeSize={56} /></div>
          <div style={{ color: color.light, fontSize: 13, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Revenir en arriere ?</div>
          <h2 style={{ color: "#F1F0EE", fontSize: 20, fontFamily: "'Syne', sans-serif", margin: "0 0 8px" }}>{currentPartie?.nom}</h2>
          <p style={{ color: "#6B6A7A", fontSize: 14, margin: "0 0 24px" }}>Tu veux retourner a la partie precedente ?</p>
          <PartieSummary color={prevColor} label="Partie precedente" partie={prevPartie} />
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setShowPrevPartieModal(false)} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #333", background: "none", color: "#999", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Rester ici
            </button>
            <button
              onClick={() => {
                let offset = 0;
                for (let i = 0; i < currentPartieIdx - 1; i++) offset += pdfParties[i].totalRangs;
                setRang(offset + (prevPartie?.totalRangs || 1));
                setShowPrevPartieModal(false);
              }}
              style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${prevColor.bg}, ${prevColor.light})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Retourner
            </button>
          </div>
        </ProgressModal>
      )}

      {showFinModal && (
        <ProgressModal borderColor={color.light}>
          <div style={{ fontSize: 52, marginBottom: 12 }} />
          <div style={{ color: color.light, fontSize: 13, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Patron termine</div>
          <h2 style={{ color: "#F1F0EE", fontSize: 20, fontFamily: "'Syne', sans-serif", margin: "0 0 8px" }}>{project?.name}</h2>
          <p style={{ color: "#6B6A7A", fontSize: 14, margin: "0 0 24px" }}>Tous les rangs sont completes. Le projet sera archive dans les patrons termines.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setShowFinModal(false)} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #333", background: "none", color: "#999", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Rester ici
            </button>
            <button onClick={completeProject} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Termine
            </button>
          </div>
        </ProgressModal>
      )}
    </>
  );
}
