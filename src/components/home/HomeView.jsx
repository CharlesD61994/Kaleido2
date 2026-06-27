import React from "react";
import HomeHeader from "./HomeHeader";
import HomeSettingsDialogs from "./HomeSettingsDialogs";
import PersonalHomeContent from "./PersonalHomeContent";
import ProHomeContent from "./ProHomeContent";
import ProjectCreationDialogs from "./ProjectCreationDialogs";
import { GLOBAL_MOTION_CSS } from "../../styles/motion";
import useClientMessageNotifications from "../../hooks/useClientMessageNotifications";

export default function HomeView({
  auth,
  creation,
  database,
  home,
  mode,
  modals,
  navigation,
  photo,
  projects,
  records,
  setters,
}) {
  const {
    createProjectFromPatron,
    queueProjectCreation,
  } = creation;

  const {
    setShowImportModal,
    setShowNewMenu,
    setShowSelectPatronModal,
    setShowSettingsModal,
    showImportModal,
    showNewMenu,
    showSelectPatronModal,
    showSettingsModal,
  } = modals;

  const { navigateToLibrary } = navigation;
  const unreadProjectIds = useClientMessageNotifications(database.projectsPro || []);

  const {
    setCurrentPatron,
    setCurrentProject,
    setCurrentView,
    setDatabase,
    setMode,
    updateSettings,
  } = setters;

  return (
    <div
      data-kaleido-screen="true"
      style={{
        background: "var(--k-bg)",
        color: "var(--k-text)",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap'); ${GLOBAL_MOTION_CSS} @keyframes fadeIn { from { opacity:1; transform:none; } to { opacity:1; transform:none; } } ::-webkit-scrollbar { width: 0; } * { -webkit-tap-highlight-color: transparent; } input, textarea, select { font-size: 16px !important; }`}</style>
      <HomeHeader
        mode={mode}
        setMode={setMode}
        navigateToLibrary={navigateToLibrary}
        setShowSettingsModal={setShowSettingsModal}
      />
      {mode === "pro" ? (
        <ProHomeContent
          creation={creation}
          database={database}
          modals={modals}
          navigation={navigation}
          photo={photo}
          records={records}
          unreadProjectIds={unreadProjectIds}
        />
      ) : (
        <PersonalHomeContent
          database={database}
          home={home}
          mode={mode}
          navigation={navigation}
          photo={photo}
          projects={projects}
          records={records}
        />
      )}
      <HomeSettingsDialogs
        auth={auth}
        database={database}
        setCurrentPatron={setCurrentPatron}
        setCurrentProject={setCurrentProject}
        setCurrentView={setCurrentView}
        setDatabase={setDatabase}
        setShowSettingsModal={setShowSettingsModal}
        updateSettings={updateSettings}
        showSettingsModal={showSettingsModal}
      />
      <ProjectCreationDialogs
        createProjectFromPatron={createProjectFromPatron}
        database={database}
        navigateToLibrary={navigateToLibrary}
        queueProjectCreation={queueProjectCreation}
        setShowImportModal={setShowImportModal}
        setShowNewMenu={setShowNewMenu}
        setShowSelectPatronModal={setShowSelectPatronModal}
        showImportModal={showImportModal}
        showNewMenu={showNewMenu}
        showSelectPatronModal={showSelectPatronModal}
      />
    </div>
  );
}
