import { changeFolderColorRecord, createFolderRecord, deleteFolderRecord, makeFolder, moveItemToFolderRecord, renameFolderRecord } from "../services/folderStore";

export default function useFolderRecords({ setDatabase }) {
  const createFolder = ({ name, section, colorIdx }) => {
    const folder = makeFolder({ name, section, colorIdx });
    createFolderRecord(setDatabase, folder);
    return folder;
  };

  const renameFolder = (folderId, name) => {
    renameFolderRecord(setDatabase, folderId, name);
  };

  const changeFolderColor = (folderId, colorIdx) => {
    changeFolderColorRecord(setDatabase, folderId, colorIdx);
  };

  const deleteFolder = (folderId) => {
    deleteFolderRecord(setDatabase, folderId);
  };

  const moveItemToFolder = ({ section, itemId, folderId }) => {
    moveItemToFolderRecord(setDatabase, { section, itemId, folderId });
  };

  return {
    createFolder,
    changeFolderColor,
    deleteFolder,
    moveItemToFolder,
    renameFolder,
  };
}
