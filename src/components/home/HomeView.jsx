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
    cancelClientProjectCreation,
    clientEmail,
    clientEmailError,
    clientError,
    clientModalMode,
    clientName,
    clientNameInputRef,
    confirmClientProjectCreation,
    createProjectFromPatron,
    queueProjectCreation,
    setClientEmail,
    setClientEmailError,
    setClientError,
    setClientName,
    showClientModal,
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
  } = setters;

  return (
    <div
      data-kaleido-screen="true"
      style={{
        background: "#0D0D1A",
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
        showSettingsModal={showSettingsModal}
      />
      <ProjectCreationDialogs
        cancelClientProjectCreation={cancelClientProjectCreation}
        clientEmail={clientEmail}
        clientEmailError={clientEmailError}
        clientError={clientError}
        clientModalMode={clientModalMode}
        clientName={clientName}
        clientNameInputRef={clientNameInputRef}
        confirmClientProjectCreation={confirmClientProjectCreation}
        createProjectFromPatron={createProjectFromPatron}
        database={database}
        navigateToLibrary={navigateToLibrary}
        queueProjectCreation={queueProjectCreation}
        setClientEmail={setClientEmail}
        setClientEmailError={setClientEmailError}
        setClientError={setClientError}
        setClientName={setClientName}
        setShowImportModal={setShowImportModal}
        setShowNewMenu={setShowNewMenu}
        setShowSelectPatronModal={setShowSelectPatronModal}
        showClientModal={showClientModal}
        showImportModal={showImportModal}
        showNewMenu={showNewMenu}
        showSelectPatronModal={showSelectPatronModal}
      />
    </div>
  );
}
