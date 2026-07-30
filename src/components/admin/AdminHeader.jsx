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
        onClick={onBack}
        className="admin-react-back"
      >
        {"←"}
      </button>
      <div className="admin-react-brand">
        <img
          src="/admin-boutique/assets/kaleido-logo.jpg"
          alt=""
        />
        <strong>{title}</strong>
      </div>
      <div className="admin-react-header-action">{action}</div>
    </header>
  );
}
