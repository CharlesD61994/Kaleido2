import { KALEIDOSCOPE_COLORS } from "../constants/colors";
import { savePdf } from "../services/mediaStore";

export default function useLibraryPdfImport({
  addPatron,
  database,
  setShowLibraryImportModal,
}) {
  const handleCreatePdfPatron = async (name, pdfData, total, partiesConfig) => {
    const newId = (database.settings.lastPatronId || 0) + 1;
    const colorIdx = Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length);
    const pdfId = `patron_pdf_${newId}`;
    const saved = await savePdf(pdfId, pdfData);

    if (!saved) {
      alert("Erreur: impossible de sauvegarder le PDF.");
      return;
    }

    const pdfParties = partiesConfig
      .filter((partie) => partie.nom.trim())
      .map((partie, index) => ({
        id: index + 1,
        nom: partie.nom.trim(),
        totalRangs: parseInt(partie.rangs) || 0,
        colorIdx: Number.isInteger(partie.colorIdx) ? partie.colorIdx : index % KALEIDOSCOPE_COLORS.length,
      }));

    const newPatron = {
      id: newId,
      name,
      colorIdx,
      image: null,
      projectType: "pdf",
      pdfId,
      total,
      pdfParties,
      createdAt: new Date().toISOString(),
    };

    addPatron(newPatron);
    setShowLibraryImportModal(false);
  };

  return { handleCreatePdfPatron };
}
