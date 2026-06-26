const asArray = (value) => (Array.isArray(value) ? value : []);

const clampProgress = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export const computeProgress = (project) => {
  if (!project || typeof project !== "object") return 0;

  if (typeof project.rang === "number" && typeof project.total === "number" && project.total > 0) {
    return clampProgress((project.rang / project.total) * 100);
  }

  if (typeof project.progress === "number") {
    return clampProgress(project.progress);
  }

  return 0;
};

const getProjectKey = (type) => (type === "pro" ? "projectsPro" : "projectsPersonal");

const normalizeProgressData = (data = {}) => {
  const next = { ...(data && typeof data === "object" ? data : {}) };

  if (next.rang != null) {
    const rang = Number(next.rang);
    if (Number.isFinite(rang)) next.rang = Math.max(0, Math.round(rang));
  }

  if (next.total != null) {
    const total = Number(next.total);
    if (Number.isFinite(total)) next.total = Math.max(0, Math.round(total));
  }

  if (next.progress != null) {
    next.progress = clampProgress(next.progress);
  }

  if (next.elapsedTime != null) {
    const elapsedTime = Number(next.elapsedTime);
    if (Number.isFinite(elapsedTime)) next.elapsedTime = Math.max(0, Math.round(elapsedTime));
  }

  return next;
};

export const updateProjectProgress = (
  setDatabase,
  saveDatabase,
  { type = "personal", projectId, data = {} } = {}
) => {
  const key = getProjectKey(type);
  const updates = normalizeProgressData(data);

  setDatabase((prev) => {
    const nextDb = {
      ...prev,
      [key]: asArray(prev?.[key]).map((project) =>
        String(project.id) === String(projectId) ? { ...project, ...updates } : project
      ),
    };

    saveDatabase(nextDb);
    return nextDb;
  });

  return updates;
};
