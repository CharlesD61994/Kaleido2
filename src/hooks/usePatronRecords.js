import { saveDatabase } from "../services/databaseStore";

const computeCustomTotal = (patron) => Math.max(
  1,
  (patron?.parties || []).reduce(
    (sum, partie) => sum + ((partie?.rangs || []).filter((rang) => !rang?.isNote).length),
    0
  )
);

export default function usePatronRecords({
  database,
  setDatabase,
}) {
  const addPatron = (patron) => {
    const newDb = {
      ...database,
      patrons: [...(database.patrons || []), patron],
      settings: { ...database.settings, lastPatronId: patron.id },
    };
    setDatabase(newDb);
    saveDatabase(newDb);
  };

  const updatePatron = (patronId, updates) => {
    const updatedPatrons = (database.patrons || []).map((patron) => (
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
        total: updatedPatron.total || 1,
      };
    };

    const newDb = {
      ...database,
      patrons: updatedPatrons,
      projectsPersonal: (database.projectsPersonal || []).map(syncProjectFromPatron),
      projectsPro: (database.projectsPro || []).map(syncProjectFromPatron),
    };
    setDatabase(newDb);
    saveDatabase(newDb);
  };

  const deletePatronFromDB = (patronId) => {
    const detachProjectFromPatron = (project) => {
      if (project.patronId !== patronId) return project;
      return {
        ...project,
        patronId: null,
        linkMode: "detached",
      };
    };

    const newDb = {
      ...database,
      patrons: (database.patrons || []).filter((patron) => patron.id !== patronId),
      projectsPersonal: (database.projectsPersonal || []).map(detachProjectFromPatron),
      projectsPro: (database.projectsPro || []).map(detachProjectFromPatron),
    };
    setDatabase(newDb);
    saveDatabase(newDb);
  };

  return {
    addPatron,
    deletePatronFromDB,
    updatePatron,
  };
}
