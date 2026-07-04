import React from "react";
import PersonalProjectActions from "./PersonalProjectActions";
import PersonalProjectGrid from "./PersonalProjectGrid";
import PersonalProjectToolbar from "./PersonalProjectToolbar";
import ProjectStatsModal from "../projects/ProjectStatsModal";
import FolderCreateModal from "../folders/FolderCreateModal";
import FolderView from "../folders/FolderView";
import { FOLDER_SECTIONS, getFolders } from "../../services/folderStore";
import { ContextMenu, DeleteModal, RenameModal } from "../projects/ProjectMenu";

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

  const { updateProject, folderRecords } = records;
  const [statsProject, setStatsProject] = React.useState(null);
  const [showFolderModal, setShowFolderModal] = React.useState(false);
  const [activeFolderId, setActiveFolderId] = React.useState(null);
  const [menuFolder, setMenuFolder] = React.useState(null);
  const [folderMenuPos, setFolderMenuPos] = React.useState({ x: 0, y: 0 });
  const [renameFolder, setRenameFolder] = React.useState(null);
  const [deleteFolder, setDeleteFolder] = React.useState(null);
  const folders = getFolders(database, FOLDER_SECTIONS.PERSONAL);
  const activeFolder = folders.find((folder) => folder.id === activeFolderId) || null;

  if (activeFolder) {
    const folderItems = (projects || []).filter((project) => project.folderId === activeFolder.id);
    return (
      <FolderView
        folder={activeFolder}
        items={folderItems}
        mode={mode}
        onBack={() => setActiveFolderId(null)}
        onItemMenuOpen={handleMenuOpen}
        onItemOpen={(selectedProject) => {
          selectedProject.projectType === "pdf" ? navigateToPdfViewer(selectedProject) : navigateToRowCounter(selectedProject);
        }}
      />
    );
  }

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
        folders={folders}
        handleMenuOpen={handleMenuOpen}
        onFolderOpen={(folder) => setActiveFolderId(folder.id)}
        onFolderMenuOpen={(folder, event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setFolderMenuPos({ x: rect.right, y: rect.bottom });
          setMenuFolder(folder);
        }}
        mode={mode}
        projects={projects}
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
        onCreateFolder={() => setShowFolderModal(true)}
      />
      <ProjectStatsModal project={statsProject} onClose={() => setStatsProject(null)} />
      <ContextMenu project={menuFolder} position={folderMenuPos} onClose={() => setMenuFolder(null)}
        onRename={() => { setRenameFolder(menuFolder); setMenuFolder(null); }}
        onDelete={() => { setDeleteFolder(menuFolder); setMenuFolder(null); }} />
      <RenameModal project={renameFolder} onConfirm={(name) => { folderRecords?.renameFolder(renameFolder.id, name); setRenameFolder(null); }} onClose={() => setRenameFolder(null)} />
      <DeleteModal project={deleteFolder} onConfirm={() => { folderRecords?.deleteFolder(deleteFolder.id); setDeleteFolder(null); }} onClose={() => setDeleteFolder(null)} />
      {showFolderModal && (
        <FolderCreateModal
          sectionLabel="Personnel"
          onClose={() => setShowFolderModal(false)}
          onCreate={(name) => {
            folderRecords?.createFolder({ name, section: FOLDER_SECTIONS.PERSONAL, colorIdx: Math.floor(Math.random() * 12) });
            setShowFolderModal(false);
          }}
        />
      )}
    </>
  );
}
