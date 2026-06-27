import React from "react";
import PhotoCropModal from "../modals/PhotoCropModal";
import CompleteProjectModal from "../projects/CompleteProjectModal";
import { ContextMenu, DeleteModal, RenameModal } from "../projects/ProjectMenu";

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
}) {
  const [completeProject, setCompleteProject] = React.useState(null);
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
      <div style={{ position: "fixed", bottom: 28, right: "calc(50% - 172px)", zIndex: 50 }}>
        <button onClick={handleNewProject} style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", border: "none", cursor: "pointer", fontSize: 28, color: "#fff", boxShadow: "0 4px 20px #7C3AED88", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>

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
