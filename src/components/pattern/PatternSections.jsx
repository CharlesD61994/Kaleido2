import React, { useEffect, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import RangItem from "./RangItem";

export function PartieSection({
  partie,
  allParties = [],
  partieIndex = 0,
  partieRepeatMeta = null,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onAddRang,
  onUpdateRang,
  onDeleteRang,
  onDuplicateRang,
  onMoveRangUp,
  onMoveRangDown,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingNom, setIsEditingNom] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempNom, setTempNom] = useState(partie.nom);
  const [displayNom, setDisplayNom] = useState(partie.nom || "Nouvelle partie");
  const [repeatDraft, setRepeatDraft] = useState(null);
  const [partieRepeatDraft, setPartieRepeatDraft] = useState(null);
  const color = KALEIDOSCOPE_COLORS[partie.colorIdx % KALEIDOSCOPE_COLORS.length];
  const partieRepeatColor = partieRepeatMeta ? KALEIDOSCOPE_COLORS[(partieRepeatMeta.colorIdx ?? partie.colorIdx) % KALEIDOSCOPE_COLORS.length] : color;

  useEffect(() => {
    const syncedNom = partie.nom || "Nouvelle partie";
    setTempNom(syncedNom);
    setDisplayNom(syncedNom);
  }, [partie.nom]);

  const handleSaveNom = () => {
    const cleanNom = (tempNom || "").trim();
    const finalNom = cleanNom || "Nouvelle partie";
    setTempNom(finalNom);
    setDisplayNom(finalNom);
    onUpdate(partie.id, { nom: finalNom });
    setIsEditingNom(false);
  };

  const handleStartEditNom = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setTempNom(displayNom || partie.nom || "Nouvelle partie");
    setIsEditingNom(true);
  };

  const act = (event, fn) => {
    event.preventDefault();
    event.stopPropagation();
    fn();
  };

  const countableRangs = partie.rangs.filter((rang) => !rang.isNote);
  const countableIndexById = new Map(countableRangs.map((rang, index) => [rang.id, index]));
  const repeatMetaById = new Map();

  countableRangs.forEach((startRang, startIndex) => {
    const repeat = startRang.repeat;
    if (!repeat?.endRangId) return;
    const endIndex = countableIndexById.get(repeat.endRangId);
    if (!Number.isInteger(endIndex) || endIndex < startIndex) return;
    for (let index = startIndex; index <= endIndex; index += 1) {
      const rang = countableRangs[index];
      repeatMetaById.set(rang.id, {
        color: color.bg,
        infinite: repeat.infinite === true,
        isEnd: index === endIndex,
        isStart: index === startIndex,
        passages: repeat.passages,
      });
    }
  });

  const openRepeatDraft = (rangId) => {
    const startIndex = countableRangs.findIndex((rang) => rang.id === rangId);
    if (startIndex < 0) return;
    const startRang = countableRangs[startIndex];
    const existing = startRang.repeat || {};
    const endRangId = existing.endRangId && countableRangs.some((rang) => rang.id === existing.endRangId)
      ? existing.endRangId
      : (countableRangs[Math.min(countableRangs.length - 1, startIndex + 1)]?.id || startRang.id);
    setRepeatDraft({
      startRangId: rangId,
      startIndex,
      endRangId,
      passages: Math.max(2, Number(existing.passages) || 2),
      infinite: existing.infinite === true,
    });
  };

  const saveRepeatDraft = () => {
    if (!repeatDraft?.startRangId) return;
    onUpdateRang(partie.id, repeatDraft.startRangId, {
      repeat: {
        id: `repeat-${repeatDraft.startRangId}`,
        endRangId: repeatDraft.endRangId,
        passages: repeatDraft.infinite ? null : Math.max(2, Number(repeatDraft.passages) || 2),
        infinite: repeatDraft.infinite === true,
      },
    });
    setRepeatDraft(null);
  };

  const deleteRepeatDraft = () => {
    if (!repeatDraft?.startRangId) return;
    onUpdateRang(partie.id, repeatDraft.startRangId, { repeat: null });
    setRepeatDraft(null);
  };

  const openPartieRepeatDraft = () => {
    const existing = partie.partieRepeat || {};
    const endPartieId = existing.endPartieId && allParties.some((item) => String(item.id) === String(existing.endPartieId))
      ? existing.endPartieId
      : (allParties[Math.min(allParties.length - 1, partieIndex + 1)]?.id || partie.id);
    setPartieRepeatDraft({
      label: existing.label || "",
      endPartieId,
      infinite: existing.infinite === true,
      passages: Math.max(2, Number(existing.passages) || 2),
    });
  };

  const savePartieRepeatDraft = () => {
    if (!partieRepeatDraft?.endPartieId) return;
    onUpdate(partie.id, {
      partieRepeat: {
        id: `partie-repeat-${partie.id}`,
        label: (partieRepeatDraft.label || "").trim(),
        endPartieId: partieRepeatDraft.endPartieId,
        passages: partieRepeatDraft.infinite ? null : Math.max(2, Number(partieRepeatDraft.passages) || 2),
        infinite: partieRepeatDraft.infinite === true,
      },
    });
    setPartieRepeatDraft(null);
  };

  const deletePartieRepeatDraft = () => {
    onUpdate(partie.id, { partieRepeat: null });
    setPartieRepeatDraft(null);
  };

  const actionButton = ({ label, disabled = false, onClick, background = color.bg, title }) => (
    <button
      type="button"
      title={title}
      onClick={(event) => act(event, onClick)}
      disabled={disabled}
      style={{
        background: disabled ? "var(--k-muted-fill)" : background,
        border: "none",
        borderRadius: 7,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: disabled ? "var(--k-muted)" : "#fff",
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        fontWeight: 900,
      }}
    >
      {label}
    </button>
  );

  const repeatLabel = partieRepeatMeta?.label?.trim();
  const repeatBadgeText = partieRepeatMeta
    ? `${repeatLabel ? `${repeatLabel} ` : ""}${partieRepeatMeta.infinite ? "∞" : `${partieRepeatMeta.passages || 2}x`}`
    : "";

  return (
    <div style={{ background: partieRepeatMeta ? `color-mix(in srgb, ${partieRepeatColor.bg} 8%, var(--k-surface))` : "var(--k-surface)", border: partieRepeatMeta ? `1px solid ${partieRepeatColor.bg}66` : `1px solid ${color.light}22`, borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: partieRepeatMeta ? `inset 3px 0 0 ${partieRepeatColor.bg}, 0 0 0 1px ${partieRepeatColor.bg}10` : "none" }}>
      <div style={{ display: "grid", gap: 8, marginBottom: isCollapsed ? 0 : 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative", flexShrink: 0, width: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              onClick={() => setShowColorPicker((current) => !current)}
              style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, cursor: "pointer", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}
            />
            {showColorPicker && (
              <>
                <div onClick={(event) => { event.stopPropagation(); setShowColorPicker(false); }} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
                <div onClick={(event) => event.stopPropagation()} style={{ position: "absolute", top: 30, left: 0, zIndex: 51, background: "var(--k-surface)", border: `1px solid ${color.light}44`, borderRadius: 14, padding: 10, display: "flex", flexWrap: "wrap", gap: 8, width: 152, boxShadow: "0 8px 24px rgba(0,0,0,0.24)" }}>
                  {KALEIDOSCOPE_COLORS.map((optionColor, index) => (
                    <div
                      key={optionColor.bg}
                      onClick={() => { onUpdate(partie.id, { colorIdx: index }); setShowColorPicker(false); }}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${optionColor.bg}, ${optionColor.light})`, cursor: "pointer", border: partie.colorIdx === index ? "3px solid #fff" : "2px solid transparent", boxSizing: "border-box" }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
              {isEditingNom ? (
                <input
                  value={tempNom}
                  onChange={(event) => { const nextNom = event.target.value; setTempNom(nextNom); setDisplayNom(nextNom || "Nouvelle partie"); }}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === "Enter") handleSaveNom();
                    if (event.key === "Escape") {
                      const fallbackNom = partie.nom || "Nouvelle partie";
                      setTempNom(fallbackNom);
                      setDisplayNom(fallbackNom);
                      setIsEditingNom(false);
                    }
                  }}
                  onBlur={handleSaveNom}
                  onClick={(event) => event.stopPropagation()}
                  onFocus={(event) => { event.stopPropagation(); event.target.select(); }}
                  autoFocus
                  style={{ background: "none", border: "none", outline: "none", color: "var(--k-text)", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textAlign: "center", width: "100%" }}
                />
              ) : (
                <h3 onClick={handleStartEditNom} style={{ color: "var(--k-text)", margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", textAlign: "center", lineHeight: 1.15, wordBreak: "normal", overflowWrap: "normal", textWrap: "balance", maxWidth: "100%" }}>
                  {displayNom}
                </h3>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <span style={{ color: "var(--k-text)", fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{countableRangs.length}</span>
              <span style={{ color: color.light, fontSize: 10, fontFamily: "monospace" }}>rangs</span>
            </div>
          </div>

          <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: "none", border: "none", color: color.light, fontSize: 14, cursor: "pointer", padding: 2, flexShrink: 0 }}>
            {isCollapsed ? "▼" : "▲"}
          </button>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {actionButton({ label: "↑", disabled: isFirst, onClick: () => onMoveUp(partie.id), title: "Monter" })}
            {actionButton({ label: "↓", disabled: isLast, onClick: () => onMoveDown(partie.id), title: "Descendre" })}
            {actionButton({ label: "⧉", onClick: () => onDuplicate(partie.id), title: "Dupliquer" })}
            {actionButton({ label: "↻", onClick: openPartieRepeatDraft, background: partie.partieRepeat ? "#16A34A" : color.bg, title: "Répétition de parties" })}
            {actionButton({ label: "×", onClick: () => onDelete(partie.id), background: "#DC2626", title: "Supprimer" })}
          </div>
        </div>

        {partieRepeatMeta ? (
          <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 0 }}>
            <span style={{ maxWidth: "calc(100% - 46px)", borderRadius: 999, border: `1px solid ${partieRepeatColor.bg}55`, background: `color-mix(in srgb, ${partieRepeatColor.bg} 14%, var(--k-surface))`, color: partieRepeatColor.bg, fontSize: 10, fontWeight: 900, fontFamily: "'DM Sans', sans-serif", padding: "3px 8px", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ↻ {repeatBadgeText}
            </span>
          </div>
        ) : null}
      </div>

      {!isCollapsed && (
        <>
          {!isFirst && (
            <button
              type="button"
              onClick={(event) => act(event, () => onUpdate(partie.id, { continuesFromPrevious: !partie.continuesFromPrevious }))}
              style={{ width: "100%", border: `1px solid ${partie.continuesFromPrevious ? color.light : "var(--k-border)"}`, borderRadius: 10, background: partie.continuesFromPrevious ? `${color.bg}22` : "var(--k-muted-fill)", color: partie.continuesFromPrevious ? color.light : "var(--k-muted)", padding: "9px 11px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              <span style={{ fontSize: 12, fontWeight: 800 }}>Continuer le compteur précédent</span>
              <span style={{ width: 36, height: 20, borderRadius: 999, background: partie.continuesFromPrevious ? `linear-gradient(135deg, ${color.bg}, ${color.light})` : "var(--k-border-strong)", position: "relative", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 3, left: partie.continuesFromPrevious ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 180ms ease" }} />
              </span>
            </button>
          )}
          <div style={{ color: "#666", fontSize: 11, marginBottom: 12, fontStyle: "italic", textAlign: "center", padding: "6px 12px", background: `${color.bg}11`, borderRadius: 6, border: `1px dashed ${color.light}22` }}>
            Swipe vers la gauche sur les rangs pour dupliquer ⧉ et supprimer ×
          </div>
          <div style={{ marginBottom: 12 }}>
            {(() => {
              let rangCounter = 0;
              return partie.rangs.map((rang, index) => {
                const isNote = rang.isNote === true;
                const displayIndex = isNote ? -1 : rangCounter++;
                return (
                  <RangItem
                    key={rang.id}
                    rang={rang}
                    rangIndex={displayIndex}
                    onUpdate={(rangId, updates) => onUpdateRang(partie.id, rangId, updates)}
                    onDelete={(rangId) => onDeleteRang(partie.id, rangId)}
                    onDuplicate={(rangId) => onDuplicateRang(partie.id, rangId)}
                    onMoveUp={(rangId) => onMoveRangUp(partie.id, rangId)}
                    onMoveDown={(rangId) => onMoveRangDown(partie.id, rangId)}
                    onCreateRepeat={openRepeatDraft}
                    repeatMeta={!isNote ? repeatMetaById.get(rang.id) : null}
                    isFirst={index === 0}
                    isLast={index === partie.rangs.length - 1}
                  />
                );
              });
            })()}
          </div>
          <button onClick={() => onAddRang(partie.id)} style={{ width: "100%", padding: "12px", borderRadius: 12, background: `${color.bg}22`, border: `1px dashed ${color.light}44`, color: color.light, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            + Ajouter un rang
          </button>
        </>
      )}

      {repeatDraft && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,0.58)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setRepeatDraft(null)}>
          <div style={{ position: "relative", width: "100%", maxWidth: 360, background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 18, padding: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.38)" }} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setRepeatDraft(null)} aria-label="Fermer" style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-muted-fill)", color: "var(--k-text)", fontSize: 16, fontWeight: 900, lineHeight: 1, cursor: "pointer" }}>x</button>
            <h3 style={{ margin: "0 0 12px", color: "var(--k-text)", fontSize: 18, fontFamily: "'Syne', sans-serif" }}>Répétition de rangs</h3>
            <label style={{ display: "grid", gap: 6, color: "var(--k-muted)", fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
              Jusqu'au rang
              <select value={repeatDraft.endRangId} onChange={(event) => setRepeatDraft((current) => ({ ...current, endRangId: event.target.value }))} style={{ width: "100%", border: "1px solid var(--k-border)", borderRadius: 12, background: "var(--k-field)", color: "var(--k-text)", padding: 12, fontSize: 16 }}>
                {countableRangs.slice(repeatDraft.startIndex).map((rang, index) => (
                  <option key={rang.id} value={rang.id}>Rang {repeatDraft.startIndex + index + 1}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => setRepeatDraft((current) => ({ ...current, infinite: !current.infinite }))} style={{ width: "100%", border: `1px solid ${repeatDraft.infinite ? color.light : "var(--k-border)"}`, borderRadius: 12, background: repeatDraft.infinite ? `${color.bg}22` : "var(--k-muted-fill)", color: repeatDraft.infinite ? color.light : "var(--k-text)", padding: "11px 12px", fontWeight: 900, marginBottom: 12 }}>
              Répéter jusqu'à satisfaction
            </button>
            {!repeatDraft.infinite && (
              <label style={{ display: "grid", gap: 6, color: "var(--k-muted)", fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
                Nombre de passages total
                <input type="number" min="2" value={repeatDraft.passages} onChange={(event) => setRepeatDraft((current) => ({ ...current, passages: event.target.value }))} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", border: "1px solid var(--k-border)", borderRadius: 12, background: "var(--k-field)", color: "var(--k-text)", padding: 12, fontSize: 16 }} />
              </label>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={deleteRepeatDraft} style={{ border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, background: "rgba(239,68,68,0.14)", color: "#F87171", padding: "11px 12px", fontWeight: 900 }}>Retirer</button>
              <button type="button" onClick={saveRepeatDraft} style={{ border: "none", borderRadius: 12, background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, color: "#fff", padding: "11px 12px", fontWeight: 900 }}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {partieRepeatDraft && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,0.58)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPartieRepeatDraft(null)}>
          <div style={{ position: "relative", width: "100%", maxWidth: 360, background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 18, padding: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.38)" }} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setPartieRepeatDraft(null)} aria-label="Fermer" style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-muted-fill)", color: "var(--k-text)", fontSize: 16, fontWeight: 900, lineHeight: 1, cursor: "pointer" }}>x</button>
            <h3 style={{ margin: "0 0 12px", color: "var(--k-text)", fontSize: 18, fontFamily: "'Syne', sans-serif" }}>Répétition de parties</h3>
            <label style={{ display: "grid", gap: 6, color: "var(--k-muted)", fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
              Nom affiché
              <input type="text" value={partieRepeatDraft.label || ""} onChange={(event) => setPartieRepeatDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Pantoufle, bas..." style={{ width: "100%", minWidth: 0, boxSizing: "border-box", border: "1px solid var(--k-border)", borderRadius: 12, background: "var(--k-field)", color: "var(--k-text)", padding: 12, fontSize: 16 }} />
            </label>
            <label style={{ display: "grid", gap: 6, color: "var(--k-muted)", fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
              Jusqu'à la partie
              <select value={partieRepeatDraft.endPartieId} onChange={(event) => setPartieRepeatDraft((current) => ({ ...current, endPartieId: event.target.value }))} style={{ width: "100%", border: "1px solid var(--k-border)", borderRadius: 12, background: "var(--k-field)", color: "var(--k-text)", padding: 12, fontSize: 16 }}>
                {allParties.slice(partieIndex).map((optionPartie, index) => (
                  <option key={optionPartie.id} value={optionPartie.id}>{optionPartie.nom || `Partie ${partieIndex + index + 1}`}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => setPartieRepeatDraft((current) => ({ ...current, infinite: !current.infinite }))} style={{ width: "100%", border: `1px solid ${partieRepeatDraft.infinite ? color.light : "var(--k-border)"}`, borderRadius: 12, background: partieRepeatDraft.infinite ? `${color.bg}22` : "var(--k-muted-fill)", color: partieRepeatDraft.infinite ? color.light : "var(--k-text)", padding: "11px 12px", fontWeight: 900, marginBottom: 12 }}>
              Répéter jusqu'à satisfaction
            </button>
            {!partieRepeatDraft.infinite && (
              <label style={{ display: "grid", gap: 6, color: "var(--k-muted)", fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
                Nombre de passages total
                <input type="number" min="2" value={partieRepeatDraft.passages} onChange={(event) => setPartieRepeatDraft((current) => ({ ...current, passages: event.target.value }))} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", border: "1px solid var(--k-border)", borderRadius: 12, background: "var(--k-field)", color: "var(--k-text)", padding: 12, fontSize: 16 }} />
              </label>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={deletePartieRepeatDraft} style={{ border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, background: "rgba(239,68,68,0.14)", color: "#F87171", padding: "11px 12px", fontWeight: 900 }}>Retirer</button>
              <button type="button" onClick={savePartieRepeatDraft} style={{ border: "none", borderRadius: 12, background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, color: "#fff", padding: "11px 12px", fontWeight: 900 }}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
