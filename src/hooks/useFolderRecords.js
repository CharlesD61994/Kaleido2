import { createFolderRecord, deleteFolderRecord, makeFolder, renameFolderRecord } from "../services/folderStore";

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

  return {
    createFolder,
    deleteFolder,
    renameFolder,
  };
}
