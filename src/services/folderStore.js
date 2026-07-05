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

export const changeFolderColorRecord = (setDatabase, folderId, colorIdx) => {
  if (!folderId) return;
  const nextColorIdx = Number(colorIdx) || 0;

  setDatabase((prev) => {
    const nextDb = {
      ...prev,
      folders: asArray(prev?.folders).map((folder) => (
        folder.id === folderId ? { ...folder, colorIdx: nextColorIdx } : folder
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

export const moveItemToFolderRecord = (setDatabase, { section, itemId, folderId = null }) => {
  if (!section || itemId == null) return;

  const collectionBySection = {
    [FOLDER_SECTIONS.PERSONAL]: "projectsPersonal",
    [FOLDER_SECTIONS.PRO]: "projectsPro",
    [FOLDER_SECTIONS.LIBRARY]: "patrons",
  };

  const collectionKey = collectionBySection[section];
  if (!collectionKey) return;

  setDatabase((prev) => {
    const itemIdText = String(itemId);
    const targetFolder = folderId
      ? asArray(prev?.folders).find((folder) => folder.id === folderId && folder.section === section)
      : null;

    if (folderId && !targetFolder) return prev;

    const nextDb = {
      ...prev,
      [collectionKey]: asArray(prev?.[collectionKey]).map((item) => (
        String(item?.id) === itemIdText ? { ...item, folderId: folderId || null, folderUpdatedAt: new Date().toISOString() } : item
      )),
    };
    saveDatabase(nextDb);
    return nextDb;
  });
};
