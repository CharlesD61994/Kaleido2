import React from "react";
import PersonalProjectActions from "./PersonalProjectActions";
import PersonalProjectGrid from "./PersonalProjectGrid";
import PersonalProjectToolbar from "./PersonalProjectToolbar";
import ProjectStatsModal from "../projects/ProjectStatsModal";

export default function PersonalHomeContent({
  database,
  home,
  mode,
  navigation,
  photo,
  projects,
  records,
}) {
  const {
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
  } = home;

  const { navigateToPdfViewer, navigateToRowCounter } = navigation;

  const {
    persistPatronImageToIndexedDB,
    persistProjectImageToIndexedDB,
    photoTarget,
    setPhotoTarget,
  } = photo;

  const { updateProject } = records;
  const [statsProject, setStatsProject] = React.useState(null);

  return (
    <>
      <PersonalProjectToolbar
        activeFilter={activeFilter}
        projects={projects}
        search={search}
        setActiveFilter={setActiveFilter}
        setSearch={setSearch}
        termines={termines}
        totalRangs={totalRangs}
      />
      <PersonalProjectGrid
        filtered={filtered}
        handleMenuOpen={handleMenuOpen}
        mode={mode}
        navigateToPdfViewer={navigateToPdfViewer}
        navigateToRowCounter={navigateToRowCounter}
        onCompletedProjectOpen={setStatsProject}
      />
      <PersonalProjectActions
        database={database}
        deleteProject={deleteProject}
        handleDelete={handleDelete}
        handleNewProject={handleNewProject}
        handleRename={handleRename}
        menuPos={menuPos}
        menuProject={menuProject}
        persistPatronImageToIndexedDB={persistPatronImageToIndexedDB}
        persistProjectImageToIndexedDB={persistProjectImageToIndexedDB}
        photoTarget={photoTarget}
        projects={projects}
        renameProject={renameProject}
        setDeleteProject={setDeleteProject}
        setMenuProject={setMenuProject}
        setPhotoTarget={setPhotoTarget}
        setRenameProject={setRenameProject}
        updateProject={updateProject}
      />
      <ProjectStatsModal project={statsProject} onClose={() => setStatsProject(null)} />
    </>
  );
}
