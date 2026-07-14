import React, { useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import Icon from "../icons/Icon";

export default function EditPdfPatronModal({ asPage = false, patron, onClose, onSave }) {
  const [name, setName] = useState(patron.name || "");
  const [configRangs, setConfigRangs] = useState((patron.pdfParties || []).length > 0 || (patron.total || 0) > 0);
  const [totalRangs, setTotalRangs] = useState(String(patron.total || ""));
  const [parties, setParties] = useState((patron.pdfParties || []).map((partie, index) => ({
    id: partie.id,
    nom: partie.nom,
    rangs: String(partie.totalRangs),
    colorIdx: Number.isInteger(partie.colorIdx) ? partie.colorIdx : index % KALEIDOSCOPE_COLORS.length,
    continuesFromPrevious: index > 0 && partie.continuesFromPrevious === true,
  })));
  const [repetitions, setRepetitions] = useState(patron.pdfRepetitions || []);
  const [colorPickerPartie, setColorPickerPartie] = useState(null);
  const getRandomColorIdx = () => Math.floor(Math.random() * KALEIDOSCOPE_COLORS.length);

  const addPartie = () => setParties((prev) => [...prev, { id: Date.now(), nom: "", rangs: "", colorIdx: getRandomColorIdx(), continuesFromPrevious: false }]);
  const updatePartie = (id, field, value) => setParties((prev) => prev.map((partie) => (partie.id === id ? { ...partie, [field]: value } : partie)));
  const removePartie = (id) => setParties((prev) => prev.filter((partie) => partie.id !== id));
  const addRepetition = () => setRepetitions((prev) => [...prev, { id: `pdf-repeat-${Date.now()}`, startRang: 1, endRang: 1, passages: 2, infinite: false }]);
  const updateRepetition = (id, field, value) => setRepetitions((prev) => prev.map((repeat) => (repeat.id === id ? { ...repeat, [field]: value } : repeat)));
  const removeRepetition = (id) => setRepetitions((prev) => prev.filter((repeat) => repeat.id !== id));
  const totalFromParties = parties.reduce((sum, partie) => sum + (parseInt(partie.rangs) || 0), 0);
  const total = configRangs ? (parties.length > 0 ? totalFromParties : parseInt(totalRangs) || 0) : 0;
  const rootStyle = asPage
    ? { minHeight: "100vh", background: "var(--k-bg)", display: "flex", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }
    : { position: "fixed", inset: 0, zIndex: 300, background: "var(--k-modal-backdrop)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" };
  const cardStyle = asPage
    ? { background: "var(--k-bg)", width: "100%", maxWidth: 430, minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }
    : { background: "var(--k-surface)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, height: "min(90vh, calc(100vh - env(safe-area-inset-top, 0px) - 14px))", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #0891B244" };
  const headerStyle = asPage
    ? { flexShrink: 0, position: "relative", padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 14px", borderBottom: "1px solid var(--k-border)", background: "var(--k-header-gradient)" }
    : { flexShrink: 0, position: "relative", padding: "16px 20px 14px", borderBottom: "1px solid var(--k-border)" };

  const handleSave = () => {
    const pdfParties = parties
      .filter((partie) => partie.nom.trim())
      .map((partie, index) => ({
        id: index + 1,
        nom: partie.nom.trim(),
        totalRangs: parseInt(partie.rangs) || 0,
        colorIdx: Number.isInteger(partie.colorIdx) ? partie.colorIdx : index % KALEIDOSCOPE_COLORS.length,
        continuesFromPrevious: index > 0 && partie.continuesFromPrevious === true,
      }));
    onSave({ name: name.trim(), total, pdfParties, pdfRepetitions: repetitions.map((repeat, index) => ({
      id: repeat.id || `pdf-repeat-${Date.now()}-${index}`,
      startRang: Math.max(1, parseInt(repeat.startRang, 10) || 1),
      endRang: Math.max(Math.max(1, parseInt(repeat.startRang, 10) || 1), parseInt(repeat.endRang, 10) || 1),
      passages: repeat.infinite ? null : Math.max(2, parseInt(repeat.passages, 10) || 2),
      infinite: repeat.infinite === true,
    })) });
  };

  return (
    <div data-kaleido-modal-backdrop={asPage ? undefined : "true"} data-kaleido-pdf-patron-page={asPage ? "true" : undefined} onClick={asPage ? undefined : onClose} style={rootStyle}>
      <div data-kaleido-modal-card={asPage ? undefined : "true"} onClick={(event) => event.stopPropagation()} style={cardStyle}>
        <div style={headerStyle}>
          {!asPage ? <div style={{ width: 36, height: 4, background: "var(--k-border-strong)", borderRadius: 2, margin: "0 auto 14px" }} /> : null}
          <h3 style={{ color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 18, margin: 0, textAlign: "center", padding: asPage ? "0 46px" : 0 }}>Modifier le patron PDF</h3>
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
          <label style={{ color: "#0891B2", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nom du patron</label>
          <input value={name} onChange={(event) => setName(event.target.value)} style={{ width: "100%", background: "var(--k-field)", border: "1px solid #0891B244", borderRadius: 10, padding: "12px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
        </div>

        <button onClick={() => setConfigRangs((value) => !value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: configRangs ? "rgba(8,145,178,0.15)" : "var(--k-field)", border: `1px solid ${configRangs ? "#0891B244" : "var(--k-border)"}`, color: configRangs ? "#0891B2" : "var(--k-muted-2)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: configRangs ? 16 : 24 }}>
          <span>{configRangs ? <Icon name="checkCircle" size={16} color="#0891B2" /> : <Icon name="square" size={16} color="var(--k-muted-2)" />}</span>
          <span>Configurer les rangs et parties</span>
        </button>

        {configRangs ? (
          <div style={{ marginBottom: 24, padding: 16, background: "var(--k-field)", borderRadius: 14, border: "1px solid #0891B233" }}>
            {parties.length === 0 ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: "#0891B2", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nombre total de rangs</label>
                <input value={totalRangs} onChange={(event) => setTotalRangs(event.target.value)} type="number" style={{ width: "100%", background: "var(--k-surface)", border: "1px solid #0891B244", borderRadius: 10, padding: "11px 14px", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
              </div>
            ) : null}

            <label style={{ color: "#0891B2", fontSize: 11, fontFamily: "monospace", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Parties</label>
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
            <button onClick={addRepetition} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: "1px dashed #7C3AED55", color: "#7C3AED", fontSize: 13, cursor: "pointer", marginTop: 8 }}>+ Ajouter une répétition</button>
            {repetitions.map((repeat) => (
              <div key={repeat.id} style={{ display: "grid", gap: 8, marginTop: 10, padding: 10, borderRadius: 12, background: "var(--k-surface)", border: "1px solid var(--k-border)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input value={repeat.startRang} onChange={(event) => updateRepetition(repeat.id, "startRang", event.target.value)} placeholder="Rang début" type="number" min="1" style={{ background: "var(--k-field)", border: "1px solid var(--k-border)", borderRadius: 10, padding: 10, color: "var(--k-text)", fontSize: 16 }} />
                  <input value={repeat.endRang} onChange={(event) => updateRepetition(repeat.id, "endRang", event.target.value)} placeholder="Rang fin" type="number" min="1" style={{ background: "var(--k-field)", border: "1px solid var(--k-border)", borderRadius: 10, padding: 10, color: "var(--k-text)", fontSize: 16 }} />
                </div>
                <button type="button" onClick={() => updateRepetition(repeat.id, "infinite", !repeat.infinite)} style={{ border: `1px solid ${repeat.infinite ? "#7C3AED" : "var(--k-border)"}`, borderRadius: 10, background: repeat.infinite ? "rgba(124,58,237,0.16)" : "var(--k-muted-fill)", color: repeat.infinite ? "#A78BFA" : "var(--k-muted)", padding: 10, fontWeight: 800 }}>Jusqu'à satisfaction</button>
                {!repeat.infinite ? <input value={repeat.passages ?? 2} onChange={(event) => updateRepetition(repeat.id, "passages", event.target.value)} placeholder="Passages total" type="number" min="2" style={{ background: "var(--k-field)", border: "1px solid var(--k-border)", borderRadius: 10, padding: 10, color: "var(--k-text)", fontSize: 16 }} /> : null}
                <button type="button" onClick={() => removeRepetition(repeat.id)} style={{ border: "1px solid rgba(239,68,68,0.35)", borderRadius: 10, background: "rgba(239,68,68,0.12)", color: "#F87171", padding: 10, fontWeight: 800 }}>Retirer la répétition</button>
              </div>
            ))}
            {parties.length > 0 ? <div style={{ color: "var(--k-muted-2)", fontSize: 12, textAlign: "center", marginTop: 10 }}>Total : {totalFromParties} rangs</div> : null}
          </div>
        ) : null}

        </div>

        <div style={{ flexShrink: 0, display: "flex", gap: 12, padding: "12px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)", borderTop: "1px solid var(--k-border)", background: "var(--k-surface)" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid var(--k-border)", background: "none", color: "var(--k-muted)", fontSize: 14, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSave} disabled={!name.trim()} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: name.trim() ? "linear-gradient(135deg, #0891B2, #22D3EE)" : "var(--k-border-strong)", color: name.trim() ? "#fff" : "var(--k-muted-2)", fontSize: 14, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed" }}>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
