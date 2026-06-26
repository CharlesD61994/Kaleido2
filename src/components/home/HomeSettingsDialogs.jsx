import React from "react";
import { VIEWS } from "../../constants/views";
import { syncDatabaseWithCloud } from "../../services/databaseStore";
import SettingsModals from "../settings/SettingsModals";

export default function HomeSettingsDialogs({
  auth,
  database,
  setCurrentPatron,
  setCurrentProject,
  setCurrentView,
  setDatabase,
  setShowSettingsModal,
  showSettingsModal,
}) {
  return (
    <SettingsModals
      auth={auth}
      showSettingsModal={showSettingsModal}
      onCloseSettings={() => setShowSettingsModal(false)}
      database={database}
      onRestoreDatabase={(restoredDb) => {
        setDatabase(restoredDb);
        setCurrentProject(null);
        setCurrentPatron(null);
        setCurrentView(VIEWS.HUB);
        setShowSettingsModal(false);
      }}
      onSyncCloud={() => syncDatabaseWithCloud(setDatabase)}
    />
  );
}
