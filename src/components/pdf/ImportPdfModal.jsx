import React, { useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import Icon from "../icons/Icon";

export default function ImportPdfModal({ asPage = false, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [pdfData, setPdfData] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [loading, setLoading] = useState(false);
  const [configRangs, setConfigRangs] = useState(false);
  const [totalRangs, setTotalRangs] = useState("");
  const [parties, setParties] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [repetitionDraft, setRepetitionDraft] = useState(null);
  const [partieRepetitions, setPartieRepetitions] = useState([]);
  const [partieRepeatDraft, setPartieRepeatDraft] = useState(null);
  const [colorPickerPartie, setColorPickerPartie] = useState(null);
  const getRandomColorIdx = () => Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length);

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== "application/pdf") return;
    setLoading(true);
    setPdfName(file.name);
    if (!name) setName(file.name.replace(".pdf", ""));
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setPdfData(readerEvent.target.result);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const addPartie = () => setParties((prev) => [...prev, { id: Date.now(), nom: "", rangs: "", colorIdx: getRandomColorIdx(), continuesFromPrevious: false }]);
  const updatePartie = (id, field, value) => setParties((prev) => prev.map((partie) => (partie.id === id ? { ...partie, [field]: value } : partie)));
  const removePartie = (id) => {
    setParties((prev) => prev.filter((partie) => partie.id !== id));
    setRepetitions((prev) => prev.filter((repeat) => String(repeat.partieId) !== String(id)));
    setPartieRepetitions((prev) => prev.filter((repeat) => String(repeat.startPartieId) !== String(id) && String(repeat.endPartieId) !== String(id)));
  };
  const openRepetitionDraft = (repeat = null) => {
    setRepetitionDraft(repeat ? { ...repeat } : { id: `pdf-repeat-${Date.now()}`, partieId: parties[0]?.id || "", startRang: "1", endRang: "1", passages: "2", infinite: false });
  };
  const saveRepetitionDraft = () => {
    if (!repetitionDraft?.partieId) return;
    const start = Math.max(1, parseInt(repetitionDraft.startRang, 10) || 1);
    const end = Math.max(start, parseInt(repetitionDraft.endRang, 10) || start);
    const nextRepeat = {
      ...repetitionDraft,
      startRang: start,
      endRang: end,
      passages: repetitionDraft.infinite ? null : Math.max(2, parseInt(repetitionDraft.passages, 10) || 2),
      infinite: repetitionDraft.infinite === true,
    };
    setRepetitions((prev) => prev.some((repeat) => repeat.id === nextRepeat.id) ? prev.map((repeat) => (repeat.id === nextRepeat.id ? nextRepeat : repeat)) : [...prev, nextRepeat]);
    setRepetitionDraft(null);
  };
  const removeRepetitionDraft = () => {
    if (repetitionDraft?.id) {
      setRepetitions((prev) => prev.filter((repeat) => repeat.id !== repetitionDraft.id));
    }
    setRepetitionDraft(null);
  };
  const openPartieRepeatDraft = (repeat = null) => {
    const firstId = parties[0]?.id || "";
    const secondId = parties[Math.min(1, parties.length - 1)]?.id || firstId;
    setPartieRepeatDraft(repeat ? { ...repeat } : { id: `pdf-partie-repeat-${Date.now()}`, label: "", startPartieId: firstId, endPartieId: secondId, passages: "2", infinite: false });
  };
  const savePartieRepeatDraft = () => {
    if (!partieRepeatDraft?.startPartieId || !partieRepeatDraft?.endPartieId) return;
    const startIndex = parties.findIndex((partie) => String(partie.id) === String(partieRepeatDraft.startPartieId));
    const endIndex = parties.findIndex((partie) => String(partie.id) === String(partieRepeatDraft.endPartieId));
    if (startIndex < 0 || endIndex < startIndex) return;
    const nextRepeat = {
      ...partieRepeatDraft,
      label: (partieRepeatDraft.label || "").trim(),
      passages: partieRepeatDraft.infinite ? null : Math.max(2, parseInt(partieRepeatDraft.passages, 10) || 2),
      infinite: partieRepeatDraft.infinite === true,
    };
    setPartieRepetitions((prev) => prev.some((repeat) => repeat.id === nextRepeat.id) ? prev.map((repeat) => (repeat.id === nextRepeat.id ? nextRepeat : repeat)) : [...prev, nextRepeat]);
    setPartieRepeatDraft(null);
  };
  const removePartieRepeatDraft = () => {
    if (partieRepeatDraft?.id) {
      setPartieRepetitions((prev) => prev.filter((repeat) => repeat.id !== partieRepeatDraft.id));
    }
    setPartieRepeatDraft(null);
  };
  const buildPdfRepetitions = () => repetitions.map((repeat, index) => {
    const partieIndex = Math.max(0, parties.findIndex((partie) => String(partie.id) === String(repeat.partieId)));
    const offset = parties.slice(0, partieIndex).reduce((sum, partie) => sum + (parseInt(partie.rangs, 10) || 0), 0);
    const start = Math.max(1, parseInt(repeat.startRang, 10) || 1);
    const end = Math.max(start, parseInt(repeat.endRang, 10) || start);
    return {
      id: `pdf-repeat-${Date.now()}-${index}`,
      startRang: offset + start,
      endRang: offset + end,
      passages: repeat.infinite ? null : Math.max(2, parseInt(repeat.passages, 10) || 2),
      infinite: repeat.infinite === true,
    };
  });
  const buildPdfPartieRepetitions = () => partieRepetitions
    .map((repeat, index) => ({
      id: repeat.id || `pdf-partie-repeat-${Date.now()}-${index}`,
      label: (repeat.label || "").trim(),
      startPartieId: repeat.startPartieId,
      endPartieId: repeat.endPartieId,
      passages: repeat.infinite ? null : Math.max(2, parseInt(repeat.passages, 10) || 2),
      infinite: repeat.infinite === true,
    }))
    .filter((repeat) => repeat.startPartieId && repeat.endPartieId);
  const totalFromParties = parties.reduce((sum, partie) => sum + (parseInt(partie.rangs) || 0), 0);
  const total = configRangs ? (parties.length > 0 ? totalFromParties : parseInt(totalRangs) || 0) : 0;
  const canCreate = name.trim() && pdfData && !loading;
  const rootStyle = asPage
    ? { minHeight: "100vh", background: "var(--k-bg)", display: "flex", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }
    : { position: "fixed", inset: 0, zIndex: 300, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" };
  const cardStyle = asPage
    ? { background: "var(--k-bg)", width: "100%", maxWidth: 430, minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }
    : { background: "var(--k-surface)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, height: "min(90vh, calc(100vh - env(safe-area-inset-top, 0px) - 14px))", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #0891B244" };
  const headerStyle = asPage
    ? { flexShrink: 0, position: "relative", padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 14px", borderBottom: "1px solid var(--k-border)", background: "var(--k-header-gradient)" }
    : { flexShrink: 0, position: "relative", padding: "16px 20px 14px", borderBottom: "1px solid var(--k-border)" };
  const repeatCardStyle = { display: "grid", gap: 7, marginTop: 10, padding: 9, borderRadius: 12, background: "var(--k-surface)", border: "1px solid var(--k-border)", boxSizing: "border-box", overflow: "hidden" };
  const repeatInputStyle = { width: "100%", minWidth: 0, boxSizing: "border-box", background: "var(--k-field)", border: "1px solid var(--k-border)", borderRadius: 9, padding: "8px 9px", color: "var(--k-text)", fontSize: 14 };
  const repeatButtonStyle = { width: "100%", boxSizing: "border-box", borderRadius: 9, padding: "8px 9px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
  const repeatSectionStyle = { marginTop: 12, padding: 12, borderRadius: 14, background: "var(--k-surface)", border: "1px solid var(--k-border)" };
  const repeatTitleStyle = { color: "#0891B2", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 };

  return (
    <div data-kaleido-modal-backdrop={asPage ? undefined : "true"} data-kaleido-pdf-patron-page={asPage ? "true" : undefined} onClick={asPage ? undefined : onClose} style={rootStyle}>
      <div data-kaleido-modal-card={asPage ? undefined : "true"} onClick={(event) => event.stopPropagation()} style={cardStyle}>
        <div style={headerStyle}>
          {!asPage ? <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 14px" }} /> : null}
          <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: 0, textAlign: "center", padding: asPage ? "0 46px" : 0 }}>Importer un patron PDF</h3>
          <button data-kaleido-back-button={asPage ? "true" : undefined} type="button" onClick={onClose} aria-label={asPage ? "Retour" : "Fermer"} style={asPage ? { position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 8px)", left: 20, width: 36, height: 36, borderRadius: 10, border: "1px solid var(--k-control-border)", background: "var(--k-surface-2)", color: "#A78BFA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } : { position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-muted-fill)", color: "var(--k-text)", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>
            {asPage ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            ) : "x"}
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 20px 20px" }}>

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "#0891B2", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nom du projet</label>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Tuque Noel, Echarpe hiver..." style={{ width: "100%", background: "var(--k-field)", border: "1px solid #0891B244", borderRadius: 10, padding: "12px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "#0891B2", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Fichier PDF</label>
          <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: pdfData ? "rgba(8,145,178,0.15)" : "var(--k-field)", border: `1px dashed ${pdfData ? "#0891B2" : "#0891B244"}`, borderRadius: 10, cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{loading ? <Icon name="settings" size={18} color="#0891B2" style={{ opacity: 0.9 }} /> : pdfData ? <Icon name="checkCircle" size={18} color="#0891B2" /> : <Icon name="file" size={18} color="var(--k-muted-2)" />}</span>
            <div>
              <div style={{ color: pdfData ? "#0891B2" : "var(--k-muted-2)", fontSize: 14, fontWeight: pdfData ? 700 : 500 }}>
                {loading ? "Chargement..." : pdfData ? pdfName : "Appuyer pour choisir un PDF"}
              </div>
              {pdfData ? <div style={{ color: "var(--k-muted-2)", fontSize: 11, marginTop: 2 }}>PDF charge</div> : null}
            </div>
            <input type="file" accept="application/pdf" onChange={handleFile} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ marginBottom: configRangs ? 16 : 24 }}>
          <button onClick={() => setConfigRangs((value) => !value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: configRangs ? "rgba(8,145,178,0.15)" : "var(--k-field)", border: `1px solid ${configRangs ? "#0891B244" : "var(--k-border)"}`, color: configRangs ? "#0891B2" : "var(--k-muted-2)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "'DM Sans', sans-serif" }}>
            <span>{configRangs ? <Icon name="checkCircle" size={16} color="#0891B2" /> : <Icon name="square" size={16} color="var(--k-muted-2)" />}</span>
            <span>Configurer les rangs et parties <span style={{ color: "var(--k-muted-2)", fontSize: 12 }}>(optionnel)</span></span>
          </button>
        </div>

        {configRangs ? (
          <div style={{ marginBottom: 24, padding: 16, background: "var(--k-field)", borderRadius: 14, border: "1px solid #0891B233" }}>
            {parties.length === 0 ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: "#0891B2", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nombre total de rangs</label>
                <input value={totalRangs} onChange={(event) => setTotalRangs(event.target.value)} placeholder="Ex: 120" type="number" style={{ width: "100%", background: "var(--k-surface)", border: "1px solid #0891B244", borderRadius: 10, padding: "11px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
              </div>
            ) : null}

            <div style={repeatSectionStyle}>
            <label style={repeatTitleStyle}>Parties <span style={{ color: "var(--k-muted-2)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
            {parties.map((partie, index) => {
              const color = KALEIDOSCOPE_COLORS[(partie.colorIdx ?? index) % KALEIDOSCOPE_COLORS.length];
              return (
                <div key={partie.id} style={{ display: "grid", gap: 7, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%", minWidth: 0 }}>
                    <button type="button" onClick={() => setColorPickerPartie(partie)} aria-label="Choisir la couleur de la partie" style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, flexShrink: 0, border: "2px solid var(--k-surface)", padding: 0, cursor: "pointer", boxShadow: `0 0 12px ${color.bg}55` }} />
                    <input value={partie.nom} onChange={(event) => updatePartie(partie.id, "nom", event.target.value)} placeholder={`Partie ${index + 1}`} style={{ flex: 1, minWidth: 0, background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 10, padding: "10px 12px", color: "var(--k-text)", fontSize: 15, outline: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                    <input value={partie.rangs} onChange={(event) => updatePartie(partie.id, "rangs", event.target.value)} placeholder="Rangs" type="number" style={{ width: 64, flexShrink: 0, background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 10, padding: "10px 8px", color: "var(--k-text)", fontSize: 15, outline: "none", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                    <button onClick={() => removePartie(partie.id)} style={{ width: 28, height: 28, borderRadius: 6, background: "#DC262633", border: "none", color: "#F87171", fontSize: 18, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>x</button>
                  </div>
                  {index > 0 ? (
                    <button type="button" onClick={() => updatePartie(partie.id, "continuesFromPrevious", !partie.continuesFromPrevious)} style={{ width: "100%", border: `1px solid ${partie.continuesFromPrevious ? color.light : "var(--k-border)"}`, borderRadius: 10, background: partie.continuesFromPrevious ? `${color.bg}22` : "var(--k-muted-fill)", color: partie.continuesFromPrevious ? color.light : "var(--k-muted)", padding: "9px 11px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>Continuer le compteur précédent</span>
                      <span style={{ width: 36, height: 20, borderRadius: 999, background: partie.continuesFromPrevious ? `linear-gradient(135deg, ${color.bg}, ${color.light})` : "var(--k-border-strong)", position: "relative", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 3, left: partie.continuesFromPrevious ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 180ms ease" }} />
                      </span>
                    </button>
                  ) : null}
                </div>
              );
            })}

            {colorPickerPartie ? (
              <div data-kaleido-modal-backdrop="true" onClick={() => setColorPickerPartie(null)} style={{ position: "fixed", inset: 0, zIndex: 360, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div data-kaleido-modal-card="true" onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 300, background: "var(--k-surface)", border: "1px solid #0891B233", borderRadius: 20, padding: 18, boxShadow: "0 18px 60px rgba(0,0,0,0.25)" }}>
                  <h4 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 17, margin: "0 0 6px", textAlign: "center" }}>Couleur de la partie</h4>
                  <div style={{ color: "var(--k-muted-2)", fontSize: 12, textAlign: "center", marginBottom: 16 }}>{colorPickerPartie.nom || "Nouvelle partie"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {KALEIDOSCOPE_COLORS.map((color, index) => (
                      <button key={index} type="button" onClick={() => { updatePartie(colorPickerPartie.id, "colorIdx", index); setColorPickerPartie(null); }} style={{ aspectRatio: "1", borderRadius: "50%", background: `linear-gradient(135deg, ${color.bg}, ${color.light})`, border: (colorPickerPartie.colorIdx ?? 0) === index ? "3px solid var(--k-text)" : "2px solid var(--k-border)", cursor: "pointer", boxShadow: (colorPickerPartie.colorIdx ?? 0) === index ? `0 0 20px ${color.bg}88` : "none" }} />
                    ))}
                  </div>
                  <button type="button" onClick={() => setColorPickerPartie(null)} style={{ width: "100%", marginTop: 18, padding: "11px 14px", borderRadius: 12, border: "1px solid var(--k-border)", background: "none", color: "var(--k-muted)", cursor: "pointer", fontWeight: 700 }}>Annuler</button>
                </div>
              </div>
            ) : null}

            <button onClick={addPartie} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: "1px dashed #0891B244", color: "#0891B2", fontSize: 13, cursor: "pointer", marginTop: 4 }}>+ Ajouter une partie</button>
            </div>
            {parties.length > 0 ? (
              <>
                <div style={{ ...repeatSectionStyle, borderColor: "#7C3AED33" }}>
                <label style={{ ...repeatTitleStyle, color: "#7C3AED" }}>Répétitions de rangs</label>
                <button onClick={() => openRepetitionDraft()} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: "1px dashed #7C3AED55", color: "#7C3AED", fontSize: 13, cursor: "pointer" }}>+ Ajouter une répétition de rangs</button>
                {repetitions.map((repeat) => {
                  const partieIndex = parties.findIndex((partie) => String(partie.id) === String(repeat.partieId));
                  const partieName = parties[partieIndex]?.nom || `Partie ${partieIndex + 1}`;
                  return (
                    <button key={repeat.id} type="button" onClick={() => openRepetitionDraft(repeat)} style={{ ...repeatCardStyle, width: "100%", textAlign: "left", cursor: "pointer" }}>
                      <span style={{ color: "var(--k-text)", fontSize: 13, fontWeight: 900 }}>{partieName}</span>
                      <span style={{ color: "var(--k-muted-2)", fontSize: 12 }}>Rangs {repeat.startRang} → {repeat.endRang} · {repeat.infinite ? "∞" : `${repeat.passages || 2}x`}</span>
                    </button>
                  );
                })}
                </div>
                <div style={{ ...repeatSectionStyle, borderColor: "#16A34A33" }}>
                  <label style={{ ...repeatTitleStyle, color: "#16A34A" }}>Répétitions de parties</label>
                  <button onClick={() => openPartieRepeatDraft()} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: "1px dashed #16A34A55", color: "#16A34A", fontSize: 13, cursor: "pointer" }}>+ Ajouter une répétition de parties</button>
                  {partieRepetitions.map((repeat) => {
                    const startIndex = parties.findIndex((partie) => String(partie.id) === String(repeat.startPartieId));
                    const endIndex = parties.findIndex((partie) => String(partie.id) === String(repeat.endPartieId));
                    const startName = parties[startIndex]?.nom || `Partie ${startIndex + 1}`;
                    const endName = parties[endIndex]?.nom || `Partie ${endIndex + 1}`;
                    return (
                      <button key={repeat.id} type="button" onClick={() => openPartieRepeatDraft(repeat)} style={{ ...repeatCardStyle, width: "100%", textAlign: "left", cursor: "pointer" }}>
                        <span style={{ color: "var(--k-text)", fontSize: 13, fontWeight: 900 }}>{repeat.label || "Répétition de parties"} {repeat.infinite ? "∞" : `${repeat.passages || 2}x`}</span>
                        <span style={{ color: "var(--k-muted-2)", fontSize: 12 }}>{startName} → {endName}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
            {parties.length > 0 ? <div style={{ color: "var(--k-muted-2)", fontSize: 12, textAlign: "center", marginTop: 10 }}>Total : {totalFromParties} rangs</div> : null}
          </div>
        ) : null}

        </div>

        {repetitionDraft ? (
          <div data-kaleido-modal-backdrop="true" onClick={() => setRepetitionDraft(null)} style={{ position: "fixed", inset: 0, zIndex: 370, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div data-kaleido-modal-card="true" onClick={(event) => event.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 340, background: "var(--k-surface)", border: "1px solid #7C3AED44", borderRadius: 20, padding: 18, boxShadow: "0 18px 60px rgba(0,0,0,0.25)" }}>
              <button type="button" onClick={() => setRepetitionDraft(null)} aria-label="Fermer" style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-muted-fill)", color: "var(--k-text)", fontSize: 16, fontWeight: 900, lineHeight: 1, cursor: "pointer" }}>x</button>
              <h4 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 17, margin: "0 0 14px", textAlign: "center" }}>Répétition de rangs</h4>
              <label style={{ ...repeatTitleStyle, color: "#7C3AED", marginBottom: 6 }}>Partie</label>
              <select value={repetitionDraft.partieId} onChange={(event) => setRepetitionDraft((current) => ({ ...current, partieId: event.target.value }))} style={{ ...repeatInputStyle, marginBottom: 10, padding: 12, fontSize: 16 }}>
                {parties.map((partie, index) => <option key={partie.id} value={partie.id}>{partie.nom || `Partie ${index + 1}`}</option>)}
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
                <div>
                  <label style={{ ...repeatTitleStyle, color: "#7C3AED", marginBottom: 6 }}>Début</label>
                  <input type="number" min="1" value={repetitionDraft.startRang} onChange={(event) => setRepetitionDraft((current) => ({ ...current, startRang: event.target.value }))} style={{ ...repeatInputStyle, marginBottom: 10, padding: 12, fontSize: 16 }} />
                </div>
                <div>
                  <label style={{ ...repeatTitleStyle, color: "#7C3AED", marginBottom: 6 }}>Fin</label>
                  <input type="number" min="1" value={repetitionDraft.endRang} onChange={(event) => setRepetitionDraft((current) => ({ ...current, endRang: event.target.value }))} style={{ ...repeatInputStyle, marginBottom: 10, padding: 12, fontSize: 16 }} />
                </div>
              </div>
              <button type="button" onClick={() => setRepetitionDraft((current) => ({ ...current, infinite: !current.infinite }))} style={{ ...repeatButtonStyle, marginBottom: 10, border: `1px solid ${repetitionDraft.infinite ? "#7C3AED" : "var(--k-border)"}`, background: repetitionDraft.infinite ? "rgba(124,58,237,0.16)" : "var(--k-muted-fill)", color: repetitionDraft.infinite ? "#A78BFA" : "var(--k-muted)" }}>Répéter jusqu'à satisfaction</button>
              {!repetitionDraft.infinite ? (
                <>
                  <label style={{ ...repeatTitleStyle, color: "#7C3AED", marginBottom: 6 }}>Nombre de passages total</label>
                  <input type="number" min="2" value={repetitionDraft.passages || "2"} onChange={(event) => setRepetitionDraft((current) => ({ ...current, passages: event.target.value }))} style={{ ...repeatInputStyle, marginBottom: 12, padding: 12, fontSize: 16 }} />
                </>
              ) : null}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={removeRepetitionDraft} style={{ flex: 1, borderRadius: 12, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#F87171", padding: "11px 12px", fontWeight: 800 }}>Retirer</button>
                <button type="button" onClick={saveRepetitionDraft} style={{ flex: 1, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff", padding: "11px 12px", fontWeight: 900 }}>Sauvegarder</button>
              </div>
            </div>
          </div>
        ) : null}

        {partieRepeatDraft ? (
          <div data-kaleido-modal-backdrop="true" onClick={() => setPartieRepeatDraft(null)} style={{ position: "fixed", inset: 0, zIndex: 370, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div data-kaleido-modal-card="true" onClick={(event) => event.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 340, background: "var(--k-surface)", border: "1px solid #16A34A44", borderRadius: 20, padding: 18, boxShadow: "0 18px 60px rgba(0,0,0,0.25)" }}>
              <button type="button" onClick={() => setPartieRepeatDraft(null)} aria-label="Fermer" style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-muted-fill)", color: "var(--k-text)", fontSize: 16, fontWeight: 900, lineHeight: 1, cursor: "pointer" }}>x</button>
              <h4 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 17, margin: "0 0 14px", textAlign: "center" }}>Répétition de parties</h4>
              <label style={{ ...repeatTitleStyle, color: "#16A34A", marginBottom: 6 }}>Nom affiché</label>
              <input type="text" value={partieRepeatDraft.label || ""} onChange={(event) => setPartieRepeatDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Pantoufle, bas..." style={{ ...repeatInputStyle, marginBottom: 10, padding: 12, fontSize: 16 }} />
              <label style={{ ...repeatTitleStyle, color: "#16A34A", marginBottom: 6 }}>À partir de la partie</label>
              <select value={partieRepeatDraft.startPartieId} onChange={(event) => {
                const startPartieId = event.target.value;
                const startIndex = parties.findIndex((partie) => String(partie.id) === String(startPartieId));
                const currentEndIndex = parties.findIndex((partie) => String(partie.id) === String(partieRepeatDraft.endPartieId));
                setPartieRepeatDraft((current) => ({ ...current, startPartieId, endPartieId: currentEndIndex >= startIndex ? current.endPartieId : startPartieId }));
              }} style={{ ...repeatInputStyle, marginBottom: 10, padding: 12, fontSize: 16 }}>
                {parties.map((partie, index) => <option key={partie.id} value={partie.id}>{partie.nom || `Partie ${index + 1}`}</option>)}
              </select>
              <label style={{ ...repeatTitleStyle, color: "#16A34A", marginBottom: 6 }}>Jusqu'à la partie</label>
              <select value={partieRepeatDraft.endPartieId} onChange={(event) => setPartieRepeatDraft((current) => ({ ...current, endPartieId: event.target.value }))} style={{ ...repeatInputStyle, marginBottom: 10, padding: 12, fontSize: 16 }}>
                {parties.map((partie, index) => {
                  const startIndex = parties.findIndex((item) => String(item.id) === String(partieRepeatDraft.startPartieId));
                  if (index < startIndex) return null;
                  return <option key={partie.id} value={partie.id}>{partie.nom || `Partie ${index + 1}`}</option>;
                })}
              </select>
              <button type="button" onClick={() => setPartieRepeatDraft((current) => ({ ...current, infinite: !current.infinite }))} style={{ ...repeatButtonStyle, marginBottom: 10, border: `1px solid ${partieRepeatDraft.infinite ? "#16A34A" : "var(--k-border)"}`, background: partieRepeatDraft.infinite ? "rgba(22,163,74,0.16)" : "var(--k-muted-fill)", color: partieRepeatDraft.infinite ? "#22C55E" : "var(--k-muted)" }}>Répéter jusqu'à satisfaction</button>
              {!partieRepeatDraft.infinite ? (
                <>
                  <label style={{ ...repeatTitleStyle, color: "#16A34A", marginBottom: 6 }}>Nombre de passages total</label>
                  <input type="number" min="2" value={partieRepeatDraft.passages || "2"} onChange={(event) => setPartieRepeatDraft((current) => ({ ...current, passages: event.target.value }))} style={{ ...repeatInputStyle, marginBottom: 12, padding: 12, fontSize: 16 }} />
                </>
              ) : null}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={removePartieRepeatDraft} style={{ flex: 1, borderRadius: 12, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#F87171", padding: "11px 12px", fontWeight: 800 }}>Retirer</button>
                <button type="button" onClick={savePartieRepeatDraft} style={{ flex: 1, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", padding: "11px 12px", fontWeight: 900 }}>Sauvegarder</button>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ flexShrink: 0, display: "flex", gap: 12, padding: "12px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)", borderTop: "1px solid var(--k-border)", background: "var(--k-surface)" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid var(--k-border)", background: "none", color: "var(--k-muted)", fontSize: 14, cursor: "pointer" }}>Annuler</button>
          <button onClick={() => canCreate && onCreate(name.trim(), pdfData, total, parties, buildPdfRepetitions(), buildPdfPartieRepetitions())} disabled={!canCreate} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: canCreate ? "linear-gradient(135deg, #0891B2, #22D3EE)" : "var(--k-border-strong)", color: canCreate ? "#fff" : "var(--k-muted-2)", fontSize: 14, fontWeight: 700, cursor: canCreate ? "pointer" : "not-allowed" }}>
            Creer la bulle
          </button>
        </div>
      </div>
    </div>
  );
}
