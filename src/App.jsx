import React, { useState, useEffect, useRef } from "react";
import { loadDatabase } from "./services/databaseStore";
import SplashScreen from "./components/splash/SplashScreen";
import AppScreens from "./components/app/AppScreens";
import { KALEIDOSCOPE_COLORS } from "./constants/colors";
import { VIEWS } from "./constants/views";
import useHomeProjects from "./hooks/useHomeProjects";
import useProjectCreation from "./hooks/useProjectCreation";
import useAppNavigation from "./hooks/useAppNavigation";
import useEdgeSwipeBack from "./hooks/useEdgeSwipeBack";
import useBrowserBackGuard from "./hooks/useBrowserBackGuard";
import useDatabasePersistence from "./hooks/useDatabasePersistence";
import usePressedFeedback from "./hooks/usePressedFeedback";
import usePhotoManagement from "./hooks/usePhotoManagement";
import useEdgeSwipePreviewStyles from "./hooks/useEdgeSwipePreviewStyles";
import useProjectRecords from "./hooks/useProjectRecords";
import usePatronRecords from "./hooks/usePatronRecords";
import ClientPortalRoute from "./ClientPortalRoute";
import { getClientPortalTokenFromLocation } from "./services/clientPortalStore";
import useKaleidoAuth from "./hooks/useKaleidoAuth";
import AuthScreen from "./components/auth/AuthScreen";
import { getThemeMode } from "./styles/theme";

function KaleidoHub({ auth }) {
  const [currentView, setCurrentView] = useState(VIEWS.HUB);
  const [prevView, setPrevView] = useState(null);
  const [viewTransition, setViewTransition] = useState('none'); // 'slide-in' | 'slide-out' | 'none'
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentPatron, setCurrentPatron] = useState(null);
  const [database, setDatabase] = useState(() => loadDatabase());
  const [mode, setMode] = useState("personal");
  const [creationMode, setCreationMode] = useState("personal");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLibraryImportModal, setShowLibraryImportModal] = useState(false);
  const [showSelectPatronModal, setShowSelectPatronModal] = useState(false);
  const [editingPdfPatron, setEditingPdfPatron] = useState(null);
  const databaseRef = useRef(database);

  usePressedFeedback();
  const { cloudReady } = useDatabasePersistence(database, databaseRef, setDatabase);
  useEffect(() => {
    if (currentProject?.id == null) return;
    const updatedProject = [
      ...(database.projectsPersonal || []),
      ...(database.projectsPro || []),
    ].find((project) => String(project.id) === String(currentProject.id));

    if (updatedProject && JSON.stringify(updatedProject) !== JSON.stringify(currentProject)) {
      setCurrentProject(updatedProject);
    }
  }, [database, currentProject]);

  useEffect(() => {
    if (currentPatron?.id == null) return;
    const updatedPatron = (database.patrons || []).find((patron) => String(patron.id) === String(currentPatron.id));

    if (updatedPatron && JSON.stringify(updatedPatron) !== JSON.stringify(currentPatron)) {
      setCurrentPatron(updatedPatron);
    }
  }, [database, currentPatron]);

  // Splash screen effect
  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1800);
    const t2 = setTimeout(() => setShowSplash(false), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

const {
  deleteProjectFromDB,
  deleteProProjectFromDB,
  projects,
  markClientMessagesRead,
  publishClientProjectRecord,
  saveProjectProgress,
  updateClientInfo,
  updateProject,
  updateProProject,
} = useProjectRecords({
  mode,
  database,
  setCurrentProject,
  setDatabase,
});
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
} = useHomeProjects({
  projects,
  updateProject,
  deleteProjectFromDB,
  setCreationMode,
  setShowNewMenu,
});
const {
  addPatron,
  deletePatronFromDB,
  updatePatron,
} = usePatronRecords({
  database,
  setDatabase,
});
const {
  navigateBackFromClientPage,
  navigateToClientPage,
  navigateToHub,
  navigateToLibrary,
  navigateToPatronEditor,
  navigateToPdfViewer,
  navigateToRowCounter,
} = useAppNavigation({
  currentProject,
  currentView,
  setCurrentProject,
  setCurrentView,
  setPrevView,
  setViewTransition,
});
useBrowserBackGuard({
  currentView,
  navigateBackFromClientPage,
  navigateToHub,
  navigateToLibrary,
});
const handleNewCustomPatron = () => {
const newId = (database.settings.lastPatronId || 0) + 1;
const colorIdx = Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length);
const newPatron = { id: newId, name: "Nouveau patron", colorIdx, image: null, projectType: "custom", type: "crochet", laine: "", outil: "", notes: "", parties: [], createdAt: new Date().toISOString() };
addPatron(newPatron);
setCurrentPatron(newPatron);
setCurrentView(VIEWS.PATRON_EDITOR);
};
const handleNewPdfPatron = () => {
setShowLibraryImportModal(true);
};
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
  openClientEditor,
  queueProjectCreation,
  setClientEmail,
  setClientEmailError,
  setClientError,
  setClientName,
  showClientModal,
} = useProjectCreation({
  creationMode,
  database,
  databaseRef,
  mode,
  setDatabase,
  updateClientInfo,
  navigateToPatronEditor,
});
const {
  persistPatronImageToIndexedDB,
  persistProjectImageToIndexedDB,
  photoTarget,
  setPhotoTarget,
} = usePhotoManagement({
  updatePatron,
  updateProject,
  updateProProject,
});
const updateSettings = (updates) => {
  setDatabase((current) => ({
    ...current,
    settings: {
      ...(current.settings || {}),
      ...(typeof updates === "function" ? updates(current.settings || {}) : updates),
    },
  }));
};
const {
  edgeSwipeActive,
  edgeSwipeDragging,
  edgeSwipeHandlersRef,
  edgeSwipeProgress,
} = useEdgeSwipeBack({
  currentView,
  navigateToHub,
  navigateToLibrary,
});
// ─── VUE PATRON EDITOR ────────────────────────────────────
// ─── RENDU CONDITIONNEL ───────────────────────────────────
// ── Splash Screen ──────────────────────────────────────────────
if (showSplash || !cloudReady) {
return <SplashScreen fading={splashFading} themeMode={getThemeMode(database)} />;
}

