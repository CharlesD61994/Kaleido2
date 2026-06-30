import React, { Suspense, lazy } from "react";
import { VIEWS } from "../../constants/views";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import { computeProgress } from "../../services/progressStore";

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

function PatronEditorEdgeZone() {
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
    />
  );
}

function ClientPreviousProjectPreview({ project, style, previewView, unreadClientMessageCount = 0 }) {
  if (!project || !style) return null;

  const color = KALEIDOSCOPE_COLORS[(project.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const progress = computeProgress(project);
  const isPdf = project.projectType === "pdf";
  const noop = () => {};

  if (previewView === VIEWS.ROW_COUNTER) {
    return (
      <div
        aria-hidden="true"
        style={{
          ...style,
          background: "var(--k-bg)",
          color: "var(--k-text)",
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Suspense fallback={<WorkScreenFallback />}>
          <CompteurRangsView
            project={project}
            onNavigateHub={noop}
            onNavigateEditor={noop}
            onSaveProgress={noop}
            onOpenClientPage={noop}
            unreadClientMessageCount={unreadClientMessageCount}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        ...style,
        background: "var(--k-bg)",
        color: "var(--k-text)",
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 28px) 20px 28px", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 34 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: "var(--k-surface-2)",
              border: "1px solid var(--k-control-border)",
              color: "#A78BFA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            ‹
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.05, fontFamily: "'Syne', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {project.name || "Projet"}
            </div>
            <div style={{ color: color.light, fontSize: 13, marginTop: 4, fontFamily: "monospace" }}>
              {isPdf ? "PDF" : project.type || "patron"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ color: color.light, fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Global</div>
            <div
              style={{
                width: 98,
                height: 98,
                borderRadius: "50%",
                border: `6px solid ${color.light}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 28px ${color.bg}38`,
              }}
            >
              <div style={{ textAlign: "center", fontFamily: "monospace" }}>
                <div style={{ fontSize: 31, fontWeight: 900 }}>{Number(project.rang) || 0}</div>
                <div style={{ color: color.light, fontSize: 17, fontWeight: 800 }}>/ {Number(project.total) || 0}</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingTop: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {isPdf ? "Lecteur PDF" : "Lecteur de patron"}
              </div>
              <div style={{ color: color.light, fontFamily: "monospace", fontSize: 18, fontWeight: 900 }}>{progress}%</div>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "var(--k-muted-fill-2)", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${color.bg}, ${color.light})`, boxShadow: `0 0 18px ${color.light}55` }} />
            </div>
          </div>
        </div>

        <div style={{ borderRadius: 22, border: `1px solid ${color.light}33`, background: "var(--k-surface)", padding: 22, minHeight: 160, boxShadow: `0 16px 48px ${color.bg}20` }}>
          <div style={{ width: 120, height: 38, borderRadius: 14, background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, margin: "0 auto 20px" }} />
          <div style={{ height: 18, borderRadius: 999, background: "var(--k-muted-fill-2)", marginBottom: 12 }} />
          <div style={{ height: 18, width: "74%", borderRadius: 999, background: "var(--k-muted-fill-2)", margin: "0 auto" }} />
        </div>
      </div>
    </div>
  );
}

export default function WorkScreens({
  activeScreenInteractiveStyle,
  clientPreviousPreviewStyle,
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
  prevView,
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
      {currentView === VIEWS.CLIENT_PAGE && (
        <ClientPreviousProjectPreview
          project={currentProject}
          style={clientPreviousPreviewStyle}
          previewView={prevView}
          unreadClientMessageCount={unreadClientMessageCount}
        />
      )}

      {currentView === VIEWS.PATRON_EDITOR && (
        <PatronEditorEdgeZone />
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
                unreadClientMessageCount={unreadClientMessageCount}
              />
            </Suspense>
          </WorkScreenErrorBoundary>
        </div>
      )}
    </>
  );
}
