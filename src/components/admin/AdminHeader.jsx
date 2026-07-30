import React from "react";

export default function AdminHeader({
  action = null,
  onBack,
  title,
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "grid",
        gridTemplateColumns: "40px minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 10,
        minHeight: 58,
        padding: "calc(env(safe-area-inset-top, 0px) + 8px) 16px 10px",
        background: "color-mix(in srgb, var(--k-bg) 94%, transparent)",
        borderBottom: "1px solid var(--k-border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <button
        type="button"
        aria-label="Retour"
        data-kaleido-back-button="true"
        onClick={onBack}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          border: "1px solid var(--k-control-border)",
          background: "var(--k-surface-2)",
          color: "#A78BFA",
          display: "grid",
          placeItems: "center",
          fontSize: 24,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        {"←"}
      </button>
      <div
        style={{
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
        }}
      >
        <img
          src="/admin-boutique/assets/kaleido-logo.jpg"
          alt=""
          style={{ width: 31, height: 31, borderRadius: "50%", objectFit: "cover" }}
        />
        <strong
          style={{
            minWidth: 0,
            overflow: "hidden",
            color: "var(--k-text)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </strong>
      </div>
      <div style={{ display: "grid", placeItems: "center" }}>{action}</div>
    </header>
  );
}
