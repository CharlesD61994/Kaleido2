import React from "react";
import AdminHeader from "./AdminHeader";

export default function AdminLayout({
  action,
  children,
  onBack,
  title,
}) {
  return (
    <section
      data-kaleido-admin-page="true"
      style={{
        width: "100%",
        minHeight: "100%",
        background: "var(--k-bg)",
        color: "var(--k-text)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <AdminHeader action={action} onBack={onBack} title={title} />
      <main
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "calc(100vh - 58px)",
          margin: "0 auto",
          padding: "16px 18px calc(env(safe-area-inset-bottom, 0px) + 28px)",
        }}
      >
        {children}
      </main>
    </section>
  );
}
