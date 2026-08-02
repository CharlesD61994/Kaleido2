import React from "react";
import AdminHeader from "./AdminHeader";
import "./AdminProductsScreen.css";

const PUBLIC_STOREFRONT_URL = String(
  import.meta.env.VITE_STOREFRONT_ORIGIN
    || "https://kaleido3.vercel.app/admin-boutique/index.html",
).replace(/\/$/, "");

export default function AdminPreviewScreen({ navigation }) {
  return (
    <section className="admin-react-page admin-react-preview-page">
      <AdminHeader onBack={navigation.goBack} title="Vitrine" />
      <iframe
        className="admin-react-preview-frame"
        src={PUBLIC_STOREFRONT_URL}
        title="Aperçu du site vitrine"
      />
    </section>
  );
}
