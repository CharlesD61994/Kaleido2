import { saveDatabase } from "../services/databaseStore";
import { publishClientProject, ensureClientShareToken } from "../services/clientPortalStore";
import { updateClientInfoRecord } from "../services/clientStore";
import { updateProjectProgress } from "../services/progressStore";
import {
  deleteProProjectRecord,
  updateProProjectRecord,
} from "../services/proProjectsStore";

export default function useProjectRecords({
  mode,
  database,
  setCurrentProject,
  setDatabase,
}) {
  const projectsKey = mode === "pro" ? "projectsPro" : "projectsPersonal";
  const projects = database[projectsKey] || [];

  const publishSharedProjectQuietly = (project) => {
    if (!project?.clientShareToken) return;
    publishClientProject(project).catch((error) => {
      console.warn("[KALEIDO] publish shared client project error:", error);
    });
  };

  const updateProject = (projectId, updates) => {
    const currentProject = mode === "pro"
      ? (database.projectsPro || []).find((project) => String(project.id) === String(projectId))
      : null;

    setDatabase((prev) => {
      const prevProjectsKey = mode === "pro" ? "projectsPro" : "projectsPersonal";
      const nextDb = {
        ...prev,
        [prevProjectsKey]: (prev[prevProjectsKey] || []).map((project) => (
          project.id === projectId ? { ...project, ...updates } : project
        )),
      };
      saveDatabase(nextDb);
      return nextDb;
    });

    if (currentProject?.clientShareToken) {
      publishSharedProjectQuietly({ ...currentProject, ...updates });
    }
  };

  const saveProjectProgress = (projectId, progressData) => {
    const currentProject = mode === "pro"
      ? (database.projectsPro || []).find((project) => String(project.id) === String(projectId))
      : null;

    updateProjectProgress(setDatabase, saveDatabase, {
      type: mode === "pro" ? "pro" : "personal",
      projectId,
      data: progressData,
    });

    if (currentProject?.clientShareToken) {
      publishSharedProjectQuietly({ ...currentProject, ...progressData });
    }
  };

  const deleteProjectFromDB = (projectId) => {
    setDatabase((prev) => {
      const prevProjectsKey = mode === "pro" ? "projectsPro" : "projectsPersonal";
      const nextDb = {
        ...prev,
        [prevProjectsKey]: (prev[prevProjectsKey] || []).filter((project) => project.id !== projectId),
      };
      saveDatabase(nextDb);
      return nextDb;
    });
  };

  const updateProProject = (projectId, updates) => {
    updateProProjectRecord(setDatabase, saveDatabase, projectId, updates);
    const updatedProject = (database.projectsPro || []).find((project) => String(project.id) === String(projectId));
    publishSharedProjectQuietly(updatedProject ? { ...updatedProject, ...updates } : null);
    setCurrentProject((prev) => (prev && prev.id === projectId ? { ...prev, ...updates } : prev));
  };

  const updateClientInfo = (projectId, clientInfo) => {
    updateClientInfoRecord(setDatabase, saveDatabase, projectId, clientInfo);
    const updatedProject = (database.projectsPro || []).find((project) => String(project.id) === String(projectId));
    publishSharedProjectQuietly(updatedProject ? { ...updatedProject, ...clientInfo } : null);
    setCurrentProject((prev) => (prev && prev.id === projectId ? { ...prev, ...clientInfo } : prev));
  };

  const publishClientProjectRecord = async (project) => {
    if (!project) return { ok: false, reason: "Aucun projet à publier." };

    const token = ensureClientShareToken(project);
    const projectToPublish = { ...project, clientShareToken: token };

    if (!project.clientShareToken) {
      updateProProjectRecord(setDatabase, saveDatabase, project.id, { clientShareToken: token });
      setCurrentProject((prev) => (prev && prev.id === project.id ? { ...prev, clientShareToken: token } : prev));
    }

    return publishClientProject(projectToPublish);
  };

  const markClientMessagesRead = (project) => {
    if (!project?.id) return;
    const readAt = new Date().toISOString();
    updateProProjectRecord(setDatabase, saveDatabase, project.id, { clientLastReadAt: readAt });
    setCurrentProject((prev) => (prev && prev.id === project.id ? { ...prev, clientLastReadAt: readAt } : prev));
  };

  const deleteProProjectFromDB = (projectId) => {
    deleteProProjectRecord(setDatabase, saveDatabase, projectId);
    setCurrentProject((prev) => (prev && prev.id === projectId ? null : prev));
  };

  return {
    deleteProjectFromDB,
    deleteProProjectFromDB,
    projects,
    markClientMessagesRead,
    publishClientProjectRecord,
    saveProjectProgress,
    updateClientInfo,
    updateProject,
    updateProProject,
  };
}
