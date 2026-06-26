import ProBubble from "./ProBubble";

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

function GridSection({ projects, unreadProjectIds, onProjectOpen, onMenuOpen, onCompletedProjectOpen, completed = false }) {
  if (projects.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 112px)",
        columnGap: 14,
        rowGap: 16,
        justifyContent: "start",
        justifyItems: "center",
        alignItems: "start",
        width: "100%",
        maxWidth: 364,
        margin: "0 auto",
      }}
    >
      {projects.map((project) => (
        <div key={project.id || project.name}>
          <ProBubble
            project={project}
            unreadClientMessageCount={unreadProjectIds?.get?.(String(project.id)) || 0}
            onOpen={completed ? onCompletedProjectOpen : onProjectOpen}
            onMenuOpen={onMenuOpen}
          />
        </div>
      ))}
    </div>
  );
}

export default function ProProjectGrid({ projects, unreadProjectIds, onProjectOpen, onMenuOpen, onCompletedProjectOpen }) {
  const activeProjects = projects.filter((project) => !isProjectCompleted(project));
  const completedProjects = projects.filter(isProjectCompleted);

  return (
    <div style={{ padding: "18px 16px 116px" }}>
      {projects.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--k-muted-2)", padding: "40px 0", fontSize: 14 }}>
          Aucun projet trouvé
        </div>
      ) : (
        <>
          <GridSection projects={activeProjects} unreadProjectIds={unreadProjectIds} onProjectOpen={onProjectOpen} onMenuOpen={onMenuOpen} />
          {completedProjects.length > 0 && <SectionTitle>Patrons terminés</SectionTitle>}
          <GridSection projects={completedProjects} unreadProjectIds={unreadProjectIds} onProjectOpen={onProjectOpen} onMenuOpen={onMenuOpen} onCompletedProjectOpen={onCompletedProjectOpen} completed />
        </>
      )}
    </div>
  );
}
