import React from "react";

export default function AdminHeader({
  action = null,
  onBack,
  title,
}) {
  return (
    <header className="admin-react-header">
      <button
        type="button"
        aria-label="Retour"
        data-kaleido-back-button="true"
        data-kaleido-admin-back-button="true"
        onClick={(event) => {
          event.stopPropagation();
          onBack?.();
        }}
        className="admin-react-back"
      >
        {"←"}
      </button>
      <div className="admin-react-brand">
        <span className="admin-react-brand-logo" aria-hidden="true">
          <img
            src="/admin-boutique/assets/kaleido-logo.jpg"
            alt=""
          />
        </span>
        <strong>{title}</strong>
      </div>
      <div className="admin-react-header-action">{action}</div>
    </header>
  );
}
