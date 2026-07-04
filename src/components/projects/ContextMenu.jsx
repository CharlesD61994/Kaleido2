import { useState } from "react";
import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function ContextMenu({
  project,
  position,
  onClose,
  onRename,
  onDelete,
  onChangePhoto,
  onChangeColor,
  onEditClient,
  onComplete,
  onRestore,
  folders = [],
  onMoveToFolder,
  onRemoveFromFolder,
  folderSectionLabel = "la section",
}) {
  const [showColors, setShowColors] = useState(false);
  const [showFolders, setShowFolders] = useState(false);

  if (!project) return null;

  const color = KALEIDOSCOPE_COLORS[project.colorIdx % KALEIDOSCOPE_COLORS.length];
  const isCompleted = project?.status === "termine";
  const menuIconColor = "var(--k-text-soft)";
  const availableFolders = folders.filter((folder) => folder.id !== project.folderId);

  const actions = isCompleted ? [
    { icon: <Icon name="edit" size={21} color="currentColor" />, label: "Renommer", action: onRename },
    onRestore ? { icon: <Icon name="undo" size={21} color="#86EFAC" />, label: "Ramener en cours", action: onRestore } : null,
    project.folderId && onRemoveFromFolder ? { icon: <Icon name="folder" size={21} color="currentColor" />, label: `Ramener dans ${folderSectionLabel}`, action: onRemoveFromFolder } : null,
  ].filter(Boolean) : [
    { icon: <Icon name="edit" size={21} color="currentColor" />, label: "Renommer", action: onRename },
    onEditClient ? { icon: <Icon name="projects" size={21} color="currentColor" />, label: "Modifier la fiche client", action: onEditClient } : null,
    onChangePhoto ? { icon: <Icon name="image" size={21} color="currentColor" />, label: "Changer la photo", action: onChangePhoto } : null,
    project.folderId && onRemoveFromFolder ? { icon: <Icon name="folder" size={21} color="currentColor" />, label: `Ramener dans ${folderSectionLabel}`, action: onRemoveFromFolder } : null,
    onComplete && !isCompleted ? { icon: <Icon name="checkBadge" size={21} color="#86EFAC" />, label: "Terminé", action: onComplete } : null,
  ].filter(Boolean);

  const menuTop = Math.max(90, Math.min(position.y, window.innerHeight - (onEditClient ? 430 : 300)));

  return (
    <>
      <div onClick={(event) => { event.stopPropagation(); onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
      <div style={{ position: "fixed", top: menuTop, left: Math.min(position.x - 10, window.innerWidth - 220), zIndex: 101, background: "var(--k-surface)", border: `1px solid ${color.light}44`, borderRadius: 16, padding: "8px 0", minWidth: 220, maxHeight: "min(72vh, 460px)", overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 8px 40px rgba(0,0,0,0.24)" }}>
        <div style={{ padding: "8px 16px 6px", borderBottom: `1px solid ${color.light}22`, marginBottom: 4 }}>
          <div style={{ color: color.light, fontSize: 11, fontFamily: "monospace", textTransform: "uppercase" }}>{project.name}</div>
        </div>

        {actions.map((item) => (
          <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: menuIconColor, fontSize: 14, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
            <span>{item.icon}</span><span>{item.label}</span>
          </button>
        ))}

        {!isCompleted && availableFolders.length > 0 && onMoveToFolder && (
          <>
            <button onClick={() => setShowFolders((value) => !value)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: menuIconColor, fontSize: 14, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
              <span><Icon name="folder" size={21} color="currentColor" /></span><span>Déplacer vers un dossier</span>
            </button>
            {showFolders && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 10px 8px 42px" }}>
                {availableFolders.map((folder) => {
                  const folderColor = KALEIDOSCOPE_COLORS[folder.colorIdx % KALEIDOSCOPE_COLORS.length];
                  return (
                    <button key={folder.id} onClick={() => { onMoveToFolder(folder.id); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid var(--k-border)", background: "var(--k-surface-2)", color: "var(--k-text)", cursor: "pointer", fontSize: 13, fontWeight: 700, textAlign: "left" }}>
                      <Icon name="folder" size={17} color={folderColor?.light || "#A78BFA"} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folder.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!isCompleted && onChangeColor && (
          <>
            <button onClick={() => setShowColors((value) => !value)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: menuIconColor, fontSize: 14, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, flexShrink: 0 }} />
              <span>Couleur de la bulle</span>
            </button>
            {showColors && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 16px 10px" }}>
                {KALEIDOSCOPE_COLORS.map((colorOption, index) => (
                  <div
                    key={index}
                    onClick={() => { onChangeColor(index); onClose(); }}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${colorOption.bg}, ${colorOption.light})`, cursor: "pointer", border: project.colorIdx === index ? "3px solid #fff" : "2px solid transparent", boxSizing: "border-box" }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {onDelete && (
          <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: "#F87171", fontSize: 14, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
            <span><Icon name="trash" size={21} color="#F87171" /></span><span>Supprimer</span>
          </button>
        )}
      </div>
    </>
  );
}
