import React, { useState } from "react";
import Icon from "../icons/Icon";
import IconBadge from "../ui/IconBadge";
import ProjectBubble from "../projects/ProjectBubble";
import { ContextMenu, DeleteModal, RenameModal } from "../projects/ProjectMenu";
import { FLOATING_ACTION_BOTTOM, IOS_TOP_PADDING } from "../../styles/layout";
import FolderBubble from "../folders/FolderBubble";
import FolderCreateModal from "../folders/FolderCreateModal";
import FolderView from "../folders/FolderView";
import { FOLDER_SECTIONS, getFolders } from "../../services/folderStore";

export { default as EditPdfPatronModal } from "./EditPdfPatronModal";

export default function LibraryView({
  database,
  folderRecords,
  onNavigateHub,
  onEditPatron,
  onNewCustomPatron,
  onNewPdfPatron,
  onDeletePatron,
  onRenamePatron,
  onChangePatronColor,
  onChangePatronPhoto,
  setEditingPdfPatron,
  activeFolderId,
  onActiveFolderChange,
}) {
  const [search, setSearch] = useState("");
  const [menuPatron, setMenuPatron] = useState(null);
  const [menuFolder, setMenuFolder] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [renamePatron, setRenamePatron] = useState(null);
  const [deletePatron, setDeletePatron] = useState(null);
  const [renameFolder, setRenameFolder] = useState(null);
  const [deleteFolder, setDeleteFolder] = useState(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const patrons = database.patrons || [];
  const folders = getFolders(database, FOLDER_SECTIONS.LIBRARY);
  const activeFolder = folders.find((folder) => folder.id === activeFolderId) || null;
  const term = search.trim().toLowerCase();
  const rootPatrons = patrons.filter((patron) => !patron.folderId);
  const folderPatrons = activeFolder ? patrons.filter((patron) => patron.folderId === activeFolder.id) : [];
  const searchablePatrons = term ? patrons : rootPatrons;
  const filtered = searchablePatrons.filter((patron) => !term || patron.name.toLowerCase().includes(term));
  const visibleFolders = folders.filter((folder) => !term || folder.name.toLowerCase().includes(term));
  const movePatronToFolder = (patronId, folderId) => {
    folderRecords?.moveItemToFolder({ section: FOLDER_SECTIONS.LIBRARY, itemId: patronId, folderId });
  };

  const openPatron = (patron) => {
    if (patron.projectType === "pdf") {
      const fresh = (database.patrons || []).find((item) => item.id === patron.id);
      setEditingPdfPatron(fresh ? { ...fresh } : { ...patron });
    } else {
      onEditPatron(patron);
    }
  };

  const handleMenuOpen = (patron, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom });
    setMenuPatron(patron);
  };

  const handleFolderMenuOpen = (folder, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom });
    setMenuFolder(folder);
  };

  const renderPatronMenu = () => (
    <>
      <ContextMenu project={menuPatron} position={menuPos} onClose={() => setMenuPatron(null)}
        onRename={() => { setRenamePatron(menuPatron); setMenuPatron(null); }}
        onDelete={() => { setDeletePatron(menuPatron); setMenuPatron(null); }}
        onChangePhoto={() => { onChangePatronPhoto(menuPatron.id); setMenuPatron(null); }}
        onChangeColor={(idx) => onChangePatronColor(menuPatron.id, idx)}
        folders={folders}
        folderSectionLabel="Bibliothèque"
        onMoveToFolder={(folderId) => {
          movePatronToFolder(menuPatron.id, folderId);
          setMenuPatron(null);
        }}
        onRemoveFromFolder={() => {
          movePatronToFolder(menuPatron.id, null);
          setMenuPatron(null);
        }} />
      <RenameModal project={renamePatron} onConfirm={(name) => { onRenamePatron(renamePatron.id, name); setRenamePatron(null); }} onClose={() => setRenamePatron(null)} />
      <DeleteModal project={deletePatron} onConfirm={() => { onDeletePatron(deletePatron.id); setDeletePatron(null); }} onClose={() => setDeletePatron(null)} />
    </>
  );

  if (activeFolder) {
    return (
      <>
        <FolderView
          folder={activeFolder}
          items={folderPatrons}
          mode="library"
          onBack={() => onActiveFolderChange?.(null)}
          onItemMenuOpen={handleMenuOpen}
          onItemOpen={openPatron}
        />
        {renderPatronMenu()}
      </>
    );
  }

  return (
    <div style={{ background: "var(--k-bg)", color: "var(--k-text)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 0; }
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-size: 16px !important; }
        @keyframes fadeIn { from { opacity:1; transform:none; } to { opacity:1; transform:none; } }
      `}</style>
      <div style={{ padding: `${IOS_TOP_PADDING} 20px 16px`, background: "var(--k-header-gradient)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button data-kaleido-back-button="true" onClick={() => { if (typeof onNavigateHub === "function") onNavigateHub(); }} style={{ background: "var(--k-surface-2)", border: "1px solid var(--k-control-border)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA", cursor: "pointer", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, background: "linear-gradient(135deg, #A78BFA, #F472B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="library" size={26} color="#A78BFA" />Bibliothèque</span></span>
          <div style={{ flex: 1 }} />
          <div style={{ background: "var(--k-muted-fill-2)", borderRadius: 10, padding: "6px 12px" }}>
            <span style={{ color: "var(--k-muted-2)", fontSize: 12, fontFamily: "monospace" }}>{patrons.length} patron{patrons.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--k-surface)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--k-border)" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={16} color="var(--k-muted-2)" /></span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un patron..."
            style={{ background: "none", border: "none", outline: "none", color: "var(--k-text)", flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 15 }} />
        </div>
      </div>

      <div style={{ padding: "10px 16px 100px" }}>
        {filtered.length === 0 && visibleFolders.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--k-muted-2)", padding: "60px 20px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><IconBadge name="yarn" tone="violet" size={24} badgeSize={52} /></div>
            <div style={{ fontSize: 16, color: "var(--k-text)", marginBottom: 8 }}>Aucun patron</div>
            <div style={{ fontSize: 13 }}>Crée ou importe un patron avec le bouton +</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 112px)", rowGap: 16, columnGap: 14, justifyContent: "start", justifyItems: "center", alignItems: "start", width: "100%", maxWidth: 364, margin: "0 auto", transform: "translateX(-4px)" }}>
            {visibleFolders.map((folder) => (
              <FolderBubble
                key={folder.id}
                folder={folder}
                count={patrons.filter((patron) => patron.folderId === folder.id).length}
                onOpen={(selectedFolder) => onActiveFolderChange?.(selectedFolder.id)}
                onMenuOpen={handleFolderMenuOpen}
              />
            ))}
            {filtered.map((patron, idx) => (
              <div key={patron.id} style={{ animation: `fadeIn 0.3s ease ${idx * 0.04}s both` }}>
                <ProjectBubble
                  project={{ ...patron, rang: patron.projectType === "pdf" ? 0 : (patron.parties?.reduce((sum, partie) => sum + partie.rangs.length, 0) || 0), total: patron.projectType === "pdf" ? Math.max(1, patron.total || 1) : Math.max(1, patron.parties?.reduce((sum, partie) => sum + partie.rangs.length, 0) || 1) }}
                  onMenuOpen={handleMenuOpen}
                  onProjectClick={openPatron}
                  mode="library"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: FLOATING_ACTION_BOTTOM, right: "calc(50% - 184px)", zIndex: 50 }}>
        <button onClick={() => setShowNewMenu(true)} style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", border: "none", cursor: "pointer", fontSize: 28, color: "#fff", boxShadow: "0 4px 20px #7C3AED88", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>

      {renderPatronMenu()}
      <ContextMenu project={menuFolder} position={menuPos} onClose={() => setMenuFolder(null)}
        onRename={() => { setRenameFolder(menuFolder); setMenuFolder(null); }}
        onDelete={() => { setDeleteFolder(menuFolder); setMenuFolder(null); }}
        onChangeColor={(idx) => folderRecords?.changeFolderColor(menuFolder.id, idx)} />
      <RenameModal project={renameFolder} onConfirm={(name) => { folderRecords?.renameFolder(renameFolder.id, name); setRenameFolder(null); }} onClose={() => setRenameFolder(null)} />
      <DeleteModal project={deleteFolder} onConfirm={() => { folderRecords?.deleteFolder(deleteFolder.id); setDeleteFolder(null); }} onClose={() => setDeleteFolder(null)} />

      {showNewMenu && (
        <div onClick={() => setShowNewMenu(false)} data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(event) => event.stopPropagation()} data-kaleido-modal-card="true" style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430 }}>
            <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 24px" }} />
            <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 20px", textAlign: "center" }}>Nouveau patron</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => { setShowNewMenu(false); onNewCustomPatron(); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #7C3AED22, #DB277722)", border: "1px solid #7C3AED44", cursor: "pointer", textAlign: "left" }}>
                <IconBadge name="edit" tone="violet" size={22} />
                <div>
                  <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Créer un patron</div>
                  <div style={{ color: "var(--k-muted-2)", fontSize: 13 }}>Saisis tes parties et rangs manuellement</div>
                </div>
              </button>
              <button onClick={() => { setShowNewMenu(false); onNewPdfPatron(); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #0891B222, #22D3EE22)", border: "1px solid #0891B244", cursor: "pointer", textAlign: "left" }}>
                <IconBadge name="file" tone="blue" size={22} />
                <div>
                  <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Importer un patron PDF</div>
                  <div style={{ color: "var(--k-muted-2)", fontSize: 13 }}>Télécharge un PDF et donne un nom</div>
                </div>
              </button>
              <button onClick={() => { setShowNewMenu(false); setShowFolderModal(true); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #A78BFA22, #F472B622)", border: "1px solid #A78BFA44", cursor: "pointer", textAlign: "left" }}>
                <IconBadge name="folder" tone="pink" size={23} />
                <div>
                  <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Créer un dossier</div>
                  <div style={{ color: "var(--k-muted-2)", fontSize: 13 }}>Regroupe des patrons dans la bibliothèque</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showFolderModal && (
        <FolderCreateModal
          sectionLabel="la bibliothèque"
          onClose={() => setShowFolderModal(false)}
          onCreate={(name) => {
            folderRecords?.createFolder({ name, section: FOLDER_SECTIONS.LIBRARY, colorIdx: Math.floor(Math.random() * 12) });
            setShowFolderModal(false);
          }}
        />
      )}
    </div>
  );
}
