import React, { useCallback, useEffect, useState } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import { publishStorefront, readStorefrontStats, STOREFRONT_PRODUCTS_KEY } from "../../services/storefrontAdminStore";
import AdminLayout from "./AdminLayout";
import "./AdminHomeScreen.css";

const modules = [
  {
    title: "Créer un produit",
    description: "Préparer une fiche avec photos, options, couleurs et aperçu client.",
    color: "#F05B4F",
    icon: "plus",
    route: ADMIN_ROUTES.PRODUCT_EDITOR,
  },
  {
    title: "Vitrine",
    description: "Visualiser le site boutique comme les clients le verront.",
    color: "#7C3AED",
    icon: "home",
    route: ADMIN_ROUTES.PREVIEW,
  },
  {
    title: "Produits",
    description: "Revoir les brouillons locaux et les fiches préparées.",
    color: "#30C7C9",
    icon: "package",
    route: ADMIN_ROUTES.PRODUCTS,
  },
  {
    title: "Accueil boutique",
    description: "Choisir les catégories et les produits affichés sur la page d'accueil.",
    color: "#E84B94",
    icon: "storefront",
    src: "admin-vitrine.html",
  },
  {
    title: "Commandes",
    description: "Suivre les commandes captées depuis la boutique.",
    color: "#F3B51B",
    icon: "projects",
    disabled: true,
  },
  {
    title: "File d’attente",
    description: "Organiser les projets clients et leurs priorités.",
    color: "#8BBF3F",
    icon: "clock",
    disabled: true,
  },
];

const statItems = [
  { key: "drafts", label: "BROUILLONS", color: "#7C3AED", symbol: "▦" },
  { key: "ready", label: "TERMINÉS", color: "#0891B2", symbol: "◇" },
  { key: "catalog", label: "CATALOGUE", color: "#059669", symbol: "●" },
];

export default function AdminHomeScreen({ navigation, onExit }) {
  const [stats, setStats] = useState(readStorefrontStats);
  const [publishState, setPublishState] = useState("idle");
  const [publishError, setPublishError] = useState("");

  const refreshStats = useCallback(() => setStats(readStorefrontStats()), []);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === STOREFRONT_PRODUCTS_KEY) refreshStats();
    };
    window.addEventListener("focus", refreshStats);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", refreshStats);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshStats]);

  useEffect(() => {
    if (navigation.currentRoute.name === ADMIN_ROUTES.HOME) refreshStats();
  }, [navigation.currentRoute.id, navigation.currentRoute.name, refreshStats]);

  const handlePublish = async () => {
    if (publishState === "saving") return;
    setPublishError("");
    setPublishState("saving");
    const result = await publishStorefront();
    if (!result.ok) {
      setPublishState("error");
      setPublishError(`Publication impossible (${result.reason}). Vérifie le SQL boutique dans Supabase.`);
      return;
    }
    setPublishState("saved");
    window.setTimeout(() => setPublishState("idle"), 2600);
  };

  const publishLabel = publishState === "saving"
    ? "Publication..."
    : publishState === "saved"
      ? "Publiée"
      : "Publier";

  const publishAction = (
    <button
      type="button"
      onClick={handlePublish}
      disabled={publishState === "saving"}
      className="admin-react-publish"
      data-state={publishState}
    >
      {publishLabel}
    </button>
  );

  return (
    <AdminLayout action={publishAction} onBack={onExit} title="Admin">
      {publishError && (
        <p
          role="status"
          className="admin-react-publish-error"
        >
          {publishError}
        </p>
      )}

      <section
        aria-label="Résumé boutique"
        className="admin-react-stats"
      >
        {statItems.map((item) => (
          <article
            key={item.key}
            className="admin-react-stat"
            style={{
              "--stat-color": item.color,
            }}
          >
            <span className="admin-react-stat-icon" aria-hidden="true">{item.symbol}</span>
            <strong>{stats[item.key]}</strong>
            <small>{item.label}</small>
          </article>
        ))}
      </section>

      <section aria-labelledby="admin-modules-title" className="admin-react-modules">
        <h2 id="admin-modules-title">
          Gestion boutique
        </h2>
        <div className="admin-react-module-grid">
          {modules.map((module) => (
            <button
              key={module.title}
              type="button"
              disabled={module.disabled}
              onClick={() => navigation.navigate(
                module.route || ADMIN_ROUTES.LEGACY,
                module.route ? {} : { src: module.src },
              )}
              className="admin-react-module"
              style={{
                "--module-color": module.color,
              }}
            >
              <span className="admin-react-module-icon" data-icon={module.icon} aria-hidden="true" />
              <strong>{module.title}</strong>
              <small>{module.description}</small>
              {module.disabled && (
                <em>BIENTÔT</em>
              )}
            </button>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
