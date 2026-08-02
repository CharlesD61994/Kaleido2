import React, { useEffect, useMemo, useState } from "react";
import {
  hydrateStorefrontFromCloud,
  readStorefrontHomeConfig,
  readStorefrontProducts,
  STOREFRONT_HOME_CONFIG_CHANGED_EVENT,
  STOREFRONT_HOME_CONFIG_KEY,
  STOREFRONT_PRODUCTS_CHANGED_EVENT,
  STOREFRONT_PRODUCTS_KEY,
  writeStorefrontHomeConfig,
  writeStorefrontProducts,
} from "../../services/storefrontAdminStore";
import AdminLayout from "./AdminLayout";
import "./AdminCatalogScreen.css";

const DEFAULT_CATEGORIES = [
  { id: "vetements", label: "Vêtements", color: "#7c3aed", icon: "◆" },
  { id: "peluches", label: "Peluches crochetées", color: "#e84b94", icon: "●" },
  { id: "pantoufles", label: "Pantoufles", color: "#30c7c9", icon: "◒" },
  { id: "porte-cles", label: "Porte-clés", color: "#f4831f", icon: "◇" },
  { id: "couvertures", label: "Couvertures", color: "#8bbf3f", icon: "▧" },
];
const CATEGORY_ICONS = ["✦", "◌", "●", "◒", "◇", "▧", "◆"];

const slugify = (value) => String(value || "categorie")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 34) || "categorie";

const normalizeText = (value) => String(value || "")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

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

const taxonomyItemsFrom = (raw, key) => (
  Array.isArray(raw?.[key])
    ? raw[key]
      .filter((item) => item?.id && item?.label)
      .map((item) => ({
        id: String(item.id),
        label: String(item.label),
        color: item.color || (key === "collections" ? "#e84b94" : "#30c7c9"),
        ...(key === "subcategories" ? { categoryId: String(item.categoryId || "") } : {}),
      }))
    : []
);

const cleanConfig = (raw) => ({
  categories: Array.isArray(raw?.categories)
    ? raw.categories.map(String)
    : DEFAULT_CATEGORIES.map((category) => category.id),
  customCategories: customCategoriesFrom(raw),
  subcategories: taxonomyItemsFrom(raw, "subcategories"),
  collections: taxonomyItemsFrom(raw, "collections"),
  categoryColors: raw?.categoryColors || {},
  categoryPhotos: raw?.categoryPhotos || {},
  featuredProductIds: Array.isArray(raw?.featuredProductIds)
    ? raw.featuredProductIds.map(String)
    : [],
  shopify: raw?.shopify && typeof raw.shopify === "object" ? raw.shopify : null,
});

const allCategoriesFrom = (config) => (
  [...DEFAULT_CATEGORIES, ...customCategoriesFrom(config)].map((category) => ({
    ...category,
    color: config?.categoryColors?.[category.id] || category.color,
  }))
);

function Modal({ children, onClose }) {
  return (
    <div className="admin-catalog-modal-backdrop" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="admin-catalog-modal" role="dialog" aria-modal="true">
        <button type="button" className="admin-catalog-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        {children}
      </section>
    </div>
  );
}

function EditorModal({ categories, item, type, onClose, onSave }) {
  const isCategory = type === "category";
  const isSubcategory = type === "subcategory";
  const [label, setLabel] = useState(item?.label || "");
  const [color, setColor] = useState(item?.color || (type === "collection" ? "#e84b94" : "#30c7c9"));
  const [categoryId, setCategoryId] = useState(item?.categoryId || categories[0]?.id || "");
  const typeLabel = isCategory ? "catégorie" : isSubcategory ? "sous-catégorie" : "collection";

  return (
    <Modal onClose={onClose}>
      <span>Catalogue</span>
      <h2>{item ? "Modifier" : "Ajouter"} une {typeLabel}</h2>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!label.trim() || (isSubcategory && !categoryId)) return;
        onSave({
          id: item?.id || slugify(label),
          label: label.trim(),
          color,
          ...(isSubcategory ? { categoryId } : {}),
        });
      }}>
        <label>
          <span>Nom</span>
          <input
            autoFocus
            type="text"
            value={label}
            placeholder={isCategory ? "Ex: Bonnets" : isSubcategory ? "Ex: Animaux" : "Ex: Noël"}
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        {isSubcategory && (
          <label>
            <span>Catégorie principale</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </label>
        )}
        <label className="admin-catalog-color-field">
          <span>Couleur</span>
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </label>
        <button type="submit">Enregistrer</button>
      </form>
    </Modal>
  );
}

