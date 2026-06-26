import { useCallback, useMemo, useState } from "react";

const isProjectCompleted = (project) => (
  project?.status === "termine"
);

export default function useHomeProjects({
  projects,
  updateProject,
  deleteProjectFromDB,
  setCreationMode,
  setShowNewMenu,
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [menuProject, setMenuProject] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [renameProject, setRenameProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      if (normalizedSearch && !project.name.toLowerCase().includes(normalizedSearch)) return false;

      const completed = isProjectCompleted(project);
      if (activeFilter === "Tous") return true;
      if (activeFilter === "En cours") return !completed;
      if (activeFilter === "Terminés") return completed;
      if (activeFilter === "PDF") return project.projectType === "pdf";
      if (activeFilter === "Crochet") return project.type === "crochet";
      if (activeFilter === "Tricot") return project.type === "tricot";
      return true;
    });
  }, [activeFilter, projects, search]);

  const totalRangs = useMemo(
    () => projects.reduce((sum, project) => sum + (Number(project.rang) || 0), 0),
    [projects]
  );

  const termines = useMemo(
    () => projects.filter(isProjectCompleted).length,
    [projects]
  );

  const handleNewProject = useCallback(() => {
    setCreationMode("personal");
    setShowNewMenu(true);
  }, [setCreationMode, setShowNewMenu]);

  const handleMenuOpen = useCallback((project, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom });
    setMenuProject(project);
  }, []);

  const handleRename = useCallback((newName) => {
    if (!renameProject) return;
    updateProject(renameProject.id, { name: newName });
    setRenameProject(null);
  }, [renameProject, updateProject]);

  const handleDelete = useCallback(() => {
    if (!deleteProject) return;
    deleteProjectFromDB(deleteProject.id);
    setDeleteProject(null);
  }, [deleteProject, deleteProjectFromDB]);

  return {
    activeFilter,
    deleteProject,
    filtered,
    handleDelete,
    handleMenuOpen,
    handleNewProject,
    handleRename,
    menuPos,
    menuProject,
    renameProject,
    search,
    setActiveFilter,
    setDeleteProject,
    setMenuProject,
    setRenameProject,
    setSearch,
    termines,
    totalRangs,
  };
}
