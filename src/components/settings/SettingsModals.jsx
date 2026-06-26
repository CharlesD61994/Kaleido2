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
  const themeMode = getThemeMode(database);

  if (!showSettingsModal) return null;

  const exportBackup = async () => {
    try {
      const allProjects = [...(database.projectsPersonal || []), ...(database.projectsPro || [])];
      const pdfProjects = allProjects.filter((project) => project.projectType === "pdf" && project.pdfId);
      const patronPdfs = (database.patrons || []).filter((patron) => patron.projectType === "pdf" && patron.pdfId);
      const pdfs = {};

      for (const project of [...pdfProjects, ...patronPdfs]) {
        const data = await loadPdf(project.pdfId);
        if (data) pdfs[project.pdfId] = data;
      }

      const imageIds = new Set();
      const collectImageId = (item) => {
        const imageId = item?.image?.imageId;
        if (imageId) imageIds.add(imageId);
      };
      [...allProjects, ...(database.patrons || [])].forEach(collectImageId);

      const images = {};
      for (const imageId of imageIds) {
        const imageData = await loadImage(imageId);
        if (imageData) images[imageId] = imageData;
      }

      const fullExport = JSON.stringify({ ...database, pdfs, images });
      const blob = new Blob([fullExport], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kaleido-backup-${new Date().toISOString().split("T")[0]}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erreur export : " + error.message);
    }
  };

  const importBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const sourceDb = data?.database && typeof data.database === "object" ? data.database : data;

      const pdfsToRestore = data?.pdfs || sourceDb?.pdfs || {};
      for (const [pdfId, pdfData] of Object.entries(pdfsToRestore)) {
        if (pdfId && typeof pdfData === "string") await savePdf(pdfId, pdfData);
      }

      const imagesToRestore = data?.images || sourceDb?.images || {};
      for (const [imageId, imageData] of Object.entries(imagesToRestore)) {
        if (imageId && typeof imageData === "string") await saveImage(imageId, imageData);
      }

      const restoredDb = importDatabase(data);
      onRestoreDatabase(restoredDb);
      event.target.value = "";
      alert("Données restaurées avec succès !");
    } catch (error) {
      alert("Erreur import : " + (error?.message || "fichier invalide"));
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

        <label style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "16px", borderRadius: 14, background: "linear-gradient(135deg, #05966922, #34D39922)", border: "1px solid #05966944", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
          <IconBadge name="upload" tone="green" size={24} />
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "var(--k-text)", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Importer mes données</div>
            <div style={{ color: "var(--k-muted-2)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Charge un fichier <strong style={{ color: "#34D399" }}>.json</strong> pour tout restaurer</div>
          </div>
          <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={importBackup} />
        </label>
      </div>
    </div>
  );
}