function TaxonomySection({ description, items, categoryMap, title, type, onAdd, onEdit, onRemove }) {
  return (
    <section className="admin-catalog-section">
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="admin-catalog-taxonomy-grid">
        {items.map((item) => (
          <article key={item.id} style={{ "--item-color": item.color }}>
            <button type="button" onClick={() => onEdit(type, item)}>
              <i aria-hidden="true" />
              <span>
                <strong>{item.label}</strong>
                {item.categoryId && <small>{categoryMap.get(String(item.categoryId)) || "Catégorie retirée"}</small>}
              </span>
            </button>
            <button type="button" onClick={() => onRemove(type, item)} aria-label={`Retirer ${item.label}`}>×</button>
          </article>
        ))}
        <button className="admin-catalog-add-card" type="button" onClick={() => onAdd(type)}>
          <span>+</span>
          <strong>Ajouter</strong>
        </button>
      </div>
    </section>
  );
}

export default function AdminCatalogScreen({ navigation }) {
  const [config, setConfig] = useState(() => cleanConfig(readStorefrontHomeConfig()));
  const [products, setProducts] = useState(readStorefrontProducts);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const refreshProducts = () => setProducts(readStorefrontProducts());
    const refreshConfig = () => setConfig(cleanConfig(readStorefrontHomeConfig()));
    const onStorage = (event) => {
      if (!event.key || event.key === STOREFRONT_PRODUCTS_KEY) refreshProducts();
      if (!event.key || event.key === STOREFRONT_HOME_CONFIG_KEY) refreshConfig();
    };
    window.addEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshProducts);
    window.addEventListener(STOREFRONT_HOME_CONFIG_CHANGED_EVENT, refreshConfig);
    window.addEventListener("storage", onStorage);
    hydrateStorefrontFromCloud().then((result) => {
      if (result.ok) {
        refreshProducts();
        refreshConfig();
      }
    });
    return () => {
      window.removeEventListener(STOREFRONT_PRODUCTS_CHANGED_EVENT, refreshProducts);
      window.removeEventListener(STOREFRONT_HOME_CONFIG_CHANGED_EVENT, refreshConfig);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const categories = useMemo(() => allCategoriesFrom(config), [config]);
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.label])),
    [categories],
  );

  const saveConfig = (next) => {
    const persisted = writeStorefrontHomeConfig(cleanConfig(next));
    setConfig(cleanConfig(persisted));
  };

  const saveItem = (type, item) => {
    if (type === "category") {
      const existing = new Set(categories.map((category) => category.id));
      let id = item.id;
      let suffix = 2;
      while (!editor?.item && existing.has(id)) {
        id = `${item.id}-${suffix}`;
        suffix += 1;
      }
      const custom = {
        ...item,
        id,
        icon: editor?.item?.icon || CATEGORY_ICONS[config.customCategories.length % CATEGORY_ICONS.length],
        custom: true,
      };
      saveConfig({
        ...config,
        categoryColors: { ...config.categoryColors, [id]: item.color },
        customCategories: editor?.item
          ? config.customCategories.map((category) => (category.id === item.id ? custom : category))
          : [...config.customCategories, custom],
      });
      setEditor(null);
      return;
    }

    const key = type === "subcategory" ? "subcategories" : "collections";
    const currentItems = config[key] || [];
    const existing = currentItems.some((entry) => entry.id === item.id);
    const ids = new Set(currentItems.map((entry) => entry.id));
    let id = item.id;
    let suffix = 2;
    while (!existing && ids.has(id)) {
      id = `${item.id}-${suffix}`;
      suffix += 1;
    }
    saveConfig({
      ...config,
      [key]: existing
        ? currentItems.map((entry) => (entry.id === item.id ? { ...item, id } : entry))
        : [...currentItems, { ...item, id }],
    });
    setEditor(null);
  };

  const removeCategory = (category) => {
    const assigned = products.filter((product) => (
      normalizeText(product.category) === normalizeText(category.id)
      || normalizeText(product.category) === normalizeText(category.label)
    ));
    if (assigned.length) {
      window.alert(`Cette catégorie est utilisée par ${assigned.length} produit${assigned.length === 1 ? "" : "s"}. Change d’abord leur catégorie.`);
      return;
    }
    if (!window.confirm(`Retirer « ${category.label} » du catalogue?`)) return;
    const categoryPhotos = { ...config.categoryPhotos };
    const categoryColors = { ...config.categoryColors };
    delete categoryPhotos[category.id];
    delete categoryColors[category.id];
    saveConfig({
      ...config,
      categories: config.categories.filter((id) => id !== category.id),
      customCategories: config.customCategories.filter((item) => item.id !== category.id),
      subcategories: config.subcategories.filter((item) => item.categoryId !== category.id),
      categoryPhotos,
      categoryColors,
    });
  };

  const removeTaxonomy = (type, item) => {
    if (!window.confirm(`Retirer « ${item.label} »?`)) return;
    const key = type === "subcategory" ? "subcategories" : "collections";
    const productKey = type === "subcategory" ? "subcategoryIds" : "collectionIds";
    saveConfig({ ...config, [key]: config[key].filter((entry) => entry.id !== item.id) });
    setProducts(writeStorefrontProducts(products.map((product) => ({
      ...product,
      [productKey]: (product[productKey] || []).filter((id) => String(id) !== String(item.id)),
    }))));
  };

  return (
    <AdminLayout onBack={navigation.goBack} title="Catalogue">
      <div className="admin-catalog-content">
        <section className="admin-catalog-section">
          <header>
            <h2>Catégories</h2>
            <p>Les grandes familles utilisées pour classer les produits</p>
          </header>
          <div className="admin-catalog-category-grid">
            {categories.map((category) => {
              const count = products.filter((product) => (
                normalizeText(product.category) === normalizeText(category.id)
                || normalizeText(product.category) === normalizeText(category.label)
              )).length;
              return (
                <article key={category.id} style={{ "--item-color": category.color }}>
                  <span aria-hidden="true">{category.icon}</span>
                  <div>
                    <strong>{category.label}</strong>
                    <small>{count} produit{count === 1 ? "" : "s"}</small>
                  </div>
                  <label title="Changer la couleur">
                    <i style={{ "--swatch": category.color }} />
                    <input
                      type="color"
                      value={category.color}
                      onChange={(event) => saveConfig({
                        ...config,
                        categoryColors: { ...config.categoryColors, [category.id]: event.target.value },
                        customCategories: config.customCategories.map((item) => (
                          item.id === category.id ? { ...item, color: event.target.value } : item
                        )),
                      })}
                    />
                  </label>
                  {category.custom && (
                    <button type="button" onClick={() => removeCategory(category)} aria-label={`Retirer ${category.label}`}>×</button>
                  )}
                </article>
              );
            })}
            <button className="admin-catalog-add-card is-category" type="button" onClick={() => setEditor({ type: "category", item: null })}>
              <span>+</span>
              <strong>Ajouter une catégorie</strong>
            </button>
          </div>
        </section>

        <TaxonomySection
          title="Sous-catégories"
          description="Des choix plus précis à l’intérieur d’une catégorie"
          items={config.subcategories}
          categoryMap={categoryMap}
          type="subcategory"
          onAdd={(type) => setEditor({ type, item: null })}
          onEdit={(type, item) => setEditor({ type, item })}
          onRemove={removeTaxonomy}
        />

        <TaxonomySection
          title="Collections"
          description="Des regroupements saisonniers ou thématiques"
          items={config.collections}
          categoryMap={categoryMap}
          type="collection"
          onAdd={(type) => setEditor({ type, item: null })}
          onEdit={(type, item) => setEditor({ type, item })}
          onRemove={removeTaxonomy}
        />
      </div>

      {editor && (
        <EditorModal
          categories={categories}
          item={editor.item}
          type={editor.type}
          onClose={() => setEditor(null)}
          onSave={(item) => saveItem(editor.type, item)}
        />
      )}
    </AdminLayout>
  );
}
