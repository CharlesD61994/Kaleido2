import { clearStorageKey, readStorageJSON, writeStorageJSON } from "./storage";

const PATRON_BACKUP_KEY = "kaleido_patron_backup";

export const loadPatronDraft = ({ sourceId, mode }) => {
  const payload = readStorageJSON(PATRON_BACKUP_KEY);
  if (!payload || typeof payload !== "object") return null;
  if ((payload.mode || null) !== mode) return null;
  if ((payload.sourceId ?? null) !== (sourceId ?? null)) return null;
  return payload.patron && typeof payload.patron === "object" ? payload.patron : null;
};

export const savePatronDraft = ({ label, mode, sourceId, patron }) => {
  return writeStorageJSON(PATRON_BACKUP_KEY, {
    label,
    savedAt: new Date().toISOString(),
    mode,
    sourceId,
    patron,
  });
};

export const clearPatronDraft = ({ sourceId, mode }) => {
  const payload = readStorageJSON(PATRON_BACKUP_KEY);
  if (!payload || typeof payload !== "object") return false;
  if ((payload.mode || null) !== mode) return false;
  if ((payload.sourceId ?? null) !== (sourceId ?? null)) return false;
  return clearStorageKey(PATRON_BACKUP_KEY);
};
