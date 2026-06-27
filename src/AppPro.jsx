import { useMemo, useState } from "react";
import PhotoCropModal from "./components/modals/PhotoCropModal";
import CompleteProjectModal from "./components/projects/CompleteProjectModal";
import { ContextMenu, DeleteModal, RenameModal } from "./components/projects/ProjectMenu";
import ProjectStatsModal from "./components/projects/ProjectStatsModal";
import ProProjectGrid from "./components/pro/ProProjectGrid";
import ProStats from "./components/pro/ProStats";
import ProToolbar from "./components/pro/ProToolbar";

const isProjectCompleted = (project) => (
  project?.status === "termine"
);

export default function AppPro({
  projectsPro = [],
  onProjectOpen,
  onCreateProProject,
  onRenameProProject,
  onDeleteProProject,
  onCompleteProProject,
  onRestoreProProject,
  onChangeProProjectPhoto,
  onChangeProProjectColor,
  onEditProProjectClient,
  onOpenClientPage,
  unreadProjectIds,
}) {
  const [menuProject, setMenuProject] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [renameProject, setRenameProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [completeProject, setCompleteProject] = useState(null);
  const [statsProject, setStatsProject] = useState(null);
  const [photoTarget, setPhotoTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");

  const projects = useMemo(() => (
    [...(projectsPro || [])]
      .filter((project) => project && project.id != null)
      .sort((a, b) => a.id - b.id)
  ), [projectsPro]);

  const totalRangs = useMemo(() => (
    projects.reduce((sum, project) => sum + (Number(project?.rang) || 0), 0)
  ), [projects]);

  const completedCount = useMemo(() => projects.filter(isProjectCompleted).length, [projects]);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        (project?.name || "").toLowerCase().includes(term) ||
        (project?.client || "").toLowerCase().includes(term);

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "En cours":
          return !isProjectCompleted(project);
        case "Terminés":
          return isProjectCompleted(project);
        case "PDF":
          return project?.projectType === "pdf";
        case "Crochet":
          return (project?.type || "").toLowerCase() === "crochet";
        case "Tricot":
          return (project?.type || "").toLowerCase() === "tricot";
        default:
          return true;
      }
    });
  }, [projects, search, activeFilter]);

  const handleMenuOpen = (project, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom });
    setMenuProject(project);
  };

  const handleRename = (newName) => {
    if (renameProject && typeof onRenameProProject === "function") {
      onRenameProProject(renameProject.id, newName);
    }
    setRenameProject(null);
  };

  const handleDelete = () => {
    if (deleteProject && typeof onDeleteProProject === "function") {
      onDeleteProProject(deleteProject.id);
    }
    setDeleteProject(null);
  };

  const handleEditClient = () => {
    if (menuProject && typeof onEditProProjectClient === "function") {
      onEditProProjectClient(menuProject);
    }
    setMenuProject(null);
  };

  return (
    <>
      <div style={{ padding: "0 20px", boxSizing: "border-box" }}>
        <ProStats projectCount={projects.length} totalRangs={totalRangs} completedCount={completedCount} />
        <ProToolbar search={search} activeFilter={activeFilter} onSearchChange={setSearch} onFilterChange={setActiveFilter} />
      </div>
      <ProProjectGrid projects={filteredProjects} unreadProjectIds={unreadProjectIds} onProjectOpen={onProjectOpen} onMenuOpen={handleMenuOpen} onCompletedProjectOpen={setStatsProject} />

      <div style={{ position: "fixed", bottom: 28, right: "calc(50% - 172px)", zIndex: 50 }}>
        <button
          onClick={onCreateProProject}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            border: "none",
            cursor: "pointer",
            fontSize: 28,
            color: "#fff",
            boxShadow: "0 4px 20px #7C3AED88",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>

      <ContextMenu
        project={menuProject}
        position={menuPos}
        onClose={() => setMenuProject(null)}
        onRename={() => { setRenameProject(menuProject); setMenuProject(null); }}
        onDelete={() => { setDeleteProject(menuProject); setMenuProject(null); }}
        onChangePhoto={() => { setPhotoTarget(menuProject); setMenuProject(null); }}
        onEditClient={handleEditClient}
        onComplete={() => { setCompleteProject(menuProject); setMenuProject(null); }}
        onRestore={() => {
          if (menuProject && typeof onRestoreProProject === "function") {
            onRestoreProProject(menuProject.id, { status: "en_cours", completedAt: null });
          }
          setMenuProject(null);
        }}
        onChangeColor={(idx) => {
          if (menuProject && typeof onChangeProProjectColor === "function") {
            onChangeProProjectColor(menuProject.id, idx);
          }
        }}
      />

      <RenameModal project={renameProject} onConfirm={handleRename} onClose={() => setRenameProject(null)} />
      <DeleteModal project={deleteProject} onConfirm={handleDelete} onClose={() => setDeleteProject(null)} />
      <CompleteProjectModal
        project={completeProject}
        onClose={() => setCompleteProject(null)}
        onConfirm={() => {
          if (completeProject && typeof onCompleteProProject === "function") {
            onCompleteProProject(completeProject.id, {
              rang: Math.max(Number(completeProject.total) || 0, Number(completeProject.rang) || 0),
              status: "termine",
              completedAt: completeProject.completedAt || new Date().toISOString(),
            });
          }
          setCompleteProject(null);
        }}
      />
      <ProjectStatsModal
        project={statsProject}
        onClose={() => setStatsProject(null)}
        onOpenClientPage={(project) => {
          setStatsProject(null);
          onOpenClientPage?.(project);
        }}
      />

      {photoTarget && (
        <PhotoCropModal
          existingImage={projects.find((project) => project.id === photoTarget.id)?.image}
          onClose={() => setPhotoTarget(null)}
          onConfirm={(imgData) => {
            if (typeof onChangeProProjectPhoto === "function") {
              onChangeProProjectPhoto(photoTarget.id, imgData);
            }
            setPhotoTarget(null);
          }}
        />
      )}
    </>
  );
}
