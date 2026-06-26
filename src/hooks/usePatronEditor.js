import { useEffect, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../constants/colors";
import { clearPatronDraft, loadPatronDraft, savePatronDraft } from "../utils/patronDraftStorage";

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const safeArray = (value) => Array.isArray(value) ? value : [];

export default function usePatronEditor({
  currentPatron,
  currentProject,
  navigateToHub,
  navigateToLibrary,
  updatePatron,
  updateProject,
}) {
  const source = currentPatron || currentProject;
  const isPatronMode = !!currentPatron;
  const draftMode = isPatronMode ? "patron" : "project";

  const [patron, setPatron] = useState(() => {
    const sourceSnapshot = {
      nom: source?.name || "Nouveau patron",
      laine: source?.laine || "",
      technique: source?.type || "crochet",
      outil: source?.outil || "",
      notes: source?.notes || "",
      parties: source?.parties || [],
    };
    const restoredDraft = loadPatronDraft({ sourceId: source?.id ?? null, mode: draftMode });
    return restoredDraft && typeof restoredDraft === "object" ? { ...sourceSnapshot, ...restoredDraft } : sourceSnapshot;
  });
  const [isEditingNom, setIsEditingNom] = useState(false);
  const [tempNom, setTempNom] = useState(patron.nom);

  const totalRangsPatron = patron.parties.reduce(
    (s, p) => s + p.rangs.filter(r => !r.isNote).length,
    0
  );

  const normalizePatron = (candidate) => {
    const base = candidate && typeof candidate === "object" ? candidate : {};
    const partieIds = new Set();
    const rangIds = new Set();
    const normalizedParties = safeArray(base.parties).map((partie, partieIndex) => {
      const rawPartie = partie && typeof partie === "object" ? partie : {};
      let partieId = rawPartie.id;
      if (partieId == null || partieIds.has(partieId)) {
        partieId = `partie-${partieIndex}-${makeId()}`;
      }
      partieIds.add(partieId);

      const normalizedRangs = safeArray(rawPartie.rangs).map((rang, rangIndex) => {
        const rawRang = rang && typeof rang === "object" ? rang : {};
        let rangId = rawRang.id;
        if (rangId == null || rangIds.has(rangId)) {
          rangId = `rang-${partieIndex}-${rangIndex}-${makeId()}`;
        }
        rangIds.add(rangId);
        return {
          ...rawRang,
          id: rangId,
          instruction: typeof rawRang.instruction === "string" ? rawRang.instruction : "",
          mailles: rawRang.mailles ?? null,
        };
      });

      return {
        ...rawPartie,
        id: partieId,
        nom: (typeof rawPartie.nom === "string" && rawPartie.nom.trim()) ? rawPartie.nom : "Nouvelle partie",
        colorIdx: Number.isInteger(rawPartie.colorIdx) ? rawPartie.colorIdx : (partieIndex % KALEIDOSCOPE_COLORS.length),
        rangs: normalizedRangs,
      };
    });

    return {
      nom: typeof base.nom === "string" ? base.nom : (source?.name || "Nouveau patron"),
      laine: typeof base.laine === "string" ? base.laine : "",
      technique: typeof base.technique === "string" ? base.technique : (source?.type || "crochet"),
      outil: typeof base.outil === "string" ? base.outil : "",
      notes: typeof base.notes === "string" ? base.notes : "",
      parties: normalizedParties,
    };
  };

  const backupPatronState = (label, state) => {
    try {
      savePatronDraft({
        label,
        mode: draftMode,
        sourceId: source?.id ?? null,
        patron: state,
      });
    } catch (e) {
      console.warn("[KALEIDO] backupPatronState error:", e);
    }
  };

  const validatePatron = (candidate) => {
    const errors = [];
    if (!candidate || typeof candidate !== "object") {
      errors.push("Patron invalide: objet manquant.");
      return errors;
    }

    const parties = safeArray(candidate.parties);
    const partieIds = new Set();
    const rangIds = new Set();

    for (const partie of parties) {
      if (!partie || typeof partie !== "object") {
        errors.push("Partie invalide: entrée non valide.");
        continue;
      }

      if (partie.id == null) {
        errors.push("Partie invalide: id manquant.");
      } else if (partieIds.has(partie.id)) {
        errors.push(`Partie dupliquée: ${partie.id}`);
      } else {
        partieIds.add(partie.id);
      }

      const rangs = safeArray(partie.rangs);
      if (!Array.isArray(partie.rangs)) {
        errors.push(`Rangs invalides dans la partie ${partie.id ?? "sans-id"}.`);
      }

      for (const rang of rangs) {
        if (!rang || typeof rang !== "object") {
          errors.push(`Rang invalide dans la partie ${partie.id ?? "sans-id"}.`);
          continue;
        }

        if (rang.id == null) {
          errors.push(`Rang sans id dans la partie ${partie.id ?? "sans-id"}.`);
        } else if (rangIds.has(rang.id)) {
          errors.push(`Rang dupliqué: ${rang.id}`);
        } else {
          rangIds.add(rang.id);
        }
      }
    }

    return errors;
  };

  const applyPatronUpdate = (label, updater) => {
    setPatron(prev => {
      try {
        const next = updater(prev);

        if (!next || typeof next !== "object") {
          console.warn(`[KALEIDO] ${label}: état ignoré (valeur invalide).`);
          return prev;
        }

        const normalizedNext = normalizePatron(next);
        const errors = validatePatron(normalizedNext);
        if (errors.length) {
          console.warn(`[KALEIDO] ${label}: patron invalide`, errors, normalizedNext);
          return prev;
        }

        backupPatronState(label, prev);
        return normalizedNext;
      } catch (e) {
        console.warn(`[KALEIDO] ${label}: exception`, e);
        return prev;
      }
    });
  };

  useEffect(() => {
    setPatron(prev => {
      const normalized = normalizePatron(prev);
      return JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized;
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      backupPatronState("autosave", patron);
    }, 300);

    return () => clearTimeout(timer);
  }, [patron]);

  const updatePatronInfo = (field, value) => applyPatronUpdate("updatePatronInfo", prev => ({ ...prev, [field]: value }));

  const handleSaveNom = () => {
    applyPatronUpdate("handleSaveNom", prev => ({ ...prev, nom: tempNom }));
    setIsEditingNom(false);
  };

  const handleSave = () => {
    const normalizedPatron = normalizePatron(patron);
    const errors = validatePatron(normalizedPatron);
    if (errors.length) {
      alert("Impossible de sauvegarder: le patron est invalide.");
      console.warn("[KALEIDO] handleSave: patron invalide", errors, normalizedPatron);
      return;
    }

    const totalRangsNormalized = normalizedPatron.parties.reduce(
      (s, p) => s + p.rangs.filter(r => !r.isNote).length,
      0
    );

    setPatron(normalizedPatron);
    backupPatronState("handleSave", normalizedPatron);
    clearPatronDraft({ sourceId: source?.id ?? null, mode: draftMode });

    if (isPatronMode) {
      updatePatron(currentPatron.id, { name: normalizedPatron.nom, laine: normalizedPatron.laine, type: normalizedPatron.technique, outil: normalizedPatron.outil, notes: normalizedPatron.notes, parties: normalizedPatron.parties, total: totalRangsNormalized });
      navigateToLibrary();
    } else {
      updateProject(currentProject.id, { name: normalizedPatron.nom, laine: normalizedPatron.laine, type: normalizedPatron.technique, outil: normalizedPatron.outil, notes: normalizedPatron.notes, parties: normalizedPatron.parties, total: Math.max(totalRangsNormalized, currentProject.total || 1) });
      navigateToHub();
    }
  };

  const addPartie = () =>
    applyPatronUpdate("addPartie", prev => ({
      ...prev,
      parties: [
        ...safeArray(prev.parties),
        {
          id: makeId(),
          nom: "Nouvelle partie",
          colorIdx: Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length),
          rangs: [],
        },
      ],
    }));

  const updatePartie = (id, updates) =>
    applyPatronUpdate("updatePartie", prev => ({
      ...prev,
      parties: safeArray(prev.parties).map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));

  const deletePartie = (id) => {
    if (!confirm("Supprimer cette partie?")) return;
    applyPatronUpdate("deletePartie", prev => ({
      ...prev,
      parties: safeArray(prev.parties).filter(p => p.id !== id),
    }));
  };

  const duplicatePartie = (id) => {
    applyPatronUpdate("duplicatePartie", prev => {
      const parties = safeArray(prev.parties);
      const p = parties.find(x => x.id === id);
      if (!p) return prev;

      return {
        ...prev,
        parties: [
          ...parties,
          {
            ...p,
            id: makeId(),
            nom: `${p.nom} (copie)`,
            rangs: safeArray(p.rangs).map(r => ({
              ...r,
              id: makeId(),
            })),
          },
        ],
      };
    });
  };

  const movePartie = (id, dir) =>
    applyPatronUpdate("movePartie", prev => {
      const arr = [...safeArray(prev.parties)];
      const i = arr.findIndex(p => p.id === id);
      const ni = dir === "up" ? i - 1 : i + 1;
      if (i === -1 || ni < 0 || ni >= arr.length) return prev;
      [arr[i], arr[ni]] = [arr[ni], arr[i]];
      return { ...prev, parties: arr };
    });

  const addRang = (partieId) =>
    applyPatronUpdate("addRang", prev => ({
      ...prev,
      parties: safeArray(prev.parties).map(p =>
        p.id !== partieId
          ? p
          : {
              ...p,
              rangs: [
                ...safeArray(p.rangs),
                {
                  id: makeId(),
                  instruction: "Nouvelle instruction",
                  mailles: null,
                },
              ],
            }
      ),
    }));

  const updateRang = (partieId, rangId, updates) =>
    applyPatronUpdate("updateRang", prev => ({
      ...prev,
      parties: safeArray(prev.parties).map(p =>
        p.id !== partieId
          ? p
          : {
              ...p,
              rangs: safeArray(p.rangs).map(r =>
                r.id === rangId ? { ...r, ...updates } : r
              ),
            }
      ),
    }));

  const deleteRang = (partieId, rangId) => {
    if (!confirm("Supprimer ce rang?")) return;

    applyPatronUpdate("deleteRang", prev => ({
      ...prev,
      parties: safeArray(prev.parties).map(p =>
        p.id !== partieId
          ? p
          : {
              ...p,
              rangs: safeArray(p.rangs).filter(r => r.id !== rangId),
            }
      ),
    }));
  };

  const duplicateRang = (partieId, rangId) =>
    applyPatronUpdate("duplicateRang", prev => ({
      ...prev,
      parties: safeArray(prev.parties).map(p => {
        if (p.id !== partieId) return p;

        return {
          ...p,
          rangs: safeArray(p.rangs).reduce((acc, r) => {
            acc.push(r);
            if (r.id === rangId) {
              acc.push({
                ...r,
                id: makeId(),
                instruction: `${r.instruction} (copie)`,
              });
            }
            return acc;
          }, []),
        };
      }),
    }));

  const moveRang = (partieId, rangId, dir) =>
    applyPatronUpdate("moveRang", prev => ({
      ...prev,
      parties: safeArray(prev.parties).map(p => {
        if (p.id !== partieId) return p;

        const arr = [...safeArray(p.rangs)];
        const i = arr.findIndex(r => r.id === rangId);
        const ni = dir === "up" ? i - 1 : i + 1;

        if (i === -1 || ni < 0 || ni >= arr.length) return p;

        [arr[i], arr[ni]] = [arr[ni], arr[i]];
        return { ...p, rangs: arr };
      }),
    }));

  return {
    addPartie,
    addRang,
    deletePartie,
    deleteRang,
    duplicatePartie,
    duplicateRang,
    handleSave,
    handleSaveNom,
    isEditingNom,
    isPatronMode,
    movePartie,
    moveRang,
    patron,
    setIsEditingNom,
    setTempNom,
    tempNom,
    totalRangsPatron,
    updatePartie,
    updatePatronInfo,
    updateRang,
  };
}