const {
  activeScreenInteractiveStyle,
  inactivePreviewContentStyle,
  keepHubMounted,
  keepLibraryMountedForPreview,
  previewBackdropStyle,
  previewHubStyle,
  previewLibraryStyle,
} = useEdgeSwipePreviewStyles({
  currentView,
  edgeSwipeActive,
  edgeSwipeDragging,
  edgeSwipeProgress,
});

return (
<AppScreens
  state={{
    currentPatron,
    currentProject,
    currentView,
    database,
    mode,
    projects,
    themeMode: getThemeMode(database),
    viewTransition,
  }}
  setters={{
    setCurrentPatron,
    setCurrentProject,
    setCurrentView,
    setDatabase,
    setMode,
    updateSettings,
  }}
  navigation={{
    navigateBackFromClientPage,
    navigateToClientPage,
    navigateToHub,
    navigateToLibrary,
    navigateToPatronEditor,
    navigateToPdfViewer,
    navigateToRowCounter,
  }}
  home={{
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
  }}
  creation={{
    cancelClientProjectCreation,
    clientEmail,
    clientEmailError,
    clientError,
    clientModalMode,
    clientName,
    clientNameInputRef,
    confirmClientProjectCreation,
    createProjectFromPatron,
    openClientEditor,
    queueProjectCreation,
    setClientEmail,
    setClientEmailError,
    setClientError,
    setClientName,
    showClientModal,
  }}
  records={{
    addPatron,
    deletePatronFromDB,
    deleteProjectFromDB,
    deleteProProjectFromDB,
    markClientMessagesRead,
    publishClientProjectRecord,
    saveProjectProgress,
    updatePatron,
    updateProject,
    updateProProject,
  }}
  photo={{
    persistPatronImageToIndexedDB,
    persistProjectImageToIndexedDB,
    photoTarget,
    setPhotoTarget,
  }}
  modals={{
    editingPdfPatron,
    setCreationMode,
    setEditingPdfPatron,
    setShowImportModal,
    setShowLibraryImportModal,
    setShowNewMenu,
    setShowSelectPatronModal,
    setShowSettingsModal,
    showImportModal,
    showLibraryImportModal,
    showNewMenu,
    showSelectPatronModal,
    showSettingsModal,
  }}
  preview={{
    activeScreenInteractiveStyle,
    inactivePreviewContentStyle,
    keepHubMounted,
    keepLibraryMountedForPreview,
    previewBackdropStyle,
    previewHubStyle,
    previewLibraryStyle,
  }}
  edgeSwipe={{ edgeSwipeHandlersRef }}
  auth={auth}
  libraryActions={{ handleNewCustomPatron, handleNewPdfPatron }}
/>
);
}

export default function App() {
  const auth = useKaleidoAuth();
  const clientPortalToken = getClientPortalTokenFromLocation();

  if (clientPortalToken) {
    return <ClientPortalRoute token={clientPortalToken} />;
  }

  if (auth.loading) {
    return <SplashScreen fading={false} themeMode={getThemeMode(loadDatabase())} />;
  }

  if (!auth.user) {
    return <AuthScreen disabled={!auth.enabled} />;
  }

  return <KaleidoHub auth={auth} />;
}
