import React from "react";
import AdminHeader from "./AdminHeader";
import "./AdminProductsScreen.css";

export default function AdminPreviewScreen({ navigation }) {
  return (
    <section className="admin-react-page admin-react-preview-page">
      <AdminHeader onBack={navigation.goBack} title="Vitrine" />
      <iframe
        className="admin-react-preview-frame"
        src="/admin-boutique/index.html"
        title="Aperçu du site vitrine"
      />
    </section>
  );
}
