import { VIEWS } from "../constants/views";

export default function useEdgeSwipePreviewStyles({
  currentView,
  edgeSwipeActive,
  edgeSwipeDragging,
  edgeSwipeProgress,
}) {
  const interactiveBackPreview = edgeSwipeActive && currentView !== VIEWS.HUB;
  const previewUsesLibrary = interactiveBackPreview && currentView === VIEWS.PATRON_EDITOR;
  const previewUsesHub = interactiveBackPreview && currentView !== VIEWS.PATRON_EDITOR;

  const activeScreenInteractiveStyle = interactiveBackPreview ? {
    transform: `translate3d(${(edgeSwipeProgress * 100).toFixed(3)}vw, 0, 0)`,
    transition: edgeSwipeDragging ? "none" : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease, filter 240ms ease",
    willChange: "transform, box-shadow, filter",
    position: "relative",
    zIndex: 2,
    boxShadow: `-30px 0 60px rgba(0,0,0,${(0.20 + edgeSwipeProgress * 0.22).toFixed(3)}), 0 0 0 1px rgba(255,255,255,${(0.02 + edgeSwipeProgress * 0.05).toFixed(3)})`,
    filter: `brightness(${(1 - edgeSwipeProgress * 0.02).toFixed(3)}) saturate(${(1 + edgeSwipeProgress * 0.04).toFixed(3)})`,
  } : {};

  const previewHubStyle = previewUsesHub ? {
    display: "block",
    position: "absolute",
    inset: 0,
    minHeight: "100vh",
    zIndex: 0,
    transform: `translate3d(${(-26 + edgeSwipeProgress * 26).toFixed(2)}px, 0, 0) scale(${(0.95 + edgeSwipeProgress * 0.05).toFixed(4)})`,
    transformOrigin: "left center",
    opacity: Math.min(1, 0.78 + edgeSwipeProgress * 0.22),
    filter: `brightness(${(0.80 + edgeSwipeProgress * 0.20).toFixed(3)}) saturate(${(0.90 + edgeSwipeProgress * 0.10).toFixed(3)}) blur(${(8 - edgeSwipeProgress * 8).toFixed(2)}px)`,
    transition: edgeSwipeDragging ? "none" : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, filter 240ms ease",
    pointerEvents: "none",
  } : {
    display: currentView === VIEWS.HUB ? "block" : "none",
    minHeight: "100vh",
    position: currentView === VIEWS.HUB ? "relative" : "absolute",
    inset: 0,
    zIndex: 0,
  };

  const previewLibraryStyle = previewUsesLibrary ? {
    display: "block",
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    height: "100vh",
    minHeight: "100vh",
    zIndex: 0,
    overflow: "hidden",
    transform: "translate3d(0, 0, 0)",
    transformOrigin: "left top",
    opacity: 1,
    transition: "none",
    pointerEvents: "none",
  } : {
    display: "none",
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    height: "100vh",
    minHeight: "100vh",
    zIndex: 0,
  };

  const inactivePreviewContentStyle = {
    position: "absolute",
    inset: 0,
    minHeight: "100vh",
    transform: `translate3d(${(-26 + edgeSwipeProgress * 26).toFixed(2)}px, 0, 0) scale(${(0.95 + edgeSwipeProgress * 0.05).toFixed(4)})`,
    transformOrigin: "left top",
    opacity: Math.min(1, 0.78 + edgeSwipeProgress * 0.22),
    filter: `brightness(${(0.80 + edgeSwipeProgress * 0.20).toFixed(3)}) saturate(${(0.90 + edgeSwipeProgress * 0.10).toFixed(3)}) blur(${(8 - edgeSwipeProgress * 8).toFixed(2)}px)`,
    transition: edgeSwipeDragging ? "none" : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, filter 240ms ease",
    willChange: "transform, opacity, filter",
  };

  const previewBackdropStyle = interactiveBackPreview ? {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
    background: `linear-gradient(90deg, rgba(13,13,26,${(0.18 + edgeSwipeProgress * 0.10).toFixed(3)}) 0%, rgba(13,13,26,${(0.04 + edgeSwipeProgress * 0.06).toFixed(3)}) 38%, rgba(13,13,26,0) 74%)`,
    opacity: Math.min(1, 0.55 + edgeSwipeProgress * 0.35),
    transition: edgeSwipeDragging ? "none" : "opacity 240ms ease, background 240ms ease",
  } : null;

  return {
    activeScreenInteractiveStyle,
    inactivePreviewContentStyle,
    keepHubMounted: currentView === VIEWS.HUB || currentView === VIEWS.PDF_VIEWER || previewUsesHub,
    keepLibraryMountedForPreview: previewUsesLibrary,
    previewBackdropStyle,
    previewHubStyle,
    previewLibraryStyle,
  };
}
