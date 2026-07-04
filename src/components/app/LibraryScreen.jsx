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
  folderRecords,
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
          folderRecords={folderRecords}
          setEditingPdfPatron={() => {}}
        />
      </div>
    </div>
  );
}

export default function LibraryScreen({
  activeScreenInteractiveStyle,
  addPatron,
  currentView,
  database,
  deletePatronFromDB,
  editingPdfPatron,
  folderRecords,
  handleNewCustomPatron,
  handleNewPdfPatron,
  navigateToHub,
  navigateToLibrary,
  navigateToPdfPatronEdit,
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

  const closePdfPatronPage = () => {
    setShowLibraryImportModal(false);
    setEditingPdfPatron(null);
    navigateToLibrary();
  };

  const handleCreatePdfPatronPage = async (...args) => {
    await handleCreatePdfPatron(...args);
    navigateToLibrary();
  };

  const handleSavePdfPatronPage = (updates) => {
    if (!editingPdfPatron) return;
    updatePatron(editingPdfPatron.id, updates);
    setEditingPdfPatron(null);
    navigateToLibrary();
  };

  if (currentView === VIEWS.PDF_PATRON_IMPORT) {
    return (
      <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), ...activeScreenInteractiveStyle }}>
        <ImportPdfModal
          asPage
          onClose={closePdfPatronPage}
          onCreate={handleCreatePdfPatronPage}
        />
      </div>
    );
  }

  if (currentView === VIEWS.PDF_PATRON_EDIT && editingPdfPatron) {
    return (
      <div data-kaleido-screen="true" style={{ ...viewWrapStyle(viewTransition), ...activeScreenInteractiveStyle }}>
        <EditPdfPatronModal
          asPage
          key={`${editingPdfPatron.id}-${(editingPdfPatron.pdfParties || []).length}`}
          patron={editingPdfPatron}
          onClose={closePdfPatronPage}
          onSave={handleSavePdfPatronPage}
        />
      </div>
    );
  }

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
        folderRecords={folderRecords}
        setEditingPdfPatron={(patron) => {
          if (patron) {
            const fresh = (database.patrons || []).find((item) => item.id === patron.id);
            setEditingPdfPatron(fresh ? { ...fresh } : { ...patron });
            navigateToPdfPatronEdit();
          } else {
            setEditingPdfPatron(null);
          }
        }}
      />
      {photoTarget && photoTarget.context === "patron" && (
        <PhotoCropModal
          existingImage={(database.patrons || []).find((patron) => patron.id === photoTarget.id)?.image}
          onClose={() => setPhotoTarget(null)}
          onConfirm={async (imgData) => { await persistPatronImageToIndexedDB(photoTarget.id, imgData); setPhotoTarget(null); }}
        />
      )}
    </div>
  );
}
