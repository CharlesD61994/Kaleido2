import React from "react";

export default function ClientModal({
  show,
  mode,
  clientName,
  clientEmail,
  clientError,
  clientEmailError,
  clientNameInputRef,
  onClientNameChange,
  onClientEmailChange,
  onClientEmailBlur,
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  const canConfirm = clientName.trim() && !clientEmailError;

  return (
    <div
      data-kaleido-modal-backdrop="true"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.80)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div
        data-kaleido-modal-card="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1A1A2E",
          borderRadius: 22,
          padding: "26px 24px 24px",
          width: "100%",
          maxWidth: 380,
          boxSizing: "border-box",
          border: "1px solid rgba(167,139,250,0.16)",
          boxShadow: "0 22px 70px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.06)"
        }}
      >
        <h3 style={{ color: "#F1F0EE", fontFamily: "'Syne', sans-serif", fontSize: 24, lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
          {mode === "edit" ? "Modifier la fiche client" : "Fiche client"}
        </h3>

        <p style={{ color: "#A8A6B8", fontSize: 15, margin: "0 0 24px", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.42 }}>
          {mode === "edit" ? "Mets à jour les informations du client associé à ce projet." : "Associe ce projet professionnel à un client."}
        </p>

        <label style={{ display: "block", color: "#C9C6D8", fontSize: 15, lineHeight: 1.2, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          Nom du client
        </label>
        <input
          ref={clientNameInputRef}
          value={clientName}
          onChange={(e) => onClientNameChange(e.target.value)}
          placeholder="Ex. Marie Tremblay"
          onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); }}
          style={{
            width: "100%",
            minHeight: 56,
            padding: "14px 16px",
            marginBottom: clientError ? 8 : 18,
            borderRadius: 15,
            border: clientError ? "1.5px solid #F87171" : "1.5px solid #3A3852",
            background: "#0D0D1A",
            color: "#F1F0EE",
            fontSize: 18,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 650,
            outline: "none",
            boxSizing: "border-box",
            boxShadow: clientError ? "0 0 0 3px rgba(248,113,113,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.03)"
          }}
        />
        {clientError && (
          <div style={{ color: "#F87171", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.35, fontWeight: 600 }}>
            {clientError}
          </div>
        )}

        <label style={{ display: "block", color: "#C9C6D8", fontSize: 15, lineHeight: 1.2, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          Courriel
        </label>
        <input
          value={clientEmail}
          onChange={(e) => onClientEmailChange(e.target.value)}
          onBlur={onClientEmailBlur}
          placeholder="client@email.com"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); }}
          style={{
            width: "100%",
            minHeight: 56,
            padding: "14px 16px",
            marginBottom: clientEmailError ? 8 : 24,
            borderRadius: 15,
            border: clientEmailError ? "1.5px solid #F87171" : "1.5px solid #3A3852",
            background: "#0D0D1A",
            color: "#F1F0EE",
            fontSize: 18,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 650,
            outline: "none",
            boxSizing: "border-box",
            boxShadow: clientEmailError ? "0 0 0 3px rgba(248,113,113,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.03)"
          }}
        />
        {clientEmailError && (
          <div style={{ color: "#F87171", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.35, fontWeight: 600 }}>
            {clientEmailError}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button onClick={onCancel} style={{ padding: "13px 20px", minHeight: 50, borderRadius: 15, border: "1.5px solid #343148", background: "rgba(13,13,26,0.35)", color: "#A8A6B8", cursor: "pointer", fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              padding: "13px 22px",
              minHeight: 50,
              borderRadius: 15,
              border: "none",
              background: canConfirm ? "linear-gradient(135deg, #7C3AED, #DB2777)" : "#33334A",
              color: canConfirm ? "#fff" : "#777",
              cursor: canConfirm ? "pointer" : "not-allowed",
              fontWeight: 800,
              fontSize: 16,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: canConfirm ? "0 12px 28px rgba(219,39,119,0.26)" : "none"
            }}
          >
            {mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
