import React from "react";
import ProjectBubble from "../projects/ProjectBubble";

const isProjectCompleted = (project) => (
  project?.status === "termine"
);

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 364, margin: "18px auto 8px" }}>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ color: "#77758A", fontSize: 11, fontFamily: "monospace", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</div>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

function ProjectGridSection({ projects, handleMenuOpen, mode, navigateToPdfViewer, navigateToRowCounter, onCompletedProjectOpen, completed = false }) {
  if (projects.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 112px)", rowGap: 16, columnGap: 14, justifyContent: "start", justifyItems: "center", alignItems: "start", width: "100%", maxWidth: 364, margin: "0 auto" }}>
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
  handleMenuOpen,
  mode,
  navigateToPdfViewer,
  navigateToRowCounter,
  onCompletedProjectOpen,
}) {
  const activeProjects = filtered.filter((project) => !isProjectCompleted(project));
  const completedProjects = filtered.filter(isProjectCompleted);

  return (
    <div style={{ padding: "18px 16px 116px" }}>
      <ProjectGridSection projects={activeProjects} handleMenuOpen={handleMenuOpen} mode={mode} navigateToPdfViewer={navigateToPdfViewer} navigateToRowCounter={navigateToRowCounter} />
      {completedProjects.length > 0 && <SectionTitle>Patrons terminés</SectionTitle>}
      <ProjectGridSection projects={completedProjects} handleMenuOpen={handleMenuOpen} mode={mode} navigateToPdfViewer={navigateToPdfViewer} navigateToRowCounter={navigateToRowCounter} onCompletedProjectOpen={onCompletedProjectOpen} completed />
      {filtered.length === 0 && <div style={{ textAlign: "center", color: "#6B6A7A", padding: "40px 0", fontSize: 14 }}>Aucun projet trouvé</div>}
    </div>
  );
}
