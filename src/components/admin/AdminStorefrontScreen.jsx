import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  hydrateStorefrontFromCloud,
  readStorefrontHomeConfig,
  readStorefrontProducts,
  STOREFRONT_HOME_CONFIG_CHANGED_EVENT,
  STOREFRONT_HOME_CONFIG_KEY,
  STOREFRONT_PRODUCTS_CHANGED_EVENT,
  STOREFRONT_PRODUCTS_KEY,
  writeStorefrontHomeConfig,
} from "../../services/storefrontAdminStore";
import { deleteImage, loadImage, saveImage } from "../../services/mediaStore";
import AdminLayout from "./AdminLayout";
import "./AdminStorefrontScreen.css";

const DEFAULT_CATEGORIES = [
  { id: "vetements", label: "Vêtements", color: "#7c3aed", icon: "♢" },
  { id: "peluches", label: "Peluches crochetées", color: "#e84b94", icon: "●" },
  { id: "pantoufles", label: "Pantoufles", color: "#30c7c9", icon: "◒" },
  { id: "porte-cles", label: "Porte-clés", color: "#f4831f", icon: "◇" },
  { id: "couvertures", label: "Couvertures", color: "#8bbf3f", icon: "▧" },
];
const CATEGORY_ICONS = ["✦", "◌", "●", "◒", "◇", "▧", "♢"];
const CROP_SIZE = 260;

const customCategoriesFrom = (raw) => (
  Array.isArray(raw?.customCategories)
    ? raw.customCategories
      .filter((category) => category?.id && category?.label)
      .map((category, index) => ({
        id: String(category.id),
        label: String(category.label),
        color: category.color || "#30c7c9",
        icon: category.icon || CATEGORY_ICONS[index % CATEGORY_ICONS.length],
        custom: true,
      }))
    : []
);

const normalizePhoto = (photo) => {
  const src = photo?.src || photo?.original || photo?.url || photo?.preview;
  if (!src) return null;
  return {
    name: photo.name || "",
    mediaId: photo.mediaId || "",
    src,
    original: photo.original || src,
    preview: photo.preview || photo.url || src,
    x: Number(photo.x ?? photo.pos?.x) || 0,
    y: Number(photo.y ?? photo.pos?.y) || 0,
    scale: Math.max(0.2, Math.min(5, Number(photo.scale) || 1)),
    naturalWidth: Number(photo.naturalWidth) || 0,
    naturalHeight: Number(photo.naturalHeight) || 0,
  };
};

const allCategoriesFrom = (raw) => {
  const custom = customCategoriesFrom(raw);
  const photos = raw?.categoryPhotos || {};
  const colors = raw?.categoryColors || {};
  return [...DEFAULT_CATEGORIES, ...custom].map((category) => ({
    ...category,
    color: colors[category.id] || category.color,
    photo: normalizePhoto(photos[category.id]),
  }));
};

const cleanConfig = (raw) => {
  const categories = allCategoriesFrom(raw);
  const hasExplicitCategories = Array.isArray(raw?.categories);
  const selected = hasExplicitCategories
    ? raw.categories.filter((id) => categories.some((category) => category.id === id))
    : categories.map((category) => category.id);
  return {
    categories: hasExplicitCategories ? selected : categories.map((category) => category.id),
    customCategories: customCategoriesFrom(raw),
    subcategories: Array.isArray(raw?.subcategories) ? raw.subcategories : [],
    collections: Array.isArray(raw?.collections) ? raw.collections : [],
    categoryColors: raw?.categoryColors || {},
    categoryPhotos: raw?.categoryPhotos || {},
    featuredProductIds: Array.isArray(raw?.featuredProductIds)
      ? raw.featuredProductIds.map(String)
      : [],
    shopify: raw?.shopify && typeof raw.shopify === "object" ? raw.shopify : null,
  };
};

const moveItem = (items, index, direction) => {
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(destination, 0, item);
  return next;
};

const normalizeProductPhoto = (photo) => (
  typeof photo === "string" ? { id: "", name: photo, url: "" } : photo
);
const productCover = (product) => (
  (product.productPhotos || []).map(normalizeProductPhoto).find((photo) => photo?.url)
);
const productColors = (product) => (
  [...new Set([
    ...(product.options?.includes("mainColor") ? product.colors?.main || [] : []),
    ...(product.options?.includes("accentColor") ? product.colors?.accent || [] : []),
  ])]
);
const isCatalogProduct = (product) => product.status === "ready" && product.inCatalog !== false;

