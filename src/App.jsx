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
import useFolderRecords from "./hooks/useFolderRecords";
import ClientPortalRoute from "./ClientPortalRoute";
import { getClientPortalTokenFromLocation } from "./services/clientPortalStore";
import useKaleidoAuth from "./hooks/useKaleidoAuth";
import AuthScreen from "./components/auth/AuthScreen";
import { getThemeMode } from "./styles/theme";

const APP_RESUME_KEY = "kaleido_resume_state";
const APP_WARM_START_KEY = "kaleido_warm_start_seen";

const canUseLocalStorage = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
};

const readJSONStorage = (key) => {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJSONStorage = (key, value) => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // La reprise d'ecran est un confort; la sauvegarde des donnees reste separee.
  }
};

const hasWarmStart = () => {
  if (!canUseLocalStorage()) return false;
  return localStorage.getItem(APP_WARM_START_KEY) === "1";
};

const markWarmStart = () => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(APP_WARM_START_KEY, "1");
  } catch {
    // Rien a faire.
  }
};

const findProjectById = (database, projectId) => {
  if (projectId == null) return null;
  return [
    ...(database?.projectsPersonal || []),
    ...(database?.projectsPro || []),
  ].find((project) => String(project.id) === String(projectId)) || null;
};

function KaleidoHub({ auth }) {
  const [currentView, setCurrentView] = useState(VIEWS.HUB);
  const [prevView, setPrevView] = useState(null);
  const [viewTransition, setViewTransition] = useState('none'); // 'slide-in' | 'slide-out' | 'none'
  const [showSplash, setShowSplash] = useState(() => !hasWarmStart());
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
  const [activeLibraryFolderId, setActiveLibraryFolderId] = useState(null);
  const databaseRef = useRef(database);
  const didRestoreResumeStateRef = useRef(false);
  const skipInitialResumeWriteRef = useRef(true);

  usePressedFeedback();
  useDatabasePersistence(database, databaseRef, setDatabase);

  useEffect(() => {
    if (didRestoreResumeStateRef.current) return;
    didRestoreResumeStateRef.current = true;

    const resume = readJSONStorage(APP_RESUME_KEY);
    if (!resume || typeof resume !== "object") return;

    if (resume.mode === "personal" || resume.mode === "pro") {
      setMode(resume.mode);
    }

    if (resume.view === VIEWS.LIBRARY) {
      setCurrentView(VIEWS.LIBRARY);
      return;
    }

    if (resume.view === VIEWS.ROW_COUNTER || resume.view === VIEWS.PDF_VIEWER || resume.view === VIEWS.CLIENT_PAGE) {
      const project = findProjectById(database, resume.projectId);
      if (!project) return;
      setCurrentProject(project);
      setPrevView(resume.prevView || VIEWS.HUB);
      setCurrentView(resume.view);
      return;
    }

    if (resume.view === VIEWS.PATRON_EDITOR) {
      const patron = (database.patrons || []).find((item) => String(item.id) === String(resume.patronId));
      if (patron) {
        setCurrentPatron(patron);
        setPrevView(VIEWS.LIBRARY);
        setCurrentView(VIEWS.PATRON_EDITOR);
        return;
      }

      const project = findProjectById(database, resume.projectId);
      if (project) {
        setCurrentProject(project);
        setPrevView(VIEWS.HUB);
        setCurrentView(VIEWS.PATRON_EDITOR);
      }
    }
  }, [database]);

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

  useEffect(() => {
    if (skipInitialResumeWriteRef.current) {
      skipInitialResumeWriteRef.current = false;
      return;
    }

    const resumableViews = new Set([
      VIEWS.HUB,
      VIEWS.LIBRARY,
      VIEWS.PATRON_EDITOR,
      VIEWS.ROW_COUNTER,
      VIEWS.PDF_VIEWER,
      VIEWS.CLIENT_PAGE,
    ]);

    if (!resumableViews.has(currentView)) return;

    writeJSONStorage(APP_RESUME_KEY, {
      view: currentView,
      prevView,
      mode,
      projectId: currentProject?.id ?? null,
      patronId: currentPatron?.id ?? null,
      savedAt: new Date().toISOString(),
    });
  }, [currentPatron?.id, currentProject?.id, currentView, mode, prevView]);

  // Splash screen effect
  useEffect(() => {
    markWarmStart();
    const t1 = setTimeout(() => setSplashFading(true), 500);
    const t2 = setTimeout(() => setShowSplash(false), 760);
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
const folderRecords = useFolderRecords({
  setDatabase,
});
const {
  navigateBackFromClientPage,
  navigateToClientPage,
  navigateToHub,
  navigateToLibrary,
  navigateToPatronEditor,
  navigateToPdfPatronEdit,
  navigateToPdfPatronImport,
  navigateToPdfViewer,
  navigateToRowCounter,
} = useAppNavigation({
  currentProject,
  currentView,
  prevView,
  setActiveLibraryFolderId,
  setCurrentProject,
  setCurrentView,
  setPrevView,
  setViewTransition,
});
useBrowserBackGuard({
  activeLibraryFolderId,
  currentView,
  navigateBackFromClientPage,
  navigateToHub,
  navigateToLibrary,
  setActiveLibraryFolderId,
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
navigateToPdfPatronImport();
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
  activeLibraryFolderId,
  currentView,
  navigateBackFromClientPage,
  navigateToHub,
  navigateToLibrary,
  setActiveLibraryFolderId,
});
const {
  activeScreenInteractiveStyle,
  clientPreviousPreviewStyle,
  inactivePreviewContentStyle,
  keepHubMounted,
  keepLibraryMountedForPreview,
  previewBackdropStyle,
  previewHubStyle,
  previewLibraryFolderId,
  previewLibraryStyle,
} = useEdgeSwipePreviewStyles({
  activeLibraryFolderId,
  currentView,
  edgeSwipeActive,
  edgeSwipeDragging,
  edgeSwipeProgress,
  prevView,
});
// ─── VUE PATRON EDITOR ────────────────────────────────────
// ─── RENDU CONDITIONNEL ───────────────────────────────────
// ── Splash Screen ──────────────────────────────────────────────
if (showSplash) {
return <SplashScreen fading={splashFading} themeMode={getThemeMode(database)} />;
}

return (
<AppScreens
  state={{
    currentPatron,
    currentProject,
    currentView,
    activeLibraryFolderId,
    database,
    mode,
    projects,
    themeMode: getThemeMode(database),
    viewTransition,
  }}
  setters={{
    setCurrentPatron,
    setCurrentProject,
    setActiveLibraryFolderId,
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
    navigateToPdfPatronEdit,
    navigateToPdfPatronImport,
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
    folderRecords,
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
    clientPreviousPreviewStyle,
    inactivePreviewContentStyle,
    keepHubMounted,
    keepLibraryMountedForPreview,
    previewBackdropStyle,
    previewHubStyle,
    previewLibraryFolderId,
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
