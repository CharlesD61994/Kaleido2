import React, { useCallback, useEffect, useState } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import { publishStorefront, readStorefrontStats, STOREFRONT_PRODUCTS_KEY } from "../../services/storefrontAdminStore";
import Icon from "../icons/Icon";
import AdminLayout from "./AdminLayout";

const modules = [
  {
    title: "Créer un produit",
    description: "Préparer une fiche avec photos, options, couleurs et aperçu client.",
    color: "#F05B4F",
    icon: "plus",
    src: "admin-produit.html",
  },
  {
    title: "Vitrine",
    description: "Visualiser le site boutique comme les clients le verront.",
    color: "#7C3AED",
    icon: "home",
    src: "admin-preview.html",
  },
  {
    title: "Produits",
    description: "Revoir les brouillons locaux et les fiches préparées.",
    color: "#30C7C9",
    icon: "package",
    src: "admin-produits.html",
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
  { key: "drafts", label: "BROUILLONS", color: "#7C3AED", icon: "grid" },
  { key: "ready", label: "TERMINÉS", color: "#0891B2", icon: "checkCircle" },
  { key: "catalog", label: "CATALOGUE", color: "#059669", icon: "package" },
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
      style={{
        minWidth: 72,
        minHeight: 34,
        padding: "0 13px",
        border: `1px solid ${publishState === "error" ? "#E5484D" : "#7C3AED66"}`,
        borderRadius: 10,
        background: publishState === "saved"
          ? "linear-gradient(135deg, #34D399, #059669)"
          : publishState === "error"
            ? "color-mix(in srgb, #E5484D 14%, var(--k-surface))"
            : "linear-gradient(135deg, #8B5CF6, #7C3AED)",
        color: publishState === "error" ? "#E5484D" : "#FFF",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        fontWeight: 800,
        cursor: publishState === "saving" ? "wait" : "pointer",
        opacity: publishState === "saving" ? 0.72 : 1,
      }}
    >
      {publishLabel}
    </button>
  );

  return (
    <AdminLayout action={publishAction} onBack={onExit} title="Admin">
      {publishError && (
        <p
          role="status"
          style={{
            margin: "0 0 12px",
            padding: "9px 11px",
            border: "1px solid #E5484D55",
            borderRadius: 8,
            background: "color-mix(in srgb, #E5484D 10%, var(--k-surface))",
            color: "#E5484D",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {publishError}
        </p>
      )}

      <section
        aria-label="Résumé boutique"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 9,
          marginBottom: 22,
        }}
      >
        {statItems.map((item) => (
          <article
            key={item.key}
            style={{
              minWidth: 0,
              minHeight: 112,
              padding: "13px 6px 11px",
              border: `1px solid ${item.color}42`,
              borderRadius: 8,
              background: `linear-gradient(155deg, color-mix(in srgb, ${item.color} 11%, var(--k-surface)), var(--k-surface))`,
              boxShadow: `0 8px 22px ${item.color}12`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              textAlign: "center",
            }}
          >
            <Icon name={item.icon} size={20} color={item.color} />
            <strong style={{ color: "var(--k-text)", fontSize: 26, lineHeight: 1 }}>{stats[item.key]}</strong>
            <small style={{ color: item.color, fontSize: 9, fontWeight: 900 }}>{item.label}</small>
          </article>
        ))}
      </section>

      <section aria-labelledby="admin-modules-title">
        <h2
          id="admin-modules-title"
          style={{
            margin: "0 0 13px",
            color: "var(--k-text)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
          }}
        >
          Gestion boutique
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {modules.map((module) => (
            <button
              key={module.title}
              type="button"
              disabled={module.disabled}
              onClick={() => navigation.navigate(ADMIN_ROUTES.LEGACY, { src: module.src })}
              style={{
                position: "relative",
                minWidth: 0,
                minHeight: 154,
                padding: "17px 14px 15px",
                overflow: "visible",
                border: `1px solid ${module.color}4F`,
                borderRadius: 8,
                background: `linear-gradient(150deg, color-mix(in srgb, ${module.color} 14%, var(--k-surface)), var(--k-surface) 68%)`,
                boxShadow: module.disabled
                  ? "none"
                  : `0 10px 24px rgba(16,39,68,0.10), 0 0 18px ${module.color}20`,
                color: "var(--k-text)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 8,
                textAlign: "left",
                cursor: module.disabled ? "default" : "pointer",
                opacity: module.disabled ? 0.58 : 1,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  border: `1px solid ${module.color}66`,
                  background: `color-mix(in srgb, ${module.color} 13%, var(--k-surface))`,
                  color: module.color,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name={module.icon} size={25} color={module.color} />
              </span>
              <strong style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, lineHeight: 1.15 }}>
                {module.title}
              </strong>
              <small style={{ color: "var(--k-text-muted)", fontSize: 11, lineHeight: 1.35 }}>
                {module.description}
              </small>
              {module.disabled && (
                <em style={{ marginTop: "auto", color: module.color, fontSize: 9, fontWeight: 900, fontStyle: "normal" }}>
                  BIENTÔT
                </em>
              )}
            </button>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
