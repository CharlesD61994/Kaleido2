import React from "react";
import { VIEWS } from "../../constants/views";
import AdminRoot from "../admin/AdminRoot";

export default function BoutiqueAdminScreen({
  currentView,
  navigateToHub,
  activeScreenInteractiveStyle,
}) {
  const isActive = currentView === VIEWS.BOUTIQUE_ADMIN;

  if (!isActive) return null;

  return (
    <section
      data-kaleido-screen="true"
      style={{
        ...(activeScreenInteractiveStyle || {}),
        position: "fixed",
        inset: 0,
        zIndex: 20,
        minHeight: "100vh",
        background: "var(--k-bg)",
        overflow: "hidden",
      }}
    >
      <AdminRoot
        isActive={isActive}
        onExit={navigateToHub}
      />
    </section>
  );
}
