import { useState } from "react";
import { importDatabase } from "../../services/databaseStore";
import { isSupabaseConfigured } from "../../services/supabaseClient";
import { supabase } from "../../services/supabaseClient";
import { loadImage, loadPdf, saveImage, savePdf } from "../../services/mediaStore";
import Icon from "../icons/Icon";
import IconBadge from "../ui/IconBadge";
import { getThemeMode, THEME_MODES } from "../../styles/theme";

export default function SettingsModals({
  auth,
  showSettingsModal,
  onCloseSettings,
  database,
  onChangeThemeMode,
  onRestoreDatabase,
  onSyncCloud,
}) {
  const [cloudStatus, setCloudStatus] = useState(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importingBackup, setImportingBackup] = useState(false);
  const themeMode = getThemeMode(database);

  if (!showSettingsModal) return null;

  const downloadBackupFile = async (content, fileName) => {
    const blob = new Blob([content], { type: "application/json" });
    const file = typeof File !== "undefined"
      ? new File([blob], fileName, { type: "application/json" })
      : null;

    const shareApi = typeof navigator !== "undefined" ? navigator : null;
    if (
      file
      && shareApi?.canShare?.({ files: [file] })
      && shareApi?.share
    ) {
      try {
        await shareApi.share({
          files: [file],
          title: "Sauvegarde Kaleido",
          text: "Sauvegarde JSON Kaleido",
        });
        return "shared";
      } catch (error) {
        if (error?.name === "AbortError") return "cancelled";
      }
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 1200);
    return "downloaded";
  };

  const exportBackup = async () => {
    try {
      const allProjects = [...(database.projectsPersonal || []), ...(database.projectsPro || [])];
      const pdfProjects = allProjects.filter((project) => project.projectType === "pdf" && project.pdfId);
      const patronPdfs = (database.patrons || []).filter((patron) => patron.projectType === "pdf" && patron.pdfId);
      const pdfs = {};

      for (const project of [...pdfProjects, ...patronPdfs]) {
        const data = await loadPdf(project.pdfId);
        if (data) {
          pdfs[project.pdfId] = data;
        }
      }

      const imageIds = new Set();
      const collectImageId = (item) => {
        const imageId = item?.image?.imageId;
        const previewId = item?.image?.previewId;
        if (imageId) {
          imageIds.add(imageId);
        }
        if (previewId) {
          imageIds.add(previewId);
        }
      };
      [...allProjects, ...(database.patrons || [])].forEach(collectImageId);

      const images = {};
      for (const imageId of imageIds) {
        const imageData = await loadImage(imageId);
        if (imageData) {
          images[imageId] = imageData;
        }
      }

      const backupMeta = {
        format: "kaleido-json-backup",
        version: 2,
        createdAt: new Date().toISOString(),
        counts: {
          personalProjects: database.projectsPersonal?.length || 0,
          proProjects: database.projectsPro?.length || 0,
          patrons: database.patrons?.length || 0,
          pdfsExpected: Object.keys(pdfs).length,
          pdfsIncluded: Object.keys(pdfs).length,
          imagesExpected: Object.keys(images).length,
          imagesIncluded: Object.keys(images).length,
          missingMedia: 0,
        },
        missingMedia: {
          pdfs: [],
          images: [],
        },
      };

      const fullExport = JSON.stringify({ ...database, pdfs, images, backupMeta });
      const fileName = `kaleido-backup-${new Date().toISOString().split("T")[0]}.json`;
      await downloadBackupFile(fullExport, fileName);

      window.setTimeout(() => {
        alert([
          "Sauvegarde JSON creee.",
          "",
          `${backupMeta.counts.personalProjects + backupMeta.counts.proProjects} projets, ${backupMeta.counts.patrons} patrons.`,
          `${backupMeta.counts.pdfsIncluded} PDF inclus.`,
          `${backupMeta.counts.imagesIncluded} images incluses.`,
        ].join("\n"));
      }, 350);
    } catch (error) {
      alert("Erreur export : " + error.message);
    }
  };

  const importBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportingBackup(true);
    setImportStatus("Lecture du fichier...");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      const text = await file.text();
      setImportStatus("Analyse de la sauvegarde...");
      const data = JSON.parse(text);
      const sourceDb = data?.database && typeof data.database === "object" ? data.database : data;

      const pdfsToRestore = data?.pdfs || sourceDb?.pdfs || {};
      let restoredPdfCount = 0;
      if (Object.keys(pdfsToRestore).length) setImportStatus("Restauration des PDF...");
      for (const [pdfId, pdfData] of Object.entries(pdfsToRestore)) {
        if (pdfId && typeof pdfData === "string") {
          const saved = await savePdf(pdfId, pdfData);
          if (saved) restoredPdfCount += 1;
        }
      }

      const imagesToRestore = data?.images || sourceDb?.images || {};
      let restoredImageCount = 0;
      if (Object.keys(imagesToRestore).length) setImportStatus("Restauration des images...");
      for (const [imageId, imageData] of Object.entries(imagesToRestore)) {
        if (imageId && typeof imageData === "string") {
          const saved = await saveImage(imageId, imageData);
          if (saved) restoredImageCount += 1;
        }
      }

      setImportStatus("Application des donnees...");
      const restoredDb = importDatabase(data);
      onRestoreDatabase(restoredDb);
      event.target.value = "";
      setImportStatus("Importation terminee.");
      const missingCount = Number(data?.backupMeta?.counts?.missingMedia || 0);
      alert([
        "Donnees restaurees avec succes.",
        "",
        `${restoredPdfCount} PDF restaures.`,
        `${restoredImageCount} images restaurees.`,
        missingCount
          ? `Attention : cette sauvegarde indiquait ${missingCount} media manquant au moment de l'export.`
          : "Aucun media manquant signale dans cette sauvegarde.",
      ].join("\n"));
    } catch (error) {
      setImportStatus(null);
      alert("Erreur import : " + (error?.message || "fichier invalide"));
    } finally {
      setImportingBackup(false);
    }
  };

  const syncCloud = async () => {
    if (!isSupabaseConfigured) {
      setCloudStatus({ ok: false, message: "Supabase n'est pas configuré." });
      return;
    }

    setSyncingCloud(true);
    setCloudStatus(null);

    try {
      const result = await onSyncCloud?.();
      if (result?.ok) {
        const sourceLabel = result.source === "cloud-pulled"
          ? "Données récupérées du cloud."
          : result.source === "local-pushed"
            ? "Données envoyées au cloud."
            : "Cloud déjà à jour.";
        setCloudStatus({ ok: true, message: sourceLabel });
      } else {
        setCloudStatus({
          ok: false,
          message: result?.reason || result?.error?.message || "Synchronisation impossible.",
        });
      }
    } catch (error) {
      setCloudStatus({ ok: false, message: error?.message || "Synchronisation impossible." });
    } finally {
      setSyncingCloud(false);
    }
  };

  return (
    <div onClick={onCloseSettings} style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(event) => event.stopPropagation()} style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 430 }}>
        <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 20px" }} />
        <h2 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: "0 0 20px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Icon name="settings" size={18} color="#A78BFA" />Paramètres
        </h2>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "var(--k-muted)", fontSize: 12, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", margin: "0 0 8px", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Thème
          </div>
          <div style={{ display: "flex", background: "var(--k-field)", border: "1px solid var(--k-border)", borderRadius: 14, padding: 4 }}>
            {[
              { mode: THEME_MODES.dark, label: "Dark" },
              { mode: THEME_MODES.light, label: "Light" },
            ].map((option) => {
              const selected = themeMode === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => onChangeThemeMode?.(option.mode)}
                  style={{
                    flex: 1,
                    minHeight: 42,
                    border: "none",
                    borderRadius: 11,
                    background: selected ? "linear-gradient(135deg, #7C3AED, #DB2777)" : "transparent",
                    color: selected ? "#fff" : "var(--k-muted)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 180ms ease",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={syncCloud} disabled={syncingCloud} style={{ width: "100%", padding: "16px", borderRadius: 14, background: isSupabaseConfigured ? "linear-gradient(135deg, #0891B222, #22D3EE22)" : "#151526", border: `1px solid ${isSupabaseConfigured ? "#0891B244" : "#33334A"}`, cursor: syncingCloud ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 12, opacity: syncingCloud ? 0.78 : 1 }}>
          <IconBadge name={isSupabaseConfigured ? "upload" : "alert"} tone={isSupabaseConfigured ? "blue" : "amber"} size={24} />
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
              {syncingCloud ? "Synchronisation..." : "Synchroniser avec Supabase"}
            </div>
            <div style={{ color: isSupabaseConfigured ? "#22D3EE" : "#FBBF24", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
              {isSupabaseConfigured ? "Cloud configuré pour cette installation" : "Cloud non configuré"}
            </div>
            {cloudStatus && (
              <div style={{ color: cloudStatus.ok ? "#34D399" : "#F87171", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginTop: 6, lineHeight: 1.35 }}>
                {cloudStatus.message}
              </div>
            )}
          </div>
        </button>

        {auth?.user && (
          <button onClick={() => supabase?.auth.signOut()} style={{ width: "100%", padding: "16px", borderRadius: 14, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.22)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <IconBadge name="alert" tone="amber" size={24} />
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Déconnexion</div>
              <div style={{ color: "#FCA5A5", fontSize: 12, fontFamily: "'DM Sans', sans-serif", overflowWrap: "anywhere" }}>{auth.user.email}</div>
            </div>
          </button>
        )}

        <button onClick={exportBackup} style={{ width: "100%", padding: "16px", borderRadius: 14, background: "linear-gradient(135deg, #7C3AED22, #A78BFA22)", border: "1px solid #7C3AED44", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <IconBadge name="download" tone="violet" size={24} />
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Exporter mes données</div>
            <div style={{ color: "var(--k-muted-2)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Télécharge un fichier <strong style={{ color: "#A78BFA" }}>.json</strong> avec tous tes projets et PDFs</div>
          </div>
        </button>

        <label style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "16px", borderRadius: 14, background: "linear-gradient(135deg, #05966922, #34D39922)", border: "1px solid #05966944", cursor: importingBackup ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 14, opacity: importingBackup ? 0.78 : 1 }}>
          <IconBadge name="upload" tone="green" size={24} />
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Importer mes données</div>
            <div style={{ color: "var(--k-muted-2)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Charge un fichier <strong style={{ color: "#34D399" }}>.json</strong> pour tout restaurer</div>
          </div>
          {importStatus ? (
            <div style={{ marginLeft: "auto", color: "#34D399", fontSize: 11, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
              {importStatus}
            </div>
          ) : null}
          <input type="file" accept=".json,application/json" disabled={importingBackup} style={{ display: "none" }} onClick={() => setImportStatus(null)} onChange={importBackup} />
        </label>
      </div>
    </div>
  );
}
