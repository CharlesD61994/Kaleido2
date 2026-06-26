import React, { useState } from "react";
import Icon from "../icons/Icon";
import IconBadge from "../ui/IconBadge";
import ProjectBubble from "../projects/ProjectBubble";
import { ContextMenu, DeleteModal, RenameModal } from "../projects/ProjectMenu";

export { default as EditPdfPatronModal } from "./EditPdfPatronModal";

export default function LibraryView({ database, onNavigateHub, onEditPatron, onNewCustomPatron, onNewPdfPatron, onDeletePatron, onRenamePatron, onChangePatronColor, onChangePatronPhoto, setEditingPdfPatron }) {
  const [search, setSearch] = useState("");
  const [menuPatron, setMenuPatron] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [renamePatron, setRenamePatron] = useState(null);
  const [deletePatron, setDeletePatron] = useState(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const patrons = database.patrons || [];
  const filtered = patrons.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const handleMenuOpen = (patron, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom });
    setMenuPatron(patron);
  };
  return (
    <div style={{ background: "var(--k-bg)", color: "var(--k-text)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 0; }
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-size: 16px !important; }
        @keyframes fadeIn { from { opacity:1; transform:none; } to { opacity:1; transform:none; } }
        @keyframes slideInRight { from { transform: translateX(16px); } to { transform: translateX(0); } }
        @keyframes slideInLeft { from { transform: translateX(-16px); } to { transform: translateX(0); } }
      `}</style>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", background: "var(--k-header-gradient)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button data-kaleido-back-button="true" onClick={() => { if (typeof onNavigateHub === "function") onNavigateHub(); }} style={{ background: "var(--k-surface-2)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>←</button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, background: "linear-gradient(135deg, #A78BFA, #F472B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="library" size={26} color="#A78BFA" />Bibliothèque</span></span>
          <div style={{ flex: 1 }} />
          <div style={{ background: "var(--k-muted-fill-2)", borderRadius: 10, padding: "6px 12px" }}>
            <span style={{ color: "var(--k-muted-2)", fontSize: 12, fontFamily: "monospace" }}>{patrons.length} patron{patrons.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {/* Recherche */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--k-surface)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--k-border)" }}>
          <span style={{ color: "var(--k-muted-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={16} color="var(--k-muted-2)" /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un patron..."
            style={{ background: "none", border: "none", outline: "none", color: "var(--k-text)", flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 15 }} />
        </div>
      </div>
      {/* Grille bulles */}
      <div style={{ padding: "18px 16px 100px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--k-muted-2)", padding: "60px 20px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><IconBadge name="yarn" tone="violet" size={24} badgeSize={52} /></div>
            <div style={{ fontSize: 16, color: "var(--k-text)", marginBottom: 8 }}>Aucun patron</div>
            <div style={{ fontSize: 13 }}>Crée ou importe un patron avec le bouton +</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 112px)", rowGap: 16, columnGap: 14, justifyContent: "start", justifyItems: "center", alignItems: "start", width: "100%", maxWidth: 364, margin: "0 auto" }}>
            {filtered.map((patron, idx) => (
              <div key={patron.id} style={{ animation: `fadeIn 0.3s ease ${idx * 0.04}s both` }}>
                <ProjectBubble
                  project={{ ...patron, rang: patron.projectType === 'pdf' ? 0 : (patron.parties?.reduce((s, p) => s + p.rangs.length, 0) || 0), total: patron.projectType === 'pdf' ? Math.max(1, patron.total||1) : Math.max(1, patron.parties?.reduce((s, p) => s + p.rangs.length, 0) || 1) }}
                  onMenuOpen={handleMenuOpen}
                  onProjectClick={() => {
                    if (patron.projectType === 'pdf') {
                      // Lire directement depuis database.patrons pour avoir pdfParties frais
                      const fresh = (database.patrons || []).find(p => p.id === patron.id);
                      setEditingPdfPatron(fresh ? { ...fresh } : { ...patron });
                    }
                    else onEditPatron(patron);
                  }}
                  mode="personal"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Bouton + */}
      <div style={{ position: "fixed", bottom: 24, right: "calc(50% - 200px)", zIndex: 50 }}>
        <button onClick={() => setShowNewMenu(true)} style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", border: "none", cursor: "pointer", fontSize: 28, color: "#fff", boxShadow: "0 4px 20px #7C3AED88", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>
      {/* Menu contextuel */}
      <ContextMenu project={menuPatron} position={menuPos} onClose={() => setMenuPatron(null)}
        onRename={() => { setRenamePatron(menuPatron); setMenuPatron(null); }}
        onDelete={() => { setDeletePatron(menuPatron); setMenuPatron(null); }}
        onChangePhoto={() => { onChangePatronPhoto(menuPatron.id); setMenuPatron(null); }}
        onChangeColor={(idx) => onChangePatronColor(menuPatron.id, idx)} />
      <RenameModal project={renamePatron} onConfirm={(name) => { onRenamePatron(renamePatron.id, name); setRenamePatron(null); }} onClose={() => setRenamePatron(null)} />
      <DeleteModal project={deletePatron} onConfirm={() => { onDeletePatron(deletePatron.id); setDeletePatron(null); }} onClose={() => setDeletePatron(null)} />
      {/* Menu nouveau patron */}
      {showNewMenu && (
        <div onClick={() => setShowNewMenu(false)} data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} data-kaleido-modal-card="true" style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430 }}>
            <div style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 24px" }} />
            <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 20px", textAlign: "center" }}>Nouveau patron</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => { setShowNewMenu(false); onNewCustomPatron(); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #7C3AED22, #DB277722)", border: "1px solid #7C3AED44", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #DB2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  <Icon name="edit" size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Créer un patron</div>
                  <div style={{ color: "var(--k-muted-2)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Saisis tes parties et rangs manuellement</div>
                </div>
              </button>
              <button onClick={() => { setShowNewMenu(false); onNewPdfPatron(); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #0891B222, #22D3EE22)", border: "1px solid #0891B244", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0891B2, #22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  <Icon name="file" size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Importer un patron PDF</div>
                  <div style={{ color: "var(--k-muted-2)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Télécharge un PDF et donne un nom</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
// EDIT PDF PATRON MODAL
// ═══════════════════════════════════════════════════════════════
