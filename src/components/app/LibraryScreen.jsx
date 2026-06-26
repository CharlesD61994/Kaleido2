import React from "react";
import PhotoCropModal from "../modals/PhotoCropModal";
import LibraryView, { EditPdfPatronModal } from "../pattern/LibraryView";
import { ImportPdfModal } from "../pdf/PdfViews";
import { VIEWS } from "../../constants/views";
import useLibraryPdfImport from "../../hooks/useLibraryPdfImport";

export function LibraryPreview({
  database,
  deletePatronFromDB,
  handleNewCustomPatron,
  handleNewPdfPatron,
  inactivePreviewContentStyle,
  navigateToHub,
  previewLibraryStyle,
  setCurrentPatron,
  setCurrentView,
  setPhotoTarget,
  updatePatron,
}) {
  return (
    <div style={previewLibraryStyle} aria-hidden="true">
      <div style={inactivePreviewContentStyle}>
        <LibraryView
          database={database}
          onNavigateHub={navigateToHub}
          onEditPatron={(patron) => { setCurrentPatron(patron); setCurrentView(VIEWS.PATRON_EDITOR); }}
          onNewCustomPatron={handleNewCustomPatron}
          onNewPdfPatron={handleNewPdfPatron}
          onDeletePatron={(id) => { deletePatronFromDB(id); }}
          onRenamePatron={(id, name) => updatePatron(id, { name })}
          onChangePatronColor={(id, idx) => updatePatron(id, { colorIdx: idx })}
          onChangePatronPhoto={(id) => setPhotoTarget({ id, context: "patron" })}
          setEditingPdfPatron={() => {}}
        />
      </div>
    </div>
  );
}

export default function LibraryScreen({
  activeScreenInteractiveStyle,
  addPatron,
  database,
  deletePatronFromDB,
  editingPdfPatron,
  handleNewCustomPatron,
  handleNewPdfPatron,
  navigateToHub,
  persistPatronImageToIndexedDB,
  photoTarget,
  setCurrentPatron,
  setCurrentView,
  setEditingPdfPatron,
  setPhotoTarget,
  setShowLibraryImportModal,
  showLibraryImportModal,
  updatePatron,
  viewWrapStyle,
  viewTransition,
}) {
  const { handleCreatePdfPatron } = useLibraryPdfImport({
    addPatron,
    database,
    setShowLibraryImportModal,
  });

  return (
    <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), ...activeScreenInteractiveStyle }}>
      <LibraryView
        database={database}
        onNavigateHub={navigateToHub}
        onEditPatron={(patron) => { setCurrentPatron(patron); setCurrentView(VIEWS.PATRON_EDITOR); }}
        onNewCustomPatron={handleNewCustomPatron}
        onNewPdfPatron={handleNewPdfPatron}
        onDeletePatron={(id) => { deletePatronFromDB(id); }}
        onRenamePatron={(id, name) => updatePatron(id, { name })}
        onChangePatronColor={(id, idx) => updatePatron(id, { colorIdx: idx })}
        onChangePatronPhoto={(id) => setPhotoTarget({ id, context: "patron" })}
        setEditingPdfPatron={(patron) => {
          if (patron) {
            const fresh = (database.patrons || []).find((item) => item.id === patron.id);
            setEditingPdfPatron(fresh ? { ...fresh } : { ...patron });
          } else {
            setEditingPdfPatron(null);
          }
        }}
      />
      {showLibraryImportModal && (
        <ImportPdfModal
          onClose={() => setShowLibraryImportModal(false)}
          onCreate={handleCreatePdfPatron}
        />
      )}
      {photoTarget && photoTarget.context === "patron" && (
        <PhotoCropModal
          existingImage={(database.patrons || []).find((patron) => patron.id === photoTarget.id)?.image}
          onClose={() => setPhotoTarget(null)}
          onConfirm={async (imgData) => { await persistPatronImageToIndexedDB(photoTarget.id, imgData); setPhotoTarget(null); }}
        />
      )}
      {editingPdfPatron && (
        <EditPdfPatronModal
          key={`${editingPdfPatron.id}-${(editingPdfPatron.pdfParties || []).length}`}
          patron={editingPdfPatron}
          onClose={() => setEditingPdfPatron(null)}
          onSave={(updates) => { updatePatron(editingPdfPatron.id, updates); setEditingPdfPatron(null); }}
        />
      )}
    </div>
  );
}
