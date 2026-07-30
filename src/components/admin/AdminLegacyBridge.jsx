import React from "react";

export default function AdminLegacyBridge({ isLoaded, onLoad }) {
  return (
    <iframe
      title="Admin boutique Kaleido"
      src="/admin-boutique/admin-shell.html"
      onLoad={onLoad}
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        display: "block",
        background: "var(--k-bg)",
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 140ms ease",
      }}
    />
  );
}
