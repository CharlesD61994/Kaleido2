import { useCallback } from "react";
import { VIEWS } from "../constants/views";
import { loadPdf } from "../services/mediaStore";

export default function useAppNavigation({
  currentProject,
  currentView,
  setCurrentProject,
  setCurrentView,
  setPrevView,
  setViewTransition,
}) {
  const resetTransitionSoon = useCallback(() => {
    setTimeout(() => setViewTransition("none"), 260);
  }, [setViewTransition]);

  const navigateToHub = useCallback(() => {
    setPrevView(currentView);
    setViewTransition("slide-out");
    setTimeout(() => {
      setCurrentView(VIEWS.HUB);
      setCurrentProject(null);
      setViewTransition("slide-in");
      resetTransitionSoon();
    }, 0);
  }, [currentView, resetTransitionSoon, setCurrentProject, setCurrentView, setPrevView, setViewTransition]);

  const navigateToLibrary = useCallback(() => {
    setPrevView(currentView);
    setViewTransition("slide-in-right");
    resetTransitionSoon();
    setCurrentView(VIEWS.LIBRARY);
  }, [currentView, resetTransitionSoon, setCurrentView, setPrevView, setViewTransition]);

  const navigateToPatronEditor = useCallback((project) => {
    if (!project) {
      console.warn("[KALEIDO] navigateToPatronEditor ignoré: projet manquant.");
      return;
    }

    setPrevView(currentView);
    setViewTransition("slide-in-right");
    resetTransitionSoon();
    setCurrentProject(project);
    setCurrentView(VIEWS.PATRON_EDITOR);
  }, [currentView, resetTransitionSoon, setCurrentProject, setCurrentView, setPrevView, setViewTransition]);

  const navigateToRowCounter = useCallback((project) => {
    if (!project) {
      console.warn("[KALEIDO] navigateToRowCounter ignoré: projet manquant.");
      return;
    }

    setPrevView(currentView);
    setViewTransition("slide-in-right");
    resetTransitionSoon();
    setCurrentProject(project);
    setCurrentView(VIEWS.ROW_COUNTER);
  }, [currentView, resetTransitionSoon, setCurrentProject, setCurrentView, setPrevView, setViewTransition]);

  const navigateToPdfViewer = useCallback(async (project) => {
    if (!project) {
      console.warn("[KALEIDO] navigateToPdfViewer ignoré: projet manquant.");
      return;
    }

    if (!project.pdfId) {
      alert("Ce PDF est introuvable pour ce projet.");
      return;
    }

    const data = await loadPdf(project.pdfId);
    if (!data) {
      alert("Impossible d'ouvrir ce PDF. Le fichier semble manquant ou corrompu.");
      return;
    }

    setPrevView(currentView);
    setCurrentProject(project);
    setCurrentView(VIEWS.PDF_VIEWER);
  }, [currentView, setCurrentProject, setCurrentView, setPrevView]);

  const navigateToClientPage = useCallback((project = currentProject) => {
    if (!project) return;
    setCurrentProject(project);
    setCurrentView(VIEWS.CLIENT_PAGE);
  }, [currentProject, setCurrentProject, setCurrentView]);

  const navigateBackFromClientPage = useCallback(() => {
    if (currentProject?.projectType === "pdf") {
      setCurrentView(VIEWS.PDF_VIEWER);
    } else {
      setCurrentView(VIEWS.ROW_COUNTER);
    }
  }, [currentProject, setCurrentView]);

  return {
    navigateBackFromClientPage,
    navigateToClientPage,
    navigateToHub,
    navigateToLibrary,
    navigateToPatronEditor,
    navigateToPdfViewer,
    navigateToRowCounter,
  };
}
