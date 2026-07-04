import React from "react";
import ProjectBubble from "../projects/ProjectBubble";
import FolderBubble from "../folders/FolderBubble";

const isProjectCompleted = (project) => (
  project?.status === "termine"
);

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 364, margin: "18px auto 8px" }}>
      <div style={{ height: 1, flex: 1, background: "var(--k-divider)" }} />
      <div style={{ color: "var(--k-muted-3)", fontSize: 11, fontFamily: "monospace", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</div>
      <div style={{ height: 1, flex: 1, background: "var(--k-divider)" }} />
    </div>
  );
}

function ProjectGridSection({ projects, folders = [], allProjects = [], handleMenuOpen, onFolderOpen, onFolderMenuOpen, mode, navigateToPdfViewer, navigateToRowCounter, onCompletedProjectOpen, completed = false }) {
  if (projects.length === 0 && folders.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 112px)", rowGap: 16, columnGap: 14, justifyContent: "start", justifyItems: "center", alignItems: "start", width: "100%", maxWidth: 364, margin: "0 auto", transform: "translateX(-4px)" }}>
      {folders.map((folder) => (
        <FolderBubble
          key={folder.id}
          folder={folder}
          count={allProjects.filter((project) => project.folderId === folder.id).length}
          onOpen={onFolderOpen}
          onMenuOpen={onFolderMenuOpen}
        />
      ))}
      {projects.map((project) => (
        <div key={project.id}>
          <ProjectBubble
            project={project}
            onMenuOpen={handleMenuOpen}
            onProjectClick={(selectedProject) => {
              if (completed) {
                onCompletedProjectOpen?.(selectedProject);
                return;
              }
              selectedProject.projectType === "pdf" ? navigateToPdfViewer(selectedProject) : navigateToRowCounter(selectedProject);
            }}
            mode={mode}
          />
        </div>
      ))}
    </div>
  );
}

export default function PersonalProjectGrid({
  filtered,
  folders = [],
  handleMenuOpen,
  onFolderOpen,
  onFolderMenuOpen,
  mode,
  projects = [],
  navigateToPdfViewer,
  navigateToRowCounter,
  onCompletedProjectOpen,
}) {
  const rootFiltered = filtered.filter((project) => !project.folderId);
  const activeProjects = rootFiltered.filter((project) => !isProjectCompleted(project));
  const completedProjects = rootFiltered.filter(isProjectCompleted);

  return (
    <div style={{ padding: "18px 16px 116px" }}>
      <ProjectGridSection projects={activeProjects} folders={folders} allProjects={projects} handleMenuOpen={handleMenuOpen} onFolderOpen={onFolderOpen} onFolderMenuOpen={onFolderMenuOpen} mode={mode} navigateToPdfViewer={navigateToPdfViewer} navigateToRowCounter={navigateToRowCounter} />
      {completedProjects.length > 0 && <SectionTitle>Patrons terminés</SectionTitle>}
      <ProjectGridSection projects={completedProjects} handleMenuOpen={handleMenuOpen} mode={mode} navigateToPdfViewer={navigateToPdfViewer} navigateToRowCounter={navigateToRowCounter} onCompletedProjectOpen={onCompletedProjectOpen} completed />
      {rootFiltered.length === 0 && folders.length === 0 && <div style={{ textAlign: "center", color: "var(--k-muted-2)", padding: "40px 0", fontSize: 14 }}>Aucun projet trouvé</div>}
    </div>
  );
}
