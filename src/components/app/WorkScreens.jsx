import React, { Suspense, lazy } from "react";
import { VIEWS } from "../../constants/views";

const ClientPage = lazy(() => import("../../ClientPage"));
const CompteurRangsView = lazy(() => import("../counters/CompteurRangsView"));
const PatronEditorView = lazy(() => import("../pattern/PatronEditorView"));
const PdfViewerView = lazy(() => import("../pdf/PdfViews"));

function WorkScreenFallback({ label = "Ouverture du projet..." }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "3px solid rgba(167,139,250,0.22)",
            borderTopColor: "#A78BFA",
            margin: "0 auto 14px",
            animation: "kaleidoSpin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 14, fontWeight: 800 }}>{label}</div>
        <style>{`@keyframes kaleidoSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

class WorkScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error) {
    console.error("[KALEIDO] Ecran de travail indisponible", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--k-bg)",
          color: "var(--k-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Le projet n'a pas pu s'ouvrir.</div>
          <div style={{ color: "#A8A6B8", fontSize: 13, lineHeight: 1.4, marginBottom: 18 }}>
            Reviens au menu, puis ouvre le projet de nouveau.
          </div>
          <button
            type="button"
            onClick={this.props.onBack}
            style={{
              border: "1px solid rgba(167,139,250,0.34)",
              borderRadius: 14,
              background: "linear-gradient(135deg, #7C3AED, #EC4899)",
              color: "#fff",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Retour au menu
          </button>
        </div>
      </div>
    );
  }
}

function PatronEditorEdgeZone({ edgeSwipeHandlersRef }) {
  return (
    <div
      aria-hidden="true"
      data-kaleido-no-edge-back="true"
      data-kaleido-edge-zone="true"
      style={{
        position: "fixed",
        left: 0,
        top: 76,
        bottom: 0,
        width: 28,
        zIndex: 9999,
        touchAction: "none",
        background: "transparent",
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
        edgeSwipeHandlersRef.current.start?.(event);
      }}
      onTouchMove={(event) => {
        event.stopPropagation();
        edgeSwipeHandlersRef.current.move?.(event);
      }}
      onTouchEnd={(event) => {
        event.stopPropagation();
        edgeSwipeHandlersRef.current.end?.(event);
      }}
      onTouchCancel={(event) => {
        event.stopPropagation();
        edgeSwipeHandlersRef.current.end?.(event);
      }}
    />
  );
}

export default function WorkScreens({
  activeScreenInteractiveStyle,
  currentPatron,
  currentProject,
  currentView,
  edgeSwipeHandlersRef,
  navigateBackFromClientPage,
  navigateToClientPage,
  navigateToHub,
  navigateToLibrary,
  navigateToPatronEditor,
  openClientEditor,
  markClientMessagesRead,
  publishClientProjectRecord,
  saveProjectProgress,
  unreadProjectIds,
  updatePatron,
  updateProject,
  viewWrapStyle,
  viewTransition,
}) {
  const unreadClientMessageCount = currentProject?.id != null
    ? (unreadProjectIds?.get?.(String(currentProject.id)) || 0)
    : 0;

  return (
    <>
      {currentView === VIEWS.PATRON_EDITOR && (
        <PatronEditorEdgeZone edgeSwipeHandlersRef={edgeSwipeHandlersRef} />
      )}

      {currentView === VIEWS.PATRON_EDITOR && (
        <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), ...activeScreenInteractiveStyle }}>
          <WorkScreenErrorBoundary onBack={navigateToHub} resetKey={`${currentView}-${currentPatron?.id || currentProject?.id || "new"}`}>
            <Suspense fallback={<WorkScreenFallback label="Ouverture de l'editeur..." />}>
              <PatronEditorView
                key={`${currentPatron ? "patron" : "project"}-${(currentPatron || currentProject)?.id ?? "new"}`}
                currentPatron={currentPatron}
                currentProject={currentProject}
                updatePatron={updatePatron}
                updateProject={updateProject}
                navigateToLibrary={navigateToLibrary}
                navigateToHub={navigateToHub}
              />
            </Suspense>
          </WorkScreenErrorBoundary>
        </div>
      )}

      {currentView === VIEWS.ROW_COUNTER && (
        <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), ...activeScreenInteractiveStyle }}>
          <WorkScreenErrorBoundary onBack={navigateToHub} resetKey={`${currentView}-${currentProject?.id || "new"}`}>
            <Suspense fallback={<WorkScreenFallback />}>
              <CompteurRangsView
                project={currentProject}
                onNavigateHub={navigateToHub}
                onNavigateEditor={navigateToPatronEditor}
                onSaveProgress={(rang, total, elapsed, extra = {}) => saveProjectProgress(currentProject.id, { rang, total, elapsedTime: elapsed, ...extra })}
                onOpenClientPage={() => navigateToClientPage(currentProject)}
                unreadClientMessageCount={unreadClientMessageCount}
              />
            </Suspense>
          </WorkScreenErrorBoundary>
        </div>
      )}

      {currentView === VIEWS.PDF_VIEWER && (
        <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), ...activeScreenInteractiveStyle }}>
          <WorkScreenErrorBoundary onBack={navigateToHub} resetKey={`${currentView}-${currentProject?.id || "new"}`}>
            <Suspense fallback={<WorkScreenFallback label="Ouverture du PDF..." />}>
              <PdfViewerView
                project={currentProject}
                onNavigateHub={navigateToHub}
                onSaveProgress={(rang, total, elapsed, extra = {}) => saveProjectProgress(currentProject.id, { rang, total, elapsedTime: elapsed, ...extra })}
                onOpenClientPage={() => navigateToClientPage(currentProject)}
                unreadClientMessageCount={unreadClientMessageCount}
              />
            </Suspense>
          </WorkScreenErrorBoundary>
        </div>
      )}

      {currentView === VIEWS.CLIENT_PAGE && (
        <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), ...activeScreenInteractiveStyle }}>
          <WorkScreenErrorBoundary onBack={navigateToHub} resetKey={`${currentView}-${currentProject?.id || "new"}`}>
            <Suspense fallback={<WorkScreenFallback label="Ouverture de la fiche client..." />}>
              <ClientPage
                project={currentProject}
                onBack={navigateBackFromClientPage}
                onEditClient={openClientEditor}
                onMarkMessagesRead={markClientMessagesRead}
                onPublishClientProject={publishClientProjectRecord}
              />
            </Suspense>
          </WorkScreenErrorBoundary>
        </div>
      )}
    </>
  );
}
