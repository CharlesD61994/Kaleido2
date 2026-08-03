import React, { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import {
  hydrateStorefrontFromCloud,
  readStorefrontProducts,
  STOREFRONT_PRODUCTS_CHANGED_EVENT,
  STOREFRONT_PRODUCTS_KEY,
  writeStorefrontProducts,
} from "../../services/storefrontAdminStore";
import { FLOATING_ACTION_BOTTOM } from "../../styles/layout";
import AdminLayout from "./AdminLayout";
import "./AdminProductsScreen.css";

const OPTION_LABELS = {
  mainColor: "Couleur principale",
  accentColor: "Couleur secondaire",
  recipient: "Pour qui ?",
  shoeSize: "Pointure",
  keychain: "Porte-clé",
  personalization: "Personnalisation",
  finish: "Finition",
  delay: "Délai",
};

const CARD_COLORS = ["#f05b4f", "#30c7c9", "#e84b94", "#7c3aed", "#f3b51b", "#8bbf3f", "#f4831f"];
const FILTERS = ["Tous", "Brouillons", "Catalogue", "Hors catalogue", "Vêtement", "Amigurumi", "Pantoufles", "Porte-clé", "Couverture"];

const normalizeText = (value) => String(value || "")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLowerCase();

const normalizeProductPhoto = (photo) => (
  typeof photo === "string" ? { id: "", name: photo, url: "" } : photo
);

const productColors = (product) => [
  ...new Set([
    ...(product.options?.includes("mainColor") ? product.colors?.main || [] : []),
    ...(product.options?.includes("accentColor") ? product.colors?.accent || [] : []),
  ]),
];

const productOptions = (product) => (product.options || [])
  .map((id) => OPTION_LABELS[id])
  .filter(Boolean);

const isProductReady = (product) => product.status === "ready";
const isProductInCatalog = (product) => isProductReady(product) && product.inCatalog !== false;

const categoryIcon = (category) => {
  const normalized = normalizeText(category);
  if (normalized.includes("pantoufle")) return "◒";
  if (normalized.includes("porte")) return "◇";
  if (normalized.includes("couverture")) return "▧";
  if (normalized.includes("vetement")) return "♢";
  if (normalized.includes("ami")) return "●";
  return "✦";
};

function ProductsStats({ products }) {
  const options = products.reduce((total, product) => total + (product.options || []).length, 0);
  const colors = products.reduce((total, product) => total + productColors(product).length, 0);
  const stats = [
    { label: "PRODUITS", value: products.length, color: "#7C3AED", symbol: "▦" },
    { label: "OPTIONS", value: options, color: "#0891B2", symbol: "◇" },
    { label: "COULEURS", value: colors, color: "#059669", symbol: "●" },
  ];

  return (
    <section className="admin-react-stats admin-react-product-stats" aria-label="Résumé des produits">
      {stats.map((stat) => (
        <article className="admin-react-stat" style={{ "--stat-color": stat.color }} key={stat.label}>
          <span className="admin-react-stat-icon" aria-hidden="true">{stat.symbol}</span>
          <strong>{stat.value}</strong>
          <small>{stat.label}</small>
        </article>
      ))}
    </section>
  );
}

function ProductActionModal({ action, product, onClose, onConfirm }) {
  if (!action || !product) return null;
  const finalize = action === "finalize";
  const inCatalog = isProductInCatalog(product);
  const title = finalize ? "Finaliser la fiche ?" : "Catalogue";
  const message = finalize
    ? "Cette fiche passera dans les produits terminés et sera ajoutée automatiquement au catalogue."
    : inCatalog
      ? "Ce produit est dans le catalogue. Voulez-vous l’en retirer ?"
      : "Ce produit n’est pas dans le catalogue. Voulez-vous l’ajouter ?";
  const confirmLabel = finalize ? "Finaliser" : inCatalog ? "Retirer" : "Ajouter";

  return (
    <div className="admin-react-product-modal-backdrop" onClick={onClose}>
      <section
        aria-labelledby="admin-product-action-title"
        aria-modal="true"
        className="admin-react-product-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button className="admin-react-product-modal-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
        <span>{product.name || "Produit sans nom"}</span>
        <h2 id="admin-product-action-title">{title}</h2>
        <p>{message}</p>
        <div>
          <button type="button" onClick={onConfirm}>{confirmLabel}</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </div>
      </section>
    </div>
  );
}

function ProductCard({
  activeMenuId,
  onAction,
  onColor,
  onDelete,
  onDuplicate,
  onEdit,
  onToggleMenu,
  product,
}) {
  const colors = productColors(product);
  const options = productOptions(product);
  const choiceCount = Object.values(product.optionChoices || {}).flat().length;
  const photos = (product.productPhotos || []).map(normalizeProductPhoto);
  const coverPhoto = photos.find((photo) => photo?.url);
  const colorPhotoCount = (product.colorPhotos || []).reduce(
    (total, color) => total + (color.photos || []).length,
    0,
  );
  const primaryColor = product.cardColor || colors[0] || "#30c7c9";
  const accentColor = colors[1] || "#e84b94";
  const visibleColors = colors.slice(0, 4);
  const remainingColors = Math.max(0, colors.length - visibleColors.length);
  const menuOpen = activeMenuId === String(product.id);

  return (
    <article
      className={`admin-react-product-card ${menuOpen ? "is-menu-open" : ""} ${isProductReady(product) ? "is-ready" : "is-draft"}`}
      style={{ "--product-color": primaryColor, "--product-accent": accentColor }}
    >
      <button
        type="button"
        className={`admin-react-product-card-link ${coverPhoto ? "has-product-photo" : ""}`}
        onClick={() => onEdit(product)}
        aria-label={`Modifier ${product.name || "Produit sans nom"}`}
      >
        <span className="admin-react-product-image">
          {coverPhoto ? (
            <img src={coverPhoto.url} alt={coverPhoto.name || product.name || "Produit"} />
          ) : (
            <span className="admin-react-product-icon" aria-hidden="true">{categoryIcon(product.category)}</span>
          )}
          <small>{isProductReady(product) ? (isProductInCatalog(product) ? "catalogue" : "hors catalogue") : "brouillon"}</small>
        </span>
        <span className="admin-react-product-body">
          <strong className="admin-react-product-name">{product.name || "Produit sans nom"}</strong>
          <span className="admin-react-product-price">À partir de <b>{product.price || "prix à définir"}</b></span>
          {!!visibleColors.length && (
            <span className="admin-react-product-swatches" aria-label="Couleurs">
              {visibleColors.map((color) => (
                <i key={color} style={{ "--swatch": color }} />
              ))}
              {remainingColors > 0 && <em>+{remainingColors}</em>}
            </span>
          )}
          <span className="admin-react-product-meta">
            <i>{product.category || "Catalogue"}</i>
            <i>{options.length} option(s)</i>
            <i>{choiceCount} choix</i>
            <i>{colorPhotoCount} laine</i>
          </span>
        </span>
      </button>

      <button
        className="admin-react-product-menu-button"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleMenu(product.id);
        }}
        aria-label="Options du produit"
      >
        •••
      </button>

      {menuOpen && (
        <div className="admin-react-product-menu" onClick={(event) => event.stopPropagation()}>
          <span>Couleur de carte</span>
          <div>
            {CARD_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => onColor(product.id, color)}
                style={{ "--swatch": color }}
                aria-label={`Changer la carte à ${color}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => onAction(isProductReady(product) ? "catalog" : "finalize", product.id)}>
            {isProductReady(product) ? "Catalogue" : "Finaliser"}
          </button>
          <button type="button" onClick={() => onDuplicate(product)}>Dupliquer</button>
          <button className="danger" type="button" onClick={() => onDelete(product)}>Supprimer</button>
        </div>
      )}
    </article>
  );
}

function ProductSection({ children, subtitle, title }) {
  return (
    <>
      <header className="admin-react-products-section-title">
        <div>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
      </header>
      {children}
    </>
  );
}

export default function AdminProductsScreen({ navigation }) {
  const [products, setProducts] = useState(readStorefrontProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const refresh = () => setProducts(readStorefrontProducts());
    const onStorage = (event) => {
      if (!event.key || event.key === STOREFRONT_PRODUCTS_KEY) refresh();
    };
    window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    hydrateStorefrontFromCloud().then((result) => {
      if (result.ok) refresh();
    });
    return () => {
      window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!activeMenuId || event.target.closest(".admin-react-product-card")) return;
      setActiveMenuId(null);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [activeMenuId]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    return products.filter((product) => {
      let matchesFilter = true;
      if (filter === "Brouillons") matchesFilter = !isProductReady(product);
      else if (filter === "Catalogue") matchesFilter = isProductInCatalog(product);
      else if (filter === "Hors catalogue") matchesFilter = isProductReady(product) && !isProductInCatalog(product);
      else if (filter !== "Tous") {
        matchesFilter = normalizeText(`${product.category || ""} ${product.name || ""} ${productOptions(product).join(" ")}`)
          .includes(normalizeText(filter));
      }
      if (!matchesFilter || !normalizedSearch) return matchesFilter;

      const choices = Object.values(product.optionChoices || {}).flat().join(" ");
      const status = isProductReady(product)
        ? (isProductInCatalog(product) ? "catalogue" : "hors catalogue")
        : "brouillon";
      return normalizeText(
        `${product.name || ""} ${product.category || ""} ${product.price || ""} ${status} ${productOptions(product).join(" ")} ${choices}`,
      ).includes(normalizedSearch);
    });
  }, [filter, products, search]);

  const drafts = filteredProducts.filter((product) => !isProductReady(product));
  const ready = filteredProducts.filter(isProductReady);

  const save = (nextProducts) => {
    setProducts(writeStorefrontProducts(nextProducts));
  };

  const updateProduct = (productId, updater) => {
    save(products.map((product) => (
      String(product.id) === String(productId) ? updater(product) : product
    )));
  };

  const editProduct = (product) => {
    navigation.navigate(ADMIN_ROUTES.PRODUCT_EDITOR, {
      productId: String(product.id),
    });
  };

  const duplicateProduct = (product) => {
    const id = window.crypto?.randomUUID?.() || `product-${Date.now()}`;
    const now = new Date().toISOString();
    save([{
      ...product,
      id,
      name: `${product.name || "Produit sans nom"} copie`,
      status: "draft",
      inCatalog: false,
      createdAt: now,
      updatedAt: now,
    }, ...products]);
    setActiveMenuId(null);
  };

  const deleteProduct = (product) => {
    if (!window.confirm(`Supprimer ${product.name || "ce produit"} ?`)) return;
    save(products.filter((item) => String(item.id) !== String(product.id)));
    setActiveMenuId(null);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    const { type, productId } = pendingAction;
    setPendingAction(null);
    updateProduct(productId, (product) => (
      type === "finalize"
        ? { ...product, status: "ready", inCatalog: true, updatedAt: new Date().toISOString() }
        : { ...product, inCatalog: !isProductInCatalog(product), updatedAt: new Date().toISOString() }
    ));
  };

  const cardProps = {
    activeMenuId,
    onAction: (type, productId) => {
      setPendingAction({ type, productId: String(productId) });
      setActiveMenuId(null);
    },
    onColor: (productId, color) => {
      updateProduct(productId, (product) => ({ ...product, cardColor: color }));
      setActiveMenuId(null);
    },
    onDelete: deleteProduct,
    onDuplicate: duplicateProduct,
    onEdit: editProduct,
    onToggleMenu: (productId) => setActiveMenuId((current) => (
      current === String(productId) ? null : String(productId)
    )),
  };

  const pendingProduct = pendingAction
    ? products.find((product) => String(product.id) === String(pendingAction.productId))
    : null;

  return (
    <AdminLayout onBack={navigation.goBack} title="Produits">
      <div ref={pageRef} className="admin-react-products">
        <ProductsStats products={products} />

        <section className="admin-react-products-controls" aria-label="Recherche et filtres produits">
          <label className="admin-react-products-search">
            <span aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un produit..."
            />
          </label>
          <div className="admin-react-products-tags" aria-label="Filtres produits">
            {FILTERS.map((item) => (
              <button
                className={filter === item ? "is-active" : ""}
                type="button"
                key={item}
                onClick={() => setFilter(item)}
              >
                {item === "Vêtement" ? "Vêtements" : item === "Porte-clé" ? "Porte-clés" : item === "Couverture" ? "Couvertures" : item}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-react-products-grid" aria-label="Produits">
          {filteredProducts.length > 0 ? (
            <>
              {drafts.length > 0 && (
                <ProductSection title="Fiches en préparation" subtitle="À finaliser avant publication">
                  {drafts.map((product) => <ProductCard key={product.id} product={product} {...cardProps} />)}
                </ProductSection>
              )}
              {ready.length > 0 && (
                <ProductSection title="Produits terminés" subtitle="Prêts pour la vitrine et le catalogue">
                  {ready.map((product) => <ProductCard key={product.id} product={product} {...cardProps} />)}
                </ProductSection>
              )}
            </>
          ) : (
            <div className="admin-react-products-empty">
              <strong>{products.length ? "Aucun produit trouvé" : "Aucun produit créé"}</strong>
              <p>{products.length ? "Essaie un autre mot ou un autre filtre." : "Utilise le bouton + pour créer ton premier produit."}</p>
            </div>
          )}
        </section>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: FLOATING_ACTION_BOTTOM,
          right: "calc(50% - 184px)",
          zIndex: 50,
        }}
      >
        <button
          type="button"
          aria-label="Créer un produit"
          onClick={() => navigation.navigate(ADMIN_ROUTES.PRODUCT_EDITOR)}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            border: "none",
            cursor: "pointer",
            fontSize: 28,
            color: "#fff",
            boxShadow: "0 4px 20px #7C3AED88",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>

      <ProductActionModal
        action={pendingAction?.type}
        product={pendingProduct}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />
    </AdminLayout>
  );
}
