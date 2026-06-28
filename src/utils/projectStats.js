export const formatTimeMs = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const getProjectParts = (project = {}) => {
  if (project.projectType === "pdf") {
    return (project.pdfParties || []).map((part, index) => ({
      id: String(part.id ?? index),
      name: part.nom || `Partie ${index + 1}`,
      rows: Number(part.totalRangs) || 0,
    }));
  }

  return (project.parties || []).map((part, index) => ({
    id: String(part.id ?? index),
    name: part.nom || part.name || `Partie ${index + 1}`,
    rows: (part.rangs || []).filter((rang) => !rang?.isNote).length,
  }));
};

export const getProjectStats = (project = {}) => {
  const rowsDone = Number(project.rang) || 0;
  const totalRows = Number(project.total) || rowsDone;
  const elapsedTime = Number(project.elapsedTime) || 0;
  const averageTime = rowsDone > 0 ? elapsedTime / rowsDone : 0;
  const parts = getProjectParts(project);
  const partTimes = project.partieTimes || {};

  return {
    rowsDone,
    totalRows,
    elapsedTime,
    averageTime,
    parts,
    partTimes,
    elapsedTimeLabel: formatTimeMs(elapsedTime),
    averageTimeLabel: averageTime ? formatTimeMs(averageTime) : "00:00:00",
    typeLabel: project.projectType === "pdf" ? "PDF" : "Custom",
  };
};