const categoryIcon = (category) => {
  const value = String(category || "").toLowerCase();
  if (value.includes("pantoufle")) return "◒";
  if (value.includes("porte")) return "◇";
  if (value.includes("couverture")) return "▧";
  if (value.includes("vêtement") || value.includes("vetement")) return "♢";
  if (value.includes("ami") || value.includes("peluche")) return "●";
  return "✦";
};

function ProductCard({ index, onAdd, onMove, onRemove, product, total }) {
  const cover = productCover(product);
  const colors = productColors(product);
  const visibleColors = colors.slice(0, 4);
  const primary = product.cardColor || colors[0] || "#30c7c9";
  const accent = colors[1] || "#e84b94";
  const isSelected = Number.isInteger(index);

  return (
    <article
      className="admin-storefront-product-card"
      style={{ "--product-color": primary, "--product-accent": accent }}
    >
      <div className="admin-storefront-product-image">
        {cover?.url
          ? <img src={cover.url} alt={cover.name || product.name || "Produit"} />
          : <span aria-hidden="true">{categoryIcon(product.category)}</span>}
      </div>
      <div className="admin-storefront-product-info">
        <small>{isSelected ? `#${index + 1}` : "CATALOGUE"}</small>
        <strong>{product.name || "Produit sans nom"}</strong>
        <p>À partir de <b>{product.price || "prix à définir"}</b></p>
        {!!visibleColors.length && (
          <div className="admin-storefront-swatches" aria-label="Couleurs offertes">
            {visibleColors.map((color) => (
              <i key={color} style={{ "--swatch": color }} />
            ))}
            {colors.length > 4 && <em>+{colors.length - 4}</em>}
          </div>
        )}
      </div>
      <div className="admin-storefront-product-actions">
        {isSelected ? (
          <>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onMove(-1);
              }}
              disabled={index === 0}
              aria-label="Monter"
            >↑</button>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onMove(1);
              }}
              disabled={index === total - 1}
              aria-label="Descendre"
            >↓</button>
            <button
              type="button"
              className="danger"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRemove();
              }}
            >Retirer</button>
          </>
        ) : (
          <button type="button" className="primary" onClick={onAdd}>Ajouter</button>
        )}
      </div>
    </article>
  );
}

function CategoryCard({
  category,
  config,
  onMove,
  onOpenPhoto,
  onToggle,
}) {
  const selected = config.categories.includes(category.id);
  const selectedIndex = config.categories.indexOf(category.id);

  return (
    <article
      className="admin-storefront-category-shell"
      style={{ "--category-color": category.color, "--swipe": "0px" }}
    >
      <div className="admin-storefront-category-card">
        <div className="admin-storefront-category-main">
          <button
            type="button"
            className="admin-storefront-category-photo"
            onClick={onOpenPhoto}
            aria-label={`Modifier la photo de ${category.label}`}
          >
            {category.photo?.preview
              ? <img src={category.photo.preview} alt={category.photo.name || category.label} />
              : <span aria-hidden="true">{category.icon}</span>}
          </button>
          <button type="button" className="admin-storefront-category-text" onClick={onToggle}>
            <strong>{category.label}</strong>
            <small>{selected ? `Position ${selectedIndex + 1}` : "Masquée"}</small>
          </button>
        </div>
        <div className="admin-storefront-order-actions">
          <button type="button" onClick={() => onMove(-1)} disabled={!selected || selectedIndex === 0}>↑</button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={!selected || selectedIndex === config.categories.length - 1}
          >
            ↓
          </button>
        </div>
      </div>
    </article>
  );
}

function Modal({ children, className = "", onClose }) {
  return (
    <div className="admin-storefront-modal-backdrop" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`admin-storefront-modal ${className}`} role="dialog" aria-modal="true">
        <button type="button" className="admin-storefront-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        {children}
      </section>
    </div>
  );
}

