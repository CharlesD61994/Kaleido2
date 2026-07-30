import React, { forwardRef } from "react";

const AdminLegacyBridge = forwardRef(function AdminLegacyBridge({ onLoad, src }, ref) {
  return (
    <iframe
      ref={ref}
      title="Admin boutique Kaleido"
      src={`/admin-boutique/${src}`}
      onLoad={onLoad}
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        display: "block",
        background: "var(--k-bg)",
        opacity: 1,
      }}
    />
  );
});

export default AdminLegacyBridge;
