import React from "react";
import ProjectCreationModals from "../projects/ProjectCreationModals";
import { ImportPdfModal } from "../pdf/PdfViews";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import { savePdf } from "../../services/mediaStore";

export default function ProjectCreationDialogs({
  createProjectFromPatron,
  database,
  navigateToLibrary,
  queueProjectCreation,
  setShowImportModal,
  setShowNewMenu,
  setShowSelectPatronModal,
  showImportModal,
  showNewMenu,
  showSelectPatronModal,
}) {
  const handleCreatePdfProject = async (name, pdfData, total, partiesConfig) => {
    const newId = database.settings.lastProjectId + 1;
    const colorIdx = Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length);
    const pdfId = `pdf_${newId}`;
    const saved = await savePdf(pdfId, pdfData);
    if (!saved) {
      alert("Erreur: impossible de sauvegarder le PDF.");
      return;
    }

    const pdfParties = partiesConfig.filter((part) => part.nom.trim()).map((part, index) => ({
      id: index + 1,
      nom: part.nom.trim(),
      totalRangs: parseInt(part.rangs, 10) || 0,
      colorIdx: Number.isInteger(part.colorIdx) ? part.colorIdx : index % KALEIDOSCOPE_COLORS.length,
    }));

    const realTotal = pdfParties.length > 0
      ? pdfParties.reduce((sum, part) => sum + part.totalRangs, 0)
      : total;

    queueProjectCreation({
      id: newId,
      name,
      rang: 0,
      total: realTotal,
      colorIdx,
      image: null,
      projectType: "pdf",
      pdfId,
      pdfParties,
      elapsedTime: 0,
      createdAt: new Date().toISOString(),
      status: "en_cours",
    });
    setShowImportModal(false);
  };

  return (
    <>
      <ProjectCreationModals
        showNewMenu={showNewMenu}
        showSelectPatronModal={showSelectPatronModal}
        database={database}
        onCloseNewMenu={() => setShowNewMenu(false)}
        onOpenSelectPatron={() => setShowSelectPatronModal(true)}
        onCloseSelectPatron={() => setShowSelectPatronModal(false)}
        onNavigateLibrary={navigateToLibrary}
        onCreateProjectFromPatron={createProjectFromPatron}
      />

      {showImportModal && (
        <ImportPdfModal
          onClose={() => setShowImportModal(false)}
          onCreate={handleCreatePdfProject}
        />
      )}
    </>
  );
}
