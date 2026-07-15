import { saveDatabase } from "../services/databaseStore";

const computeCustomTotal = (patron) => Math.max(
  1,
  (patron?.parties || []).reduce(
    (sum, partie) => sum + ((partie?.rangs || []).filter((rang) => !rang?.isNote).length),
    0
  )
);

export default function usePatronRecords({
  setDatabase,
}) {
  const addPatron = (patron) => {
    setDatabase((prev) => {
      const newDb = {
        ...prev,
        patrons: [...(prev?.patrons || []), patron],
        settings: { ...(prev?.settings || {}), lastPatronId: patron.id },
      };
      saveDatabase(newDb);
      return newDb;
    });
  };

  const updatePatron = (patronId, updates) => {
    setDatabase((prev) => {
      const updatedPatrons = (prev?.patrons || []).map((patron) => (
        patron.id === patronId ? { ...patron, ...updates } : patron
      ));
      const updatedPatron = updatedPatrons.find((patron) => patron.id === patronId);

      const syncProjectFromPatron = (project) => {
        if (project.patronId !== patronId || !updatedPatron || project.linkMode === "detached") return project;

        if (updatedPatron.projectType === "custom") {
          return {
            ...project,
            name: updatedPatron.name,
            colorIdx: updatedPatron.colorIdx,
            image: updatedPatron.image || null,
            projectType: "custom",
            type: updatedPatron.type,
            laine: updatedPatron.laine,
            outil: updatedPatron.outil,
            notes: updatedPatron.notes,
            parties: updatedPatron.parties || [],
            total: computeCustomTotal(updatedPatron),
          };
        }

        return {
          ...project,
          name: updatedPatron.name,
          colorIdx: updatedPatron.colorIdx,
          image: updatedPatron.image || null,
          projectType: "pdf",
          pdfId: updatedPatron.pdfId,
          pdfParties: updatedPatron.pdfParties || [],
          pdfRepetitions: updatedPatron.pdfRepetitions || [],
          pdfPartieRepetitions: updatedPatron.pdfPartieRepetitions || [],
          total: updatedPatron.total || 1,
        };
      };

      const newDb = {
        ...prev,
        patrons: updatedPatrons,
        projectsPersonal: (prev?.projectsPersonal || []).map(syncProjectFromPatron),
        projectsPro: (prev?.projectsPro || []).map(syncProjectFromPatron),
      };
      saveDatabase(newDb);
      return newDb;
    });
  };

  const deletePatronFromDB = (patronId) => {
    setDatabase((prev) => {
      const detachProjectFromPatron = (project) => {
        if (project.patronId !== patronId) return project;
        return {
          ...project,
          patronId: null,
          linkMode: "detached",
        };
      };

      const newDb = {
        ...prev,
        patrons: (prev?.patrons || []).filter((patron) => patron.id !== patronId),
        projectsPersonal: (prev?.projectsPersonal || []).map(detachProjectFromPatron),
        projectsPro: (prev?.projectsPro || []).map(detachProjectFromPatron),
      };
      saveDatabase(newDb);
      return newDb;
    });
  };

  return {
    addPatron,
    deletePatronFromDB,
    updatePatron,
  };
}
