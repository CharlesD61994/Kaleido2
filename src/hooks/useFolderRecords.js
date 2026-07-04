import { createFolderRecord, deleteFolderRecord, makeFolder, moveItemToFolderRecord, renameFolderRecord } from "../services/folderStore";

export default function useFolderRecords({ setDatabase }) {
  const createFolder = ({ name, section, colorIdx }) => {
    const folder = makeFolder({ name, section, colorIdx });
    createFolderRecord(setDatabase, folder);
    return folder;
  };

  const renameFolder = (folderId, name) => {
    renameFolderRecord(setDatabase, folderId, name);
  };

  const deleteFolder = (folderId) => {
    deleteFolderRecord(setDatabase, folderId);
  };

  const moveItemToFolder = ({ section, itemId, folderId }) => {
    moveItemToFolderRecord(setDatabase, { section, itemId, folderId });
  };

  return {
    createFolder,
    deleteFolder,
    moveItemToFolder,
    renameFolder,
  };
}
