import React, { Suspense, lazy } from "react";

const AppPro = lazy(() => import("../../AppPro"));

export default function ProHomeContent({
  creation,
  database,
  modals,
  navigation,
  photo,
  records,
  unreadProjectIds,
}) {
  const { openClientEditor } = creation;
  const { setCreationMode, setShowNewMenu } = modals;
  const { navigateToClientPage, navigateToPdfViewer, navigateToRowCounter } = navigation;
  const { persistProjectImageToIndexedDB } = photo;
  const { deleteProProjectFromDB, updateProProject } = records;

  return (
    <Suspense fallback={null}>
      <AppPro
        projectsPro={database.projectsPro || []}
        unreadProjectIds={unreadProjectIds}
        onCreateProProject={() => {
          setCreationMode("pro");
          setShowNewMenu(true);
        }}
        onProjectOpen={(project) => {
          if (project?.projectType === "pdf") {
            navigateToPdfViewer(project);
          } else {
            navigateToRowCounter(project);
          }
        }}
        onRenameProProject={(projectId, newName) => updateProProject(projectId, { name: newName })}
        onDeleteProProject={(projectId) => deleteProProjectFromDB(projectId)}
        onCompleteProProject={(projectId, updates) => updateProProject(projectId, updates)}
        onRestoreProProject={(projectId, updates) => updateProProject(projectId, updates)}
        onChangeProProjectPhoto={(projectId, image) => persistProjectImageToIndexedDB(projectId, image, "pro")}
        onChangeProProjectColor={(projectId, colorIdx) => updateProProject(projectId, { colorIdx })}
        onEditProProjectClient={(project) => openClientEditor(project)}
        onOpenClientPage={(project) => navigateToClientPage(project)}
      />
    </Suspense>
  );
}
