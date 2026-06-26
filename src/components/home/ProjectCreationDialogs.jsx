import React from "react";
import ClientModal from "../clients/ClientModal";
import ProjectCreationModals from "../projects/ProjectCreationModals";
import { ImportPdfModal } from "../pdf/PdfViews";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import { isValidOptionalClientEmail } from "../../services/clientStore";
import { savePdf } from "../../services/mediaStore";

export default function ProjectCreationDialogs({
  cancelClientProjectCreation,
  clientEmail,
  clientEmailError,
  clientError,
  clientModalMode,
  clientName,
  clientNameInputRef,
  confirmClientProjectCreation,
  createProjectFromPatron,
  database,
  navigateToLibrary,
  queueProjectCreation,
  setClientEmail,
  setClientEmailError,
  setClientError,
  setClientName,
  setShowImportModal,
  setShowNewMenu,
  setShowSelectPatronModal,
  showClientModal,
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

      <ClientModal
        show={showClientModal}
        mode={clientModalMode}
        clientName={clientName}
        clientEmail={clientEmail}
        clientError={clientError}
        clientEmailError={clientEmailError}
        clientNameInputRef={clientNameInputRef}
        onClientNameChange={(value) => {
          setClientName(value);
          if (clientError) setClientError("");
        }}
        onClientEmailChange={(value) => {
          setClientEmail(value);
          if (clientEmailError) setClientEmailError("");
        }}
        onClientEmailBlur={() => {
          const trimmed = clientEmail.trim();
          if (trimmed && !isValidOptionalClientEmail(trimmed)) {
            setClientEmailError("Le courriel n'est pas valide.");
          }
        }}
        onConfirm={confirmClientProjectCreation}
        onCancel={cancelClientProjectCreation}
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
