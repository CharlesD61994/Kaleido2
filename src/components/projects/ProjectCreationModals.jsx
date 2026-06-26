import React from "react";
import IconBadge from "../ui/IconBadge";
import ProjectBubble from "./ProjectBubble";

export default function ProjectCreationModals({
  showNewMenu,
  showSelectPatronModal,
  database,
  onCloseNewMenu,
  onOpenSelectPatron,
  onCloseSelectPatron,
  onNavigateLibrary,
  onCreateProjectFromPatron,
}) {
  const patrons = database.patrons || [];

  return (
    <>
      {showNewMenu && (
        <div data-kaleido-modal-backdrop="true" onClick={onCloseNewMenu} style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div data-kaleido-modal-card="true" onClick={(e) => e.stopPropagation()} style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430 }}>
            <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 24px" }} />
            <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 20px", textAlign: "center" }}>Nouveau projet</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {patrons.length > 0 && (
                <button
                  onClick={() => {
                    onCloseNewMenu();
                    onOpenSelectPatron();
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #05966922, #34D39922)", border: "1px solid #05966944", cursor: "pointer", textAlign: "left" }}
                >
                  <IconBadge name="bookOpen" tone="green" size={24} />
                  <div>
                    <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>Choisir un patron</div>
                    <div style={{ color: "var(--k-muted-2)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{patrons.length} patron{patrons.length > 1 ? "s" : ""} dans ta bibliothèque</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  onCloseNewMenu();
                  onNavigateLibrary();
                }}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #7C3AED22, #A78BFA22)", border: "1px solid #7C3AED44", cursor: "pointer", textAlign: "left" }}
              >
                <IconBadge name="library" tone="violet" size={24} />
                <div>
                  <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>Aller à la bibliothèque</div>
                  <div style={{ color: "var(--k-muted-2)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Crée ou importe un patron d'abord</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showSelectPatronModal && (
        <div data-kaleido-modal-backdrop="true" onClick={onCloseSelectPatron} style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div data-kaleido-modal-card="true" onClick={(e) => e.stopPropagation()} style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "24px 24px 0 0", padding: "20px 6px 40px", width: "100%", maxWidth: 430, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 16px" }} />
            <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 4px", textAlign: "center" }}>Choisir un patron</h3>
            <p style={{ color: "var(--k-muted-2)", fontSize: 12, textAlign: "center", margin: "0 0 16px", fontFamily: "'DM Sans', sans-serif" }}>Appuie sur une bulle pour créer le projet</p>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 4, columnGap: 0 }}>
                {patrons.map((patron, idx) => (
                  <div key={patron.id} style={{ animation: `fadeIn 0.3s ease ${idx * 0.04}s both` }}>
                    <ProjectBubble
                      project={{
                        ...patron,
                        rang: patron.projectType === "pdf" ? 0 : (patron.parties?.reduce((s, p) => s + p.rangs?.length, 0) || 0),
                        total: patron.projectType === "pdf" ? 1 : Math.max(1, patron.parties?.reduce((s, p) => s + p.rangs?.length, 0) || 1),
                      }}
                      onMenuOpen={null}
                      onProjectClick={() => {
                        onCreateProjectFromPatron(patron);
                        onCloseSelectPatron();
                      }}
                      mode="personal"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
