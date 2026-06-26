import { updateProProjectRecord } from "./proProjectsStore";
import { ensureClientShareToken } from "./clientPortalStore";

export const buildClientInfo = ({ client = "", email = "" } = {}) => ({
  client: String(client || "").trim(),
  email: String(email || "").trim(),
});

export const isValidOptionalClientEmail = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
};

export const getClientValidationErrors = (clientInfo = {}) => {
  const info = buildClientInfo(clientInfo);

  return {
    client: info.client ? "" : "Le nom du client est obligatoire.",
    email: isValidOptionalClientEmail(info.email)
      ? ""
      : "Le courriel n’est pas valide.",
  };
};

export const getClientDraftFromProject = (project = {}) => ({
  client: project?.client || "",
  email: project?.email || "",
});

export const attachClientInfoToProject = (project = {}, clientInfo = {}) => ({
  ...(project && typeof project === "object" ? project : {}),
  ...buildClientInfo(clientInfo),
  clientShareToken: ensureClientShareToken(project),
});

export const updateClientInfoRecord = (
  setDatabase,
  saveDatabase,
  projectId,
  clientInfo = {}
) => {
  const updates = buildClientInfo(clientInfo);
  updateProProjectRecord(setDatabase, saveDatabase, projectId, updates);
  return updates;
};
