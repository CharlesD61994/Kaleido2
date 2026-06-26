import React from "react";
import HomeScreen from "./HomeScreen";
import LibraryScreen, { LibraryPreview } from "./LibraryScreen";
import WorkScreens from "./WorkScreens";
import { VIEWS } from "../../constants/views";
import { GLOBAL_MOTION_CSS, getViewMotionStyle } from "../../styles/motion";
import useClientMessageNotifications from "../../hooks/useClientMessageNotifications";

export default function AppScreens({
  auth,
  creation,
  edgeSwipe,
  home,
  libraryActions,
  modals,
  navigation,
  photo,
  preview,
  records,
  setters,
  state,
}) {
  const {
    currentPatron,
    currentProject,
    currentView,
    database,
    mode,
    projects,
    viewTransition,
  } = state;

  const {
    setCurrentPatron,
    setCurrentView,
  } = setters;

  const {
    navigateBackFromClientPage,
    navigateToClientPage,
    navigateToHub,
    navigateToLibrary,
    navigateToPatronEditor,
    navigateToPdfViewer,
    navigateToRowCounter,
  } = navigation;

  const {
    openClientEditor,
  } = creation;

  const {
    addPatron,
    deletePatronFromDB,
    markClientMessagesRead,
    publishClientProjectRecord,
    saveProjectProgress,
    updatePatron,
    updateProject,
  } = records;

  const {
    persistPatronImageToIndexedDB,
    photoTarget,
    setPhotoTarget,
  } = photo;

  const {
    editingPdfPatron,
    setEditingPdfPatron,
    setShowLibraryImportModal,
    showLibraryImportModal,
  } = modals;

  const {
    activeScreenInteractiveStyle,
    inactivePreviewContentStyle,
    keepHubMounted,
    keepLibraryMountedForPreview,
    previewBackdropStyle,
    previewHubStyle,
    previewLibraryStyle,
  } = preview;

  const { edgeSwipeHandlersRef } = edgeSwipe;
  const { handleNewCustomPatron, handleNewPdfPatron } = libraryActions;
  const unreadProjectIds = useClientMessageNotifications(database.projectsPro || []);

  const viewWrapStyle = (trans) => getViewMotionStyle(trans);

  return (
    <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), position: "relative", minHeight: "100vh", background: "#0D0D1A", overflowX: "hidden" }}>
      <style>{GLOBAL_MOTION_CSS}</style>

      <HomeScreen
        creation={creation}
        auth={auth}
        currentView={currentView}
        database={database}
        home={home}
        keepHubMounted={keepHubMounted}
        mode={mode}
        modals={modals}
        navigation={navigation}
        photo={photo}
        previewHubStyle={previewHubStyle}
        projects={projects}
        records={records}
        setters={setters}
      />

      {keepLibraryMountedForPreview && (
        <LibraryPreview
          database={database}
          deletePatronFromDB={deletePatronFromDB}
          handleNewCustomPatron={handleNewCustomPatron}
          handleNewPdfPatron={handleNewPdfPatron}
          inactivePreviewContentStyle={inactivePreviewContentStyle}
          navigateToHub={navigateToHub}
          previewLibraryStyle={previewLibraryStyle}
          setCurrentPatron={setCurrentPatron}
          setCurrentView={setCurrentView}
          setPhotoTarget={setPhotoTarget}
          updatePatron={updatePatron}
        />
      )}

      {previewBackdropStyle && <div style={previewBackdropStyle} aria-hidden="true" />}

      {currentView === VIEWS.LIBRARY && (
        <LibraryScreen
          activeScreenInteractiveStyle={activeScreenInteractiveStyle}
          addPatron={addPatron}
          database={database}
          deletePatronFromDB={deletePatronFromDB}
          editingPdfPatron={editingPdfPatron}
          handleNewCustomPatron={handleNewCustomPatron}
          handleNewPdfPatron={handleNewPdfPatron}
          navigateToHub={navigateToHub}
          persistPatronImageToIndexedDB={persistPatronImageToIndexedDB}
          photoTarget={photoTarget}
          setCurrentPatron={setCurrentPatron}
          setCurrentView={setCurrentView}
          setEditingPdfPatron={setEditingPdfPatron}
          setPhotoTarget={setPhotoTarget}
          setShowLibraryImportModal={setShowLibraryImportModal}
          showLibraryImportModal={showLibraryImportModal}
          updatePatron={updatePatron}
          viewWrapStyle={viewWrapStyle}
          viewTransition={viewTransition}
        />
      )}

      <WorkScreens
        activeScreenInteractiveStyle={activeScreenInteractiveStyle}
        currentPatron={currentPatron}
        currentProject={currentProject}
        currentView={currentView}
        edgeSwipeHandlersRef={edgeSwipeHandlersRef}
        navigateBackFromClientPage={navigateBackFromClientPage}
        navigateToClientPage={navigateToClientPage}
        navigateToHub={navigateToHub}
        navigateToLibrary={navigateToLibrary}
        navigateToPatronEditor={navigateToPatronEditor}
        openClientEditor={openClientEditor}
        markClientMessagesRead={markClientMessagesRead}
        publishClientProjectRecord={publishClientProjectRecord}
        saveProjectProgress={saveProjectProgress}
        unreadProjectIds={unreadProjectIds}
        updatePatron={updatePatron}
        updateProject={updateProject}
        viewWrapStyle={viewWrapStyle}
        viewTransition={viewTransition}
      />
    </div>
  );
}
