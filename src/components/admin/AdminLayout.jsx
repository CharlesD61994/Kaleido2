import React from "react";
import AdminHeader from "./AdminHeader";
import "./AdminHomeScreen.css";

export default function AdminLayout({
  action,
  children,
  onBack,
  title,
}) {
  return (
    <section
      data-kaleido-admin-page="true"
      className="admin-react-page"
    >
      <AdminHeader action={action} onBack={onBack} title={title} />
      <main className="admin-react-main">
        {children}
      </main>
    </section>
  );
}
