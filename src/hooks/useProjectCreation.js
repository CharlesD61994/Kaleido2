import { useCallback, useEffect, useRef, useState } from "react";
import { createProProject } from "../services/proProjectsStore";
import {
  attachClientInfoToProject,
  buildClientInfo,
  getClientDraftFromProject,
  getClientValidationErrors,
} from "../services/clientStore";
import { saveDatabase } from "../services/databaseStore";

export default function useProjectCreation({
  creationMode,
  database,
  databaseRef,
  mode,
  setDatabase,
  updateClientInfo,
  navigateToPatronEditor,
}) {
  const [showClientModal, setShowClientModal] = useState(false);
  const [pendingProject, setPendingProject] = useState(null);
  const [pendingProjectAction, setPendingProjectAction] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientError, setClientError] = useState("");
  const [clientEmailError, setClientEmailError] = useState("");
  const [clientModalMode, setClientModalMode] = useState("create");
  const [editingClientProjectId, setEditingClientProjectId] = useState(null);
  const clientNameInputRef = useRef(null);

  useEffect(() => {
    if (!showClientModal) return;
    const timer = setTimeout(() => {
      clientNameInputRef.current?.focus();
      clientNameInputRef.current?.select?.();
    }, 80);
    return () => clearTimeout(timer);
  }, [showClientModal, clientModalMode]);

  const addProjectToDB = useCallback((project) => {
    let createdDb = null;

    setDatabase((prev) => {
      const prevProjectsKey = mode === "pro" ? "projectsPro" : "projectsPersonal";
      const nextDb = {
        ...prev,
        [prevProjectsKey]: [...(prev[prevProjectsKey] || []), project],
        settings: { ...prev.settings, lastProjectId: project.id },
      };

      createdDb = nextDb;
      saveDatabase(nextDb);
      return nextDb;
    });

    return createdDb;
  }, [mode, setDatabase]);

  const resetClientModalState = useCallback(() => {
    setShowClientModal(false);
    setPendingProject(null);
    setPendingProjectAction(null);
    setClientName("");
    setClientEmail("");
    setClientError("");
    setClientEmailError("");
    setClientModalMode("create");
    setEditingClientProjectId(null);
  }, []);

  const queueProjectCreation = useCallback((project, actionAfterCreate = null) => {
    if (creationMode === "pro") {
      setPendingProject(project);
      setPendingProjectAction(actionAfterCreate);
      setClientModalMode("create");
      setEditingClientProjectId(null);
      setClientName("");
      setClientEmail("");
      setClientError("");
      setClientEmailError("");
      setShowClientModal(true);
      return;
    }

    addProjectToDB(project);
    if (actionAfterCreate === "patron_editor") {
      navigateToPatronEditor(project);
    }
  }, [addProjectToDB, creationMode, navigateToPatronEditor]);

  const confirmClientProjectCreation = useCallback(() => {
    const clientInfo = buildClientInfo({ client: clientName, email: clientEmail });
    const validation = getClientValidationErrors(clientInfo);

    if (validation.client) {
      setClientError(validation.client);
      return;
    }

    if (validation.email) {
      setClientEmailError(validation.email);
      return;
    }

    if (clientModalMode === "edit" && editingClientProjectId != null) {
      updateClientInfo(editingClientProjectId, clientInfo);
      resetClientModalState();
      return;
    }

    if (!pendingProject) {
      setClientError("Impossible de créer le projet : aucune création en attente.");
      return;
    }

    const safeProjectId = Math.max(
      (databaseRef.current?.settings?.lastProjectId || 0) + 1,
      Number(pendingProject.id) || 0
    );

    const finalProject = attachClientInfoToProject(
      { ...pendingProject, id: safeProjectId },
      clientInfo
    );

    createProProject(setDatabase, saveDatabase, finalProject);

    const actionAfterCreate = pendingProjectAction;
    resetClientModalState();

    if (actionAfterCreate === "patron_editor") {
      navigateToPatronEditor(finalProject);
    }
  }, [
    clientEmail,
    clientModalMode,
    clientName,
    databaseRef,
    editingClientProjectId,
    navigateToPatronEditor,
    pendingProject,
    pendingProjectAction,
    resetClientModalState,
    setDatabase,
    updateClientInfo,
  ]);

  const cancelClientProjectCreation = useCallback(() => {
    resetClientModalState();
  }, [resetClientModalState]);

  const createProjectFromPatron = useCallback((patron) => {
    const newId = database.settings.lastProjectId + 1;
    const newProject = {
      id: newId,
      name: patron.name,
      rang: 0,
      total: patron.total || 0,
      colorIdx: patron.colorIdx,
      image: patron.image || null,
      projectType: patron.projectType,
      patronId: patron.id,
      linkMode: "mirror",
      ...(patron.projectType === "custom"
        ? {
            type: patron.type,
            laine: patron.laine,
            outil: patron.outil,
            notes: patron.notes,
            parties: patron.parties,
          }
        : { pdfId: patron.pdfId, pdfParties: patron.pdfParties }),
      elapsedTime: 0,
      createdAt: new Date().toISOString(),
      status: "en_cours",
    };

    queueProjectCreation(newProject);
  }, [database.settings.lastProjectId, queueProjectCreation]);

  const openClientEditor = useCallback((project) => {
    if (!project) return;
    const clientDraft = getClientDraftFromProject(project);
    setClientModalMode("edit");
    setEditingClientProjectId(project.id);
    setPendingProject(null);
    setPendingProjectAction(null);
    setClientName(clientDraft.client);
    setClientEmail(clientDraft.email);
    setClientError("");
    setClientEmailError("");
    setShowClientModal(true);
  }, []);

  return {
    cancelClientProjectCreation,
    clientEmail,
    clientEmailError,
    clientError,
    clientModalMode,
    clientName,
    clientNameInputRef,
    confirmClientProjectCreation,
    createProjectFromPatron,
    openClientEditor,
    queueProjectCreation,
    setClientEmail,
    setClientEmailError,
    setClientError,
    setClientName,
    showClientModal,
  };
}