function CategoryPhotoModal({ category, onClose, onSave }) {
  const [draft, setDraft] = useState(() => normalizePhoto(category.photo));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const inputRef = useRef(null);
  const imageRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const current = useRef(draft);
  current.current = draft;

  useEffect(() => {
    const mediaId = category.photo?.mediaId;
    if (!mediaId) return undefined;
    let active = true;
    loadImage(mediaId).then((source) => {
      if (!active || !source) return;
      setDraft((photo) => photo ? {
        ...photo,
        mediaId,
        src: source,
        original: source,
      } : photo);
    });
    return () => {
      active = false;
    };
  }, [category.photo?.mediaId]);

  const loadFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const importedSrc = String(reader.result || "");
      const image = new Image();
      image.onload = () => {
        const maxSize = 1024;
        const ratio = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext("2d");
        let src = importedSrc;
        if (context) {
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          src = canvas.toDataURL("image/jpeg", 0.84);
        }
        setDraft({
          name: file.name,
          src,
          original: src,
          preview: src,
          x: 0,
          y: 0,
          scale: 1,
          naturalWidth: canvas.width,
          naturalHeight: canvas.height,
        });
      };
      image.onerror = () => setDraft({
        name: file.name,
        src: importedSrc,
        original: importedSrc,
        preview: importedSrc,
        x: 0,
        y: 0,
        scale: 1,
        naturalWidth: 0,
        naturalHeight: 0,
      });
      image.src = importedSrc;
    };
    reader.readAsDataURL(file);
  };

  const beginGesture = (event) => {
    if (!draft?.src) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    if (points.length === 1) {
      gesture.current = { mode: "pan", start: points[0], x: draft.x, y: draft.y };
    } else if (points.length === 2) {
      gesture.current = {
        mode: "pinch",
        distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
        scale: draft.scale,
      };
    }
  };

  const moveGesture = (event) => {
    if (!pointers.current.has(event.pointerId) || !current.current?.src) return;
    event.preventDefault();
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const state = gesture.current;
    if (points.length === 1 && state?.mode === "pan") {
      setDraft((photo) => ({
        ...photo,
        x: state.x + points[0].x - state.start.x,
        y: state.y + points[0].y - state.start.y,
      }));
    } else if (points.length === 2 && state?.mode === "pinch") {
      const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      setDraft((photo) => ({
        ...photo,
        scale: Math.max(0.2, Math.min(5, state.scale * (distance / Math.max(1, state.distance)))),
      }));
    }
  };

  const endGesture = (event) => {
    pointers.current.delete(event.pointerId);
    const points = [...pointers.current.values()];
    if (points.length === 1 && current.current) {
      gesture.current = {
        mode: "pan",
        start: points[0],
        x: current.current.x,
        y: current.current.y,
      };
    } else if (!points.length) {
      gesture.current = null;
    }
  };

  const buildPreview = () => {
    if (!draft?.src || !imageRef.current) return draft;
    const image = imageRef.current;
    const output = 164;
    const canvas = document.createElement("canvas");
    canvas.width = output;
    canvas.height = output;
    const context = canvas.getContext("2d");
    if (!context) return draft;
    const width = draft.naturalWidth || image.naturalWidth;
    const height = draft.naturalHeight || image.naturalHeight;
    const baseScale = Math.max(CROP_SIZE / width, CROP_SIZE / height);
    const finalScale = baseScale * draft.scale;
    const drawnWidth = width * finalScale * (output / CROP_SIZE);
    const drawnHeight = height * finalScale * (output / CROP_SIZE);
    context.drawImage(
      image,
      (output - drawnWidth) / 2 + draft.x * (output / CROP_SIZE),
      (output - drawnHeight) / 2 + draft.y * (output / CROP_SIZE),
      drawnWidth,
      drawnHeight,
    );
    return { ...draft, preview: canvas.toDataURL("image/jpeg", 0.86) };
  };

  const confirmPhoto = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(buildPreview());
    } catch (error) {
      console.error("[KALEIDO] storefront category photo save error:", error);
      setSaveError("La photo n’a pas pu être enregistrée. Réessaie.");
      setSaving(false);
    }
  };

  const naturalWidth = draft?.naturalWidth || CROP_SIZE;
  const naturalHeight = draft?.naturalHeight || CROP_SIZE;
  const baseScale = Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight);

  return (
    <Modal className="admin-storefront-photo-modal" onClose={onClose}>
      <span>{category.label}</span>
      <h2>Photo de catégorie</h2>
      <div
        className="admin-storefront-photo-crop"
        style={{ "--category-color": category.color }}
        onPointerDown={beginGesture}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
      >
        {draft?.src ? (
          <img
            ref={imageRef}
            src={draft.src}
            alt={draft.name || category.label}
            draggable={false}
            style={{
              width: `${naturalWidth * baseScale}px`,
              height: `${naturalHeight * baseScale}px`,
              transform: `translate(calc(-50% + ${draft.x}px), calc(-50% + ${draft.y}px)) scale(${draft.scale})`,
            }}
          />
        ) : <strong aria-hidden="true">{category.icon}</strong>}
      </div>
      <p className="admin-storefront-photo-hint">
        {draft?.src ? "Glisse et pince la photo pour la cadrer." : "Importe une photo pour la cadrer."}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => loadFile(event.target.files?.[0])}
      />
      <div className="admin-storefront-photo-actions">
        <button type="button" className="primary" onClick={() => inputRef.current?.click()}>
          {draft?.src ? "Remplacer" : "Importer"}
        </button>
        <button type="button" className="danger" disabled={!draft?.src} onClick={() => setConfirmDelete(true)}>
          Supprimer
        </button>
        <button type="button" className="confirm" disabled={saving} onClick={confirmPhoto}>
          {saving ? "Enregistrement..." : "Confirmer"}
        </button>
      </div>
      {saveError && <p className="admin-storefront-photo-error" role="status">{saveError}</p>}
      {confirmDelete && (
        <div className="admin-storefront-delete-confirm">
          <section>
            <button type="button" onClick={() => setConfirmDelete(false)} aria-label="Fermer">×</button>
            <span>{category.label}</span>
            <h3>Supprimer la photo?</h3>
            <p>La catégorie reviendra à son icône de base.</p>
            <div>
              <button type="button" onClick={() => setConfirmDelete(false)}>Annuler</button>
              <button type="button" onClick={() => {
                setDraft(null);
                setConfirmDelete(false);
              }}>Supprimer</button>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}

export default function AdminStorefrontScreen({ navigation }) {
  const [config, setConfig] = useState(() => cleanConfig(readStorefrontHomeConfig()));
  const [products, setProducts] = useState(readStorefrontProducts);
  const [photoCategoryId, setPhotoCategoryId] = useState(null);
  const [productPicker, setProductPicker] = useState(false);

  useEffect(() => {
    const refreshProducts = () => setProducts(readStorefrontProducts());
    const refreshConfig = () => setConfig(cleanConfig(readStorefrontHomeConfig()));
    const refreshStorage = (event) => {
      if (!event.key || event.key === STOREFRONT_PRODUCTS_KEY) refreshProducts();
      if (!event.key || event.key === STOREFRONT_HOME_CONFIG_KEY) refreshConfig();
    };
    window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshProducts);
    window.addEventListener(STOREFRONT_HOME_CONFIG_CHANGED_EVENT, refreshConfig);
    window.addEventListener("storage", refreshStorage);
    hydrateStorefrontFromCloud().then((result) => {
      if (!result.ok) return;
      refreshProducts();
      refreshConfig();
    });
    return () => {
      window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshProducts);
      window.removeEventListener(STOREFRONT_HOME_CONFIG_CHANGED_EVENT, refreshConfig);
      window.removeEventListener("storage", refreshStorage);
    };
  }, []);

  const saveConfig = (next) => {
    const cleaned = cleanConfig(next);
    const persisted = writeStorefrontHomeConfig(cleaned);
    setConfig(cleanConfig(persisted));
    return persisted;
  };

  const moveFeaturedProduct = (productId, direction) => {
    const latestConfig = cleanConfig(readStorefrontHomeConfig());
    const currentCatalogIds = new Set(
      readStorefrontProducts().filter(isCatalogProduct).map((product) => String(product.id)),
    );
    const seen = new Set();
    const orderedIds = latestConfig.featuredProductIds.filter((id) => {
      const normalizedId = String(id);
      if (!currentCatalogIds.has(normalizedId) || seen.has(normalizedId)) return false;
      seen.add(normalizedId);
      return true;
    });
    const currentIndex = orderedIds.indexOf(String(productId));
    const nextIds = moveItem(orderedIds, currentIndex, direction);
    if (nextIds === orderedIds) return;
    saveConfig({ ...latestConfig, featuredProductIds: nextIds });
  };

  const removeFeaturedProduct = (productId) => {
    const latestConfig = cleanConfig(readStorefrontHomeConfig());
    saveConfig({
      ...latestConfig,
      featuredProductIds: latestConfig.featuredProductIds
        .map(String)
        .filter((id) => id !== String(productId)),
    });
  };

  const categories = useMemo(() => {
    const all = allCategoriesFrom(config);
    const orderedIds = [
      ...config.categories,
      ...all.map((category) => category.id).filter((id) => !config.categories.includes(id)),
    ];
    return orderedIds.map((id) => all.find((category) => category.id === id)).filter(Boolean);
  }, [config]);

  const catalog = useMemo(() => products.filter(isCatalogProduct), [products]);
  const selected = useMemo(() => (
    config.featuredProductIds
      .map((id) => catalog.find((product) => String(product.id) === String(id)))
      .filter(Boolean)
  ), [catalog, config.featuredProductIds]);
  const selectedIds = new Set(selected.map((product) => String(product.id)));
  const available = catalog.filter((product) => !selectedIds.has(String(product.id)));
  const activePhotoCategory = categories.find((category) => category.id === photoCategoryId);

  return (
    <AdminLayout onBack={navigation.goBack} title="Accueil">
      <div className="admin-storefront-content">
        <section className="admin-storefront-section">
          <header>
            <h2>Catégories affichées</h2>
            <p>Choisir et organiser le carrousel</p>
          </header>
          <div className="admin-storefront-category-list">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                config={config}
                onOpenPhoto={() => setPhotoCategoryId(category.id)}
                onToggle={() => saveConfig({
                  ...config,
                  categories: config.categories.includes(category.id)
                    ? config.categories.filter((id) => id !== category.id)
                    : [...config.categories, category.id],
                })}
                onMove={(direction) => saveConfig({
                  ...config,
                  categories: moveItem(config.categories, config.categories.indexOf(category.id), direction),
                })}
              />
            ))}
          </div>
        </section>

        <section className="admin-storefront-section">
          <header>
            <h2>Nos populaires</h2>
            <p>Cartes visibles sur la première page</p>
          </header>
          <div className="admin-storefront-product-list">
            <button
              type="button"
              className={`admin-storefront-add-product${selected.length ? " has-products" : ""}`}
              onClick={() => setProductPicker(true)}
            >
              {selected.length ? "Ajouter des produits" : "Ajouter un produit"}
            </button>
            {selected.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                total={selected.length}
                onMove={(direction) => moveFeaturedProduct(product.id, direction)}
                onRemove={() => removeFeaturedProduct(product.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {activePhotoCategory && (
        <CategoryPhotoModal
          category={activePhotoCategory}
          onClose={() => setPhotoCategoryId(null)}
          onSave={async (photo) => {
            const mediaId = `storefront-category-${activePhotoCategory.id}`;
            const photos = { ...config.categoryPhotos };
            if (photo) {
              const original = photo.original || photo.src || photo.preview;
              photos[activePhotoCategory.id] = {
                name: photo.name || "",
                mediaId,
                preview: photo.preview || original || "",
                x: photo.x,
                y: photo.y,
                scale: photo.scale,
                naturalWidth: photo.naturalWidth,
                naturalHeight: photo.naturalHeight,
              };
              saveConfig({ ...config, categoryPhotos: photos });
              setPhotoCategoryId(null);
              if (original) await saveImage(mediaId, original);
            } else {
              delete photos[activePhotoCategory.id];
              saveConfig({ ...config, categoryPhotos: photos });
              setPhotoCategoryId(null);
              await deleteImage(mediaId);
            }
          }}
        />
      )}

      {productPicker && (
        <Modal className="admin-storefront-picker" onClose={() => setProductPicker(false)}>
          <span>Catalogue</span>
          <h2>Ajouter aux populaires</h2>
          <p>Sélectionne les produits qui doivent apparaître sur la page d’accueil.</p>
          <div className="admin-storefront-picker-list">
            {available.length ? available.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => saveConfig({
                  ...config,
                  featuredProductIds: [...config.featuredProductIds, String(product.id)],
                })}
              />
            )) : (
              <div className="admin-storefront-empty">
                <strong>{catalog.length ? "Tous les produits sont déjà ajoutés" : "Aucun produit au catalogue"}</strong>
                <p>{catalog.length
                  ? "Ferme cette fenêtre pour réorganiser les produits choisis."
                  : "Finalise un produit dans le module Produits pour le rendre disponible ici."}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
