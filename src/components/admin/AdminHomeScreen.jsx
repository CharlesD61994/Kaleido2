import React, { useCallback, useEffect, useState } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import {
  hydrateStorefrontFromCloud,
  isStorefrontPublicationPending,
  publishStorefront,
  readStorefrontStats,
  STOREFRONT_HOME_CONFIG_CHANGED_EVENT,
  STOREFRONT_HOME_CONFIG_KEY,
  STOREFRONT_PRODUCTS_CHANGED_EVENT,
  STOREFRONT_PRODUCTS_KEY,
} from "../../services/storefrontAdminStore";
import AdminLayout from "./AdminLayout";
import "./AdminHomeScreen.css";

const modules = [
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
    title: "Catalogue",
    description: "Organiser les catégories, les sous-catégories et les collections.",
    color: "#F4831F",
    icon: "catalog",
    route: ADMIN_ROUTES.CATALOG,
  },
  {
    title: "Boutique",
    description: "Choisir les catégories et les produits affichés sur la page d'accueil.",
    color: "#E84B94",
    icon: "storefront",
    route: ADMIN_ROUTES.STOREFRONT,
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
  const [publishState, setPublishState] = useState(
    () => (isStorefrontPublicationPending() ? "idle" : "saved"),
  );
  const [publishError, setPublishError] = useState("");

  const refreshAdminState = useCallback(() => {
    setStats(readStorefrontStats());
    setPublishState((current) => (
      current === "saving"
        ? current
        : isStorefrontPublicationPending() ? "idle" : "saved"
    ));
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (
        !event.key
        || event.key === STOREFRONT_PRODUCTS_KEY
        || event.key === STOREFRONT_HOME_CONFIG_KEY
      ) {
        refreshAdminState();
      }
    };
    window.addEventListener("focus", refreshAdminState);
    window.addEventListener("storage", onStorage);
    window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshAdminState);
    window.addEventListener(STOREFRONT_HOME_CONFIG_CHANGED_EVENT, refreshAdminState);
    hydrateStorefrontFromCloud().then((result) => {
      if (result.ok) refreshAdminState();
    });
    return () => {
      window.removeEventListener("focus", refreshAdminState);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshAdminState);
      window.removeEventListener(STOREFRONT_HOME_CONFIG_CHANGED_EVENT, refreshAdminState);
    };
  }, [refreshAdminState]);

  useEffect(() => {
    if (navigation.currentRoute.name === ADMIN_ROUTES.HOME) refreshAdminState();
  }, [navigation.currentRoute.id, navigation.currentRoute.name, refreshAdminState]);

  const handlePublish = async () => {
    if (publishState === "saving" || !isStorefrontPublicationPending()) return;
    setPublishError("");
    setPublishState("saving");
    const result = await publishStorefront();
    if (!result.ok) {
      setPublishState("error");
      setPublishError(result.message || `Publication impossible (${result.reason}).`);
      return;
    }
    setPublishState("saved");
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
              onClick={() => navigation.navigate(module.route)}
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
