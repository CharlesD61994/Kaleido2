import { saveDatabase } from "./databaseStore";

export const FOLDER_SECTIONS = {
  PERSONAL: "personal",
  PRO: "pro",
  LIBRARY: "library",
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export const getFolders = (database, section) => (
  asArray(database?.folders).filter((folder) => folder?.section === section)
);

export const makeFolder = ({ name, section, colorIdx = 0 }) => ({
  id: `folder-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  name: String(name || "Nouveau dossier").trim() || "Nouveau dossier",
  section,
  colorIdx,
  createdAt: new Date().toISOString(),
});

export const createFolderRecord = (setDatabase, folder) => {
  setDatabase((prev) => {
    const nextDb = {
      ...prev,
      folders: [...asArray(prev?.folders), folder],
    };
    saveDatabase(nextDb);
    return nextDb;
  });
};

export const renameFolderRecord = (setDatabase, folderId, name) => {
  const cleanName = String(name || "").trim();
  if (!folderId || !cleanName) return;

  setDatabase((prev) => {
    const nextDb = {
      ...prev,
      folders: asArray(prev?.folders).map((folder) => (
        folder.id === folderId ? { ...folder, name: cleanName } : folder
      )),
    };
    saveDatabase(nextDb);
    return nextDb;
  });
};

export const deleteFolderRecord = (setDatabase, folderId) => {
  if (!folderId) return;

  setDatabase((prev) => {
    const releaseFolder = (item) => (
      item?.folderId === folderId ? { ...item, folderId: null } : item
    );

    const nextDb = {
      ...prev,
      folders: asArray(prev?.folders).filter((folder) => folder.id !== folderId),
      projectsPersonal: asArray(prev?.projectsPersonal).map(releaseFolder),
      projectsPro: asArray(prev?.projectsPro).map(releaseFolder),
      patrons: asArray(prev?.patrons).map(releaseFolder),
    };
    saveDatabase(nextDb);
    return nextDb;
  });
};
