import React from "react";
import PhotoCropModal from "../modals/PhotoCropModal";
import CompleteProjectModal from "../projects/CompleteProjectModal";
import { ContextMenu, DeleteModal, RenameModal } from "../projects/ProjectMenu";
import { FLOATING_ACTION_BOTTOM } from "../../styles/layout";

export default function PersonalProjectActions({
  database,
  deleteProject,
  handleDelete,
  handleNewProject,
  handleRename,
  menuPos,
  menuProject,
  persistPatronImageToIndexedDB,
  persistProjectImageToIndexedDB,
  photoTarget,
  projects,
  renameProject,
  setDeleteProject,
  setMenuProject,
  setPhotoTarget,
  setRenameProject,
  updateProject,
  onCreateFolder,
  folders = [],
  onMoveToFolder,
  onRemoveFromFolder,
  showFloatingAction = true,
}) {
  const [completeProject, setCompleteProject] = React.useState(null);
  const [showActionMenu, setShowActionMenu] = React.useState(false);

  const confirmCompleteProject = () => {
    if (!completeProject) return;
    updateProject(completeProject.id, {
      rang: Math.max(Number(completeProject.total) || 0, Number(completeProject.rang) || 0),
      status: "termine",
      completedAt: completeProject.completedAt || new Date().toISOString(),
    });
    setCompleteProject(null);
  };

  return (
    <>
      {showFloatingAction && (
        <div style={{ position: "fixed", bottom: FLOATING_ACTION_BOTTOM, right: "calc(50% - 184px)", zIndex: 50 }}>
          <button onClick={() => setShowActionMenu(true)} style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", border: "none", cursor: "pointer", fontSize: 28, color: "#fff", boxShadow: "0 4px 20px #7C3AED88", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
      )}

      {showFloatingAction && showActionMenu && (
        <div data-kaleido-modal-backdrop="true" onClick={() => setShowActionMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div data-kaleido-modal-card="true" onClick={(event) => event.stopPropagation()} style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430 }}>
            <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 24px" }} />
            <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 20px", textAlign: "center" }}>Nouveau</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => { setShowActionMenu(false); handleNewProject(); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #05966922, #34D39922)", border: "1px solid #05966944", cursor: "pointer", textAlign: "left" }}>
                <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 800 }}>Créer un projet</div>
              </button>
              {onCreateFolder && (
                <button onClick={() => { setShowActionMenu(false); onCreateFolder(); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg, #A78BFA22, #F472B622)", border: "1px solid #A78BFA44", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 800 }}>Créer un dossier</div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ContextMenu
        project={menuProject}
        position={menuPos}
        onClose={() => setMenuProject(null)}
        onRename={() => {
          setRenameProject(menuProject);
          setMenuProject(null);
        }}
        onDelete={() => {
          setDeleteProject(menuProject);
          setMenuProject(null);
        }}
        onChangePhoto={() => {
          setPhotoTarget({ id: menuProject.id, context: "project" });
          setMenuProject(null);
        }}
        onChangeColor={(idx) => updateProject(menuProject.id, { colorIdx: idx })}
        onComplete={() => {
          setCompleteProject(menuProject);
          setMenuProject(null);
        }}
        onRestore={() => {
          updateProject(menuProject.id, { status: "en_cours", completedAt: null });
          setMenuProject(null);
        }}
        folders={folders}
        folderSectionLabel="Personnel"
        onMoveToFolder={(folderId) => {
          onMoveToFolder?.(menuProject.id, folderId);
          setMenuProject(null);
        }}
        onRemoveFromFolder={() => {
          onRemoveFromFolder?.(menuProject.id);
          setMenuProject(null);
        }}
      />

      <RenameModal project={renameProject} onConfirm={handleRename} onClose={() => setRenameProject(null)} />
      <DeleteModal project={deleteProject} onConfirm={handleDelete} onClose={() => setDeleteProject(null)} />
      <CompleteProjectModal project={completeProject} onConfirm={confirmCompleteProject} onClose={() => setCompleteProject(null)} />

      {photoTarget && (
        <PhotoCropModal
          existingImage={photoTarget.context === "project"
            ? projects.find((project) => project.id === photoTarget.id)?.image
            : (database.patrons || []).find((patron) => patron.id === photoTarget.id)?.image}
          onClose={() => setPhotoTarget(null)}
          onConfirm={async (imgData) => {
            if (photoTarget.context === "project") {
              await persistProjectImageToIndexedDB(photoTarget.id, imgData, "personal");
            } else {
              await persistPatronImageToIndexedDB(photoTarget.id, imgData);
            }
            setPhotoTarget(null);
          }}
        />
      )}
    </>
  );
}
