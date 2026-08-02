import React, { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import {
  readStorefrontHomeConfig,
  readStorefrontProducts,
  writeStorefrontHomeConfig,
  writeStorefrontProducts,
} from "../../services/storefrontAdminStore";
import AdminHeader from "./AdminHeader";
import AdminLayout from "./AdminLayout";
import "./AdminProductEditorScreen.css";

const PRODUCT_OPTIONS = [
  { id: "mainColor", label: "Couleur principale", color: "#f05b4f" },
  { id: "accentColor", label: "Couleur secondaire", color: "#30c7c9" },
  { id: "recipient", label: "Pour qui ?", color: "#e84b94" },
  { id: "shoeSize", label: "Pointure", color: "#7c3aed" },
  { id: "keychain", label: "Porte-clé", color: "#f3b51b" },
  { id: "personalization", label: "Personnalisation", color: "#8bbf3f" },
  { id: "finish", label: "Finition", color: "#f4831f" },
  { id: "delay", label: "Délai", color: "#188f91" },
];

const CHOICE_OPTIONS = {
  recipient: {
    label: "Pour qui ?",
    placeholder: "Ajouter un public",
    values: ["Femme", "Homme", "Enfant", "Bébé"],
  },
};

const SHOE_SIZE_GROUPS = {
  Femme: ["5", "5,5", "6", "6,5", "7", "7,5", "8", "8,5", "9", "9,5", "10", "10,5", "11", "12"],
  Homme: ["6", "6,5", "7", "7,5", "8", "8,5", "9", "9,5", "10", "10,5", "11", "11,5", "12", "13", "14"],
  Enfant: [
    "5 enfant", "6 enfant", "7 enfant", "8 enfant", "9 enfant", "10 enfant", "11 enfant",
    "12 enfant", "13 enfant", "1 jeunesse", "2 jeunesse", "3 jeunesse", "4 jeunesse",
    "5 jeunesse", "6 jeunesse", "7 jeunesse",
  ],
};

const emptyShoeSizeChoices = () => Object.fromEntries(
  Object.keys(SHOE_SIZE_GROUPS).map((audience) => [audience, []]),
);

const selectAllShoeSizes = (current = {}, audiences = Object.keys(SHOE_SIZE_GROUPS)) => ({
  ...emptyShoeSizeChoices(),
  ...current,
  ...Object.fromEntries(
    audiences
      .filter((audience) => SHOE_SIZE_GROUPS[audience])
      .map((audience) => [audience, [...SHOE_SIZE_GROUPS[audience]]]),
  ),
});

const normalizeShoeSizeChoices = (source = {}) => {
  const stored = source.shoeSizeChoices || {};
  const normalized = Object.fromEntries(
    Object.keys(SHOE_SIZE_GROUPS).map((audience) => [
      audience,
      Array.isArray(stored[audience]) ? [...stored[audience]] : [],
    ]),
  );
  if (!source.options?.includes("shoeSize") || source.shoeSizeDefaultsInitialized) {
    return normalized;
  }
  const selectedAudiences = source.options.includes("recipient")
    ? (Array.isArray(source.optionChoices?.recipient) ? source.optionChoices.recipient : [])
    : Object.keys(SHOE_SIZE_GROUPS);
  return selectAllShoeSizes(normalized, selectedAudiences);
};

const COLOR_SECTIONS = {
  mainColor: { key: "main", storeKey: "mainColors", title: "Couleur principale" },
  accentColor: { key: "accent", storeKey: "accentColors", title: "Couleur secondaire" },
};

const DEFAULT_PRODUCT_CATEGORIES = [
  { id: "vetements", label: "Vêtements" },
  { id: "peluches", label: "Peluches crochetées" },
  { id: "pantoufles", label: "Pantoufles" },
  { id: "porte-cles", label: "Porte-clés" },
  { id: "couvertures", label: "Couvertures" },
];

const storefrontTaxonomy = (config = {}) => {
  const customCategories = Array.isArray(config.customCategories) ? config.customCategories : [];
  const categories = [...DEFAULT_PRODUCT_CATEGORIES, ...customCategories]
    .filter((category, index, all) => (
      category?.id
      && category?.label
      && all.findIndex((item) => String(item.id) === String(category.id)) === index
    ));
  return {
    categories,
    subcategories: Array.isArray(config.subcategories) ? config.subcategories : [],
    collections: Array.isArray(config.collections) ? config.collections : [],
  };
};

const categoryIdentity = (category) => String(category || "")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const patternTitle = (patron) => patron?.titre || patron?.title || patron?.nom || patron?.name || "Patron sans nom";
const patternType = (patron) => (
  patron?.projectType === "pdf" || patron?.type === "pdf" || patron?.pdfData || patron?.pdfUrl
    ? "PDF"
    : "Personnalisé"
);
const patternImage = (patron) => {
  const source = patron?.image || patron?.photo || patron?.imageUrl || patron?.cover;
  return typeof source === "string" ? source : source?.url || source?.preview || "";
};

const newId = () => window.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random()}`;

const formatProductPrice = (value) => {
  const price = String(value || "").trim();
  if (!price) return "Prix à définir";
  return /[$€£]/.test(price) ? price : `${price} $`;
};

const parseProductPrice = (value) => {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
};

const formatCalculatedPrice = (basePrice, adjustment = 0) => {
  const baseAmount = parseProductPrice(basePrice);
  const adjustmentAmount = parseProductPrice(adjustment) ?? 0;
  if (baseAmount === null) return formatProductPrice(basePrice);
  return `${new Intl.NumberFormat("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baseAmount + adjustmentAmount)} $`;
};

const normalizeShopifyConnection = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    const productId = String(value.productId || value.id || "").trim();
    if (!productId) return null;
    return {
      productId,
      domain: String(value.domain || "").trim().toLowerCase(),
      connectedAt: value.connectedAt || "",
    };
  }
  const productId = String(value).trim();
  return productId ? { productId, domain: "", connectedAt: "" } : null;
};

const normalizeShopifyStore = (value) => {
  if (!value || typeof value !== "object") return null;
  const domain = String(value.domain || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const storefrontAccessToken = String(value.storefrontAccessToken || "").trim();
  if (!domain || !storefrontAccessToken) return null;
  return { domain, storefrontAccessToken };
};

const parseShopifyBuyButtonCode = (source) => {
  const code = String(source || "").trim();
  if (!code) throw new Error("Colle d'abord le code complet généré par Shopify.");

  const domainMatch = code.match(/\bdomain\s*:\s*["'`]([^"'`]+)["'`]/i);
  const tokenMatch = code.match(/\bstorefrontAccessToken\s*:\s*["'`]([^"'`]+)["'`]/i);
  const componentMatch = code.match(
    /createComponent\s*\(\s*["'`]product["'`]\s*,\s*\{[\s\S]*?\bid\s*:\s*["'`]([^"'`]+)["'`]/i,
  );

  const domain = String(domainMatch?.[1] || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const storefrontAccessToken = String(tokenMatch?.[1] || "").trim();
  const rawProductId = String(componentMatch?.[1] || "").trim();
  const productId = rawProductId.split("/").filter(Boolean).pop() || "";

  if (!domain || !domain.includes(".")) {
    throw new Error("Le domaine Shopify n'a pas été trouvé dans ce code.");
  }
  if (!storefrontAccessToken) {
    throw new Error("Le jeton public Storefront n'a pas été trouvé dans ce code.");
  }
  if (!productId) {
    throw new Error("L'identifiant du produit Shopify n'a pas été trouvé dans ce code.");
  }

  return { domain, storefrontAccessToken, productId };
};

const normalizePhoto = (photo) => (
  typeof photo === "string"
    ? { id: newId(), name: photo, url: "" }
    : { id: photo?.id || newId(), name: photo?.name || "Photo", url: photo?.url || "" }
);

const readLegacyColorStore = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem("kaleido-storefront-custom-colors") || "{}");
    if (Array.isArray(parsed)) return { mainColors: parsed, accentColors: [] };
    return parsed || {};
  } catch {
    return {};
  }
};

const productColorsForSection = (product, optionId) => {
  const section = COLOR_SECTIONS[optionId];
  const values = product?.colors?.[section.key] || [];
  const productColors = product?.colorPhotos || [];
  const legacyColors = readLegacyColorStore()[section.storeKey] || [];

  return values.map((value, index) => {
    const source = productColors.find((color) => color.value === value)
      || legacyColors.find((color) => color.value === value)
      || {};
    return {
      id: source.id || newId(),
      label: source.label || `Couleur ${index + 1}`,
      value,
      photos: (source.photos || []).map(normalizePhoto),
    };
  });
};

const createEmptyProduct = () => ({
  id: null,
  name: "",
  category: DEFAULT_PRODUCT_CATEGORIES[0].label,
  patternId: "",
  patternSnapshot: null,
  subcategoryIds: [],
  collectionIds: [],
  price: "",
  description: "",
  shopify: null,
  options: [],
  optionChoices: {},
  shoeSizeChoices: emptyShoeSizeChoices(),
  shoeSizeDefaultsInitialized: false,
  optionPrices: { keychain: "" },
  productPhotos: [],
  colorPhotos: [],
  colors: { main: [], accent: [] },
  status: "draft",
  inCatalog: false,
});

const createEditorState = (product) => {
  const source = product || createEmptyProduct();
  return {
    ...createEmptyProduct(),
    ...source,
    shopify: normalizeShopifyConnection(source.shopify),
    options: [...(source.options || [])],
    optionPrices: {
      keychain: String(source.optionPrices?.keychain || ""),
    },
    optionChoices: Object.fromEntries(
      Object.entries(source.optionChoices || {}).map(([key, values]) => [
        key,
        Array.isArray(values) ? [...values] : [],
      ]),
    ),
    shoeSizeChoices: normalizeShoeSizeChoices(source),
    shoeSizeDefaultsInitialized: source.options?.includes("shoeSize")
      ? true
      : Boolean(source.shoeSizeDefaultsInitialized),
    productPhotos: (source.productPhotos || []).map(normalizePhoto),
    subcategoryIds: Array.isArray(source.subcategoryIds) ? [...source.subcategoryIds] : [],
    collectionIds: Array.isArray(source.collectionIds) ? [...source.collectionIds] : [],
    colorGroups: {
      mainColor: productColorsForSection(source, "mainColor"),
      accentColor: productColorsForSection(source, "accentColor"),
    },
  };
};

const productFromEditor = (editor, previous = null) => {
  const now = new Date().toISOString();
  const colorPhotos = Object.values(editor.colorGroups)
    .flat()
    .map((color) => ({
      id: color.id,
      label: color.label,
      value: color.value,
      photos: (color.photos || []).map(normalizePhoto),
    }));
  const product = {
    ...editor,
    id: editor.id || "kaleido-live-product-preview",
    name: editor.name.trim() || "Produit sans nom",
    price: editor.price.trim(),
    description: editor.description.trim(),
    shopify: normalizeShopifyConnection(editor.shopify),
    colors: {
      main: editor.options.includes("mainColor")
        ? editor.colorGroups.mainColor.map((color) => color.value)
        : [],
      accent: editor.options.includes("accentColor")
        ? editor.colorGroups.accentColor.map((color) => color.value)
        : [],
    },
    colorPhotos,
    status: previous?.status || editor.status || "draft",
    inCatalog: previous?.inCatalog ?? editor.inCatalog ?? false,
    createdAt: previous?.createdAt || editor.createdAt || now,
    updatedAt: now,
  };
  delete product.colorGroups;
  return product;
};

const compressPhoto = (file) => new Promise((resolve) => {
  const fallback = () => resolve({ id: newId(), name: file.name, url: "" });
  const reader = new FileReader();
  const image = new Image();

  reader.addEventListener("load", () => {
    const source = String(reader.result || "");
    if (!source) {
      fallback();
      return;
    }
    image.addEventListener("load", () => {
      const maxSize = 520;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        fallback();
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve({
        id: newId(),
        name: file.name,
        url: canvas.toDataURL("image/jpeg", 0.82),
      });
    }, { once: true });
    image.addEventListener("error", fallback, { once: true });
    image.src = source;
  }, { once: true });
  reader.addEventListener("error", fallback, { once: true });
  reader.readAsDataURL(file);
});

const optionById = (id) => PRODUCT_OPTIONS.find((option) => option.id === id);

function ProductCardPreview({ editor, onOpen }) {
  const colors = [
    ...(editor.colorGroups.mainColor || []),
    ...(editor.colorGroups.accentColor || []),
  ];
  const cover = editor.productPhotos.find((photo) => photo.url);

  return (
    <button className="admin-editor-preview-card" type="button" onClick={onOpen}>
      <span className="admin-editor-preview-image">
        {cover ? <img src={cover.url} alt={cover.name} /> : <i aria-hidden="true">◇</i>}
      </span>
      <span className="admin-editor-preview-copy">
        <strong>{editor.name.trim() || "Nom du produit"}</strong>
        <small>À partir de <b>{editor.price.trim() || "prix à définir"}</b></small>
        <span>
          {(colors.length ? colors : [{ value: "#f05b4f" }, { value: "#30c7c9" }])
            .slice(0, 5)
            .map((color, index) => (
              <i key={`${color.value}-${index}`} style={{ "--swatch": color.value }} />
            ))}
        </span>
      </span>
    </button>
  );
}

function ChoiceSection({ config, selected, onChange }) {
  const [customValue, setCustomValue] = useState("");
  const values = [...new Set([...(config.values || []), ...selected])];

  const addValue = () => {
    const value = customValue.trim();
    if (!value) return;
    onChange([...new Set([...selected, value])]);
    setCustomValue("");
  };

  return (
    <fieldset className="admin-editor-config-card">
      <legend>{config.label}</legend>
      <div className="admin-editor-choice-grid">
        {values.map((value) => (
          <button
            className={selected.includes(value) ? "is-selected" : ""}
            type="button"
            key={value}
            onClick={() => onChange(
              selected.includes(value)
                ? selected.filter((item) => item !== value)
                : [...selected, value],
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="admin-editor-choice-add">
        <input
          type="text"
          value={customValue}
          placeholder={config.placeholder}
          onChange={(event) => setCustomValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addValue();
          }}
        />
        <button type="button" onClick={addValue}>Ajouter</button>
      </div>
    </fieldset>
  );
}

function ShoeSizeSection({ selected, onChange, audiences }) {
  const visibleAudiences = audiences.length
    ? audiences.filter((audience) => SHOE_SIZE_GROUPS[audience])
    : Object.keys(SHOE_SIZE_GROUPS);

  return (
    <fieldset className="admin-editor-config-card admin-editor-shoe-sizes">
      <legend>Pointures offertes</legend>
      {visibleAudiences.map((audience) => (
        <section key={audience}>
          <strong>{audience}</strong>
          <div className="admin-editor-choice-grid">
            {SHOE_SIZE_GROUPS[audience].map((size) => (
              <button
                className={(selected[audience] || []).includes(size) ? "is-selected" : ""}
                type="button"
                key={size}
                onClick={() => {
                  const current = selected[audience] || [];
                  onChange({
                    ...selected,
                    [audience]: current.includes(size)
                      ? current.filter((item) => item !== size)
                      : [...current, size],
                  });
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </section>
      ))}
      {!visibleAudiences.length && (
        <p className="admin-editor-shoe-sizes-empty">
          Aucune pointure n’est nécessaire lorsque le produit est destiné uniquement aux bébés.
        </p>
      )}
    </fieldset>
  );
}

function TaxonomyChoices({ emptyText, items, selected, onChange }) {
  if (!items.length) return <p className="admin-editor-taxonomy-empty">{emptyText}</p>;
  return (
    <div className="admin-editor-taxonomy-choices">
      {items.map((item) => (
        <button
          className={selected.includes(String(item.id)) ? "is-selected" : ""}
          key={item.id}
          type="button"
          style={{ "--taxonomy-color": item.color || "#30c7c9" }}
          onClick={() => onChange(
            selected.includes(String(item.id))
              ? selected.filter((id) => id !== String(item.id))
              : [...selected, String(item.id)],
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function PatternPicker({ patrons, selectedId, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const normalizedSearch = categoryIdentity(search);
  const filtered = patrons.filter((patron) => (
    !normalizedSearch || categoryIdentity(patternTitle(patron)).includes(normalizedSearch)
  ));

  return (
    <div className="admin-pattern-picker-backdrop" onClick={onClose}>
      <section
        aria-labelledby="admin-pattern-picker-title"
        aria-modal="true"
        className="admin-pattern-picker"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="admin-pattern-picker-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
        <span>Bibliothèque</span>
        <h2 id="admin-pattern-picker-title">Choisir un patron</h2>
        <label className="admin-pattern-picker-search">
          <span aria-hidden="true" />
          <input
            autoFocus
            type="search"
            value={search}
            placeholder="Rechercher un patron"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="admin-pattern-picker-list">
          {filtered.map((patron) => (
            <button
              className={String(patron.id) === String(selectedId) ? "is-selected" : ""}
              key={patron.id}
              type="button"
              onClick={() => onSelect(patron)}
            >
              <span>{patternImage(patron) ? <img src={patternImage(patron)} alt="" /> : "◇"}</span>
              <span>
                <strong>{patternTitle(patron)}</strong>
                <small>{patternType(patron)}</small>
              </span>
              <i aria-hidden="true">›</i>
            </button>
          ))}
          {!filtered.length && (
            <p>Aucun patron ne correspond à cette recherche.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ColorManager({
  colors,
  onBack,
  onChange,
  title,
}) {
  const [view, setView] = useState("list");
  const [activeId, setActiveId] = useState(null);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("#f05b4f");
  const fileInputRef = useRef(null);
  const activeColor = colors.find((color) => color.id === activeId);
  const pageTitle = view === "list"
    ? title
    : view === "photos"
      ? "Photos de la couleur"
      : activeColor
        ? "Modifier la couleur"
        : "Ajouter une couleur";

  const returnToList = () => {
    setView("list");
    setActiveId(null);
    setLabel("");
    setValue("#f05b4f");
  };

  const openEditor = (color = null) => {
    setActiveId(color?.id || null);
    setLabel(color?.label || "");
    setValue(color?.value || "#f05b4f");
    setView("edit");
  };

  const saveColor = () => {
    const nextColor = {
      id: activeColor?.id || newId(),
      label: label.trim() || "Nouvelle couleur",
      value,
      photos: activeColor?.photos || [],
    };
    onChange(activeColor
      ? colors.map((color) => (color.id === activeColor.id ? nextColor : color))
      : [...colors, nextColor]);
    returnToList();
  };

  const deleteColor = () => {
    if (!activeColor || !window.confirm(`Supprimer la couleur « ${activeColor.label} » ?`)) return;
    onChange(colors.filter((color) => color.id !== activeColor.id));
    returnToList();
  };

  const addPhotos = async (files) => {
    if (!activeColor || !files.length) return;
    const photos = await Promise.all(Array.from(files).map(compressPhoto));
    onChange(colors.map((color) => (
      color.id === activeColor.id
        ? { ...color, photos: [...(color.photos || []), ...photos] }
        : color
    )));
  };

  return (
    <section className="admin-react-page admin-editor-subpage">
      <AdminHeader
        onBack={view === "list" ? onBack : returnToList}
        title={pageTitle}
      />
      <main className="admin-react-main admin-editor-subpage-main">
        {view === "list" && (
          <>
            <header className="admin-editor-section-intro">
              <strong>{title}</strong>
              <small>Ajoute les couleurs offertes pour cette option.</small>
            </header>
            <button className="admin-editor-add-color" type="button" onClick={() => openEditor()}>
              <span>+</span>
              Ajouter une couleur
            </button>
            <div className="admin-editor-color-list">
              {colors.map((color) => (
                <button type="button" key={color.id} onClick={() => openEditor(color)}>
                  <i style={{ "--swatch": color.value }} />
                  <span>
                    <strong>{color.label}</strong>
                    <small>{color.photos?.length || 0} photo(s)</small>
                  </span>
                  <b>›</b>
                </button>
              ))}
              {!colors.length && <p>Aucune couleur ajoutée pour le moment.</p>}
            </div>
          </>
        )}

        {view === "edit" && (
          <section className="admin-editor-color-editor">
            <label>
              Nom
              <input
                type="text"
                value={label}
                placeholder="Nom de la couleur"
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label>
              Couleur
              <span className="admin-editor-color-picker">
                <input type="color" value={value} onChange={(event) => setValue(event.target.value)} />
                <b style={{ "--swatch": value }} />
                <span>{value.toUpperCase()}</span>
              </span>
            </label>
            {activeColor && (
              <button
                className="admin-editor-photo-manage"
                type="button"
                onClick={() => setView("photos")}
              >
                <span>Photos associées</span>
                <small>{activeColor.photos?.length || 0} photo(s)</small>
                <b>›</b>
              </button>
            )}
            <div className="admin-editor-form-actions">
              <button className="primary" type="button" onClick={saveColor}>Enregistrer</button>
              {activeColor && (
                <button className="danger" type="button" onClick={deleteColor}>Supprimer</button>
              )}
            </div>
          </section>
        )}

        {view === "photos" && activeColor && (
          <section className="admin-editor-color-editor">
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addPhotos(event.target.files || []);
                event.target.value = "";
              }}
            />
            <button
              className="admin-editor-photo-drop"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <span>+</span>
              <strong>Ajouter des photos</strong>
              <small>Photos des pelotes utilisées pour cette couleur.</small>
            </button>
            <div className="admin-editor-color-photo-grid">
              {(activeColor.photos || []).map((photo) => (
                <article key={photo.id}>
                  {photo.url ? <img src={photo.url} alt={photo.name} /> : <i style={{ "--swatch": activeColor.value }} />}
                  <span>{photo.name}</span>
                  <button
                    type="button"
                    onClick={() => onChange(colors.map((color) => (
                      color.id === activeColor.id
                        ? { ...color, photos: color.photos.filter((item) => item.id !== photo.id) }
                        : color
                    )))}
                  >
                    ×
                  </button>
                </article>
              ))}
              {!activeColor.photos?.length && <p>Aucune photo associée.</p>}
            </div>
          </section>
        )}
      </main>
    </section>
  );
}

function ProductPreviewPage({ editor, onBack }) {
  const frameRef = useRef(null);
  const product = useMemo(() => productFromEditor(editor), [editor]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "kaleido-product-preview-ready") {
        frameRef.current?.contentWindow?.postMessage({
          type: "kaleido-product-preview-product",
          product,
        }, "*");
      }
      if (event.data?.type === "kaleido-product-preview-close") onBack();
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onBack, product]);

  const sendProduct = () => {
    frameRef.current?.contentWindow?.postMessage({
      type: "kaleido-product-preview-product",
      product,
    }, "*");
  };

  return (
    <section className="admin-react-page admin-editor-storefront-preview">
      <iframe
        ref={frameRef}
        src="/admin-boutique/index.html?mode=preview&productPreview=1"
        title="Aperçu exact de la fiche produit"
        onLoad={sendProduct}
      />
    </section>
  );
}

function LegacyProductPreviewPage({ editor, onBack }) {
  const [selections, setSelections] = useState({});
  const [expandedColorGroups, setExpandedColorGroups] = useState({});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const simpleOptions = editor.options.filter((id) => (
    !COLOR_SECTIONS[id] && !CHOICE_OPTIONS[id] && id !== "keychain" && id !== "shoeSize"
  ));
  const previewDescription = editor.description || "Ajoute une description pour présenter cette création.";
  const hasLongDescription = previewDescription.length > 180;
  const displayedPrice = formatCalculatedPrice(
    editor.price,
    selections.keychain === "Oui" ? editor.optionPrices?.keychain : 0,
  );
  const shoeSizeAudiences = editor.options.includes("recipient")
    ? (SHOE_SIZE_GROUPS[selections.recipient] ? [selections.recipient] : [])
    : Object.keys(SHOE_SIZE_GROUPS);

  const choose = (group, value) => setSelections((current) => {
    const nextValue = current[group] === value ? "" : value;
    return {
      ...current,
      [group]: nextValue,
      ...(group === "recipient" ? { shoeSize: "" } : {}),
    };
  });

  return (
    <section className="admin-react-page admin-editor-subpage">
      <AdminHeader onBack={onBack} title="Aperçu client" />
      <main className="admin-react-main admin-editor-preview-page">
        <ProductPhotoCarousel photos={editor.productPhotos} />
        <div className="admin-editor-preview-detail">
          <div
            className="admin-editor-preview-title-row"
            style={{ "--product-accent": editor.cardColor || "#e84b94" }}
          >
            <h1>{editor.name || "Nom du produit"}</h1>
            <strong>{displayedPrice}</strong>
            <span className="admin-editor-preview-title-divider" aria-hidden="true" />
          </div>
          <div
            className="admin-editor-preview-story"
            style={{ "--product-accent": editor.cardColor || "#e84b94" }}
          >
            <strong>À propos</strong>
            <p className={hasLongDescription && !descriptionExpanded ? "is-collapsible" : ""}>
              {previewDescription}
            </p>
            {hasLongDescription && (
              <button type="button" onClick={() => setDescriptionExpanded((current) => !current)}>
                {descriptionExpanded ? "Réduire" : "Lire la suite"}
              </button>
            )}
          </div>

          <section>
            <h3>Personnalisez votre produit</h3>
            {Object.entries(COLOR_SECTIONS).map(([optionId, section]) => (
              editor.options.includes(optionId) && (
                <div
                  className="admin-editor-client-group"
                  key={optionId}
                  style={{ "--group-color": optionById(optionId).color }}
                >
                  <strong>{section.title}</strong>
                  <div className="admin-editor-client-colors">
                    {editor.colorGroups[optionId]
                      .slice(0, expandedColorGroups[optionId] ? undefined : 6)
                      .map((color) => {
                      const photo = color.photos?.find((item) => item.url);
                      return (
                        <button
                          type="button"
                          className={selections[optionId] === color.value ? "is-selected" : ""}
                          key={color.id}
                          onClick={() => choose(optionId, color.value)}
                          style={{ "--option-color": optionById(optionId).color }}
                        >
                          {photo ? <img src={photo.url} alt={photo.name} /> : <i style={{ "--swatch": color.value }} />}
                          <span>{color.label}</span>
                        </button>
                      );
                    })}
                    {!editor.colorGroups[optionId].length && <small>Aucune couleur ajoutée.</small>}
                  </div>
                  {editor.colorGroups[optionId].length > 6 && (
                    <button
                      className="admin-editor-show-colors"
                      type="button"
                      onClick={() => setExpandedColorGroups((current) => ({
                        ...current,
                        [optionId]: !current[optionId],
                      }))}
                    >
                      {expandedColorGroups[optionId] ? "Afficher moins de couleurs" : "Afficher les autres couleurs"}
                    </button>
                  )}
                </div>
              )
            ))}

            {Object.entries(CHOICE_OPTIONS).map(([optionId, config]) => (
              editor.options.includes(optionId) && (
                <div
                  className="admin-editor-client-group"
                  key={optionId}
                  style={{ "--group-color": optionById(optionId).color }}
                >
                  <strong>{config.label}</strong>
                  <div className="admin-editor-client-choices">
                    {(editor.optionChoices[optionId] || []).map((choice) => (
                      <button
                        type="button"
                        className={selections[optionId] === choice ? "is-selected" : ""}
                        key={choice}
                        onClick={() => choose(optionId, choice)}
                        style={{ "--option-color": optionById(optionId).color }}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}

            {editor.options.includes("shoeSize") && shoeSizeAudiences.map((audience) => (
              <div
                className="admin-editor-client-group"
                key={`shoe-size-${audience}`}
                style={{ "--group-color": optionById("shoeSize").color }}
              >
                <strong>
                  {editor.options.includes("recipient") ? "Pointure" : `Pointure - ${audience}`}
                </strong>
                <div className="admin-editor-client-choices">
                  {(editor.shoeSizeChoices[audience] || []).map((size) => (
                    <button
                      type="button"
                      className={selections.shoeSize === `${audience}:${size}` ? "is-selected" : ""}
                      key={size}
                      onClick={() => choose("shoeSize", `${audience}:${size}`)}
                      style={{ "--option-color": optionById("shoeSize").color }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {editor.options.includes("keychain") && (
              <div
                className="admin-editor-client-group"
                style={{ "--group-color": optionById("keychain").color }}
              >
                <strong>Voulez-vous en faire un porte-clé ?</strong>
                <div className="admin-editor-client-choices">
                  {["Oui", "Non"].map((choice) => (
                    <button
                      type="button"
                      className={selections.keychain === choice ? "is-selected" : ""}
                      key={choice}
                      onClick={() => choose("keychain", choice)}
                      style={{ "--option-color": optionById("keychain").color }}
                    >
                      {choice}
                      {choice === "Oui" && parseProductPrice(editor.optionPrices?.keychain) > 0
                        ? ` (+${formatCalculatedPrice(0, editor.optionPrices.keychain)})`
                        : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {simpleOptions.map((optionId) => (
              <div
                className="admin-editor-client-group"
                key={optionId}
                style={{ "--group-color": optionById(optionId)?.color }}
              >
                <strong>{optionById(optionId)?.label}</strong>
                <div className="admin-editor-client-choices">
                  <button
                    type="button"
                    className={selections[optionId] ? "is-selected" : ""}
                    onClick={() => choose(optionId, "available")}
                    style={{ "--option-color": optionById(optionId)?.color }}
                  >
                    Option disponible
                  </button>
                </div>
              </div>
            ))}
            {!editor.options.length && <p>Aucune option choisie.</p>}
          </section>
        </div>
      </main>
    </section>
  );
}

function ProductPhotoCarousel({ photos }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const visiblePhotos = photos.filter((photo) => photo.url);

  const scrollToPhoto = (index) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
  };

  const updateActivePhoto = (event) => {
    const track = event.currentTarget;
    if (!track.clientWidth) return;
    const nextIndex = Math.max(
      0,
      Math.min(visiblePhotos.length - 1, Math.round(track.scrollLeft / track.clientWidth)),
    );
    setActiveIndex(nextIndex);
  };

  return (
    <div className="admin-editor-preview-hero">
      {visiblePhotos.length ? (
        <div
          ref={trackRef}
          className="admin-editor-preview-photo-track"
          onScroll={updateActivePhoto}
        >
          {visiblePhotos.map((photo) => (
            <div className="admin-editor-preview-photo-slide" key={photo.id}>
              <img src={photo.url} alt={photo.name} />
            </div>
          ))}
        </div>
      ) : (
        <span>Photo du produit</span>
      )}
      {visiblePhotos.length > 1 && (
        <div className="admin-editor-preview-photo-dots" aria-label="Photos du produit">
          {visiblePhotos.map((photo, index) => (
            <button
              type="button"
              key={photo.id}
              className={activeIndex === index ? "is-active" : ""}
              aria-label={`Afficher la photo ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => scrollToPhoto(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShopifyConnectionModal({ code, error, onCodeChange, onClose, onConnect }) {
  return (
    <div
      className="admin-shopify-modal-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="admin-shopify-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-shopify-modal-title"
      >
        <button
          className="admin-shopify-modal-close"
          type="button"
          aria-label="Fermer"
          onClick={onClose}
        >
          ×
        </button>
        <header>
          <span aria-hidden="true">S</span>
          <div>
            <h2 id="admin-shopify-modal-title">Connecter à Shopify</h2>
            <p>Colle le code complet généré par le canal Bouton d'achat.</p>
          </div>
        </header>
        <form onSubmit={(event) => { event.preventDefault(); onConnect(); }}>
          <label>
            Code Buy Button
            <textarea
              autoFocus
              rows="10"
              value={code}
              spellCheck="false"
              placeholder={'<div id="product-component-..."></div>\n<script type="text/javascript">...'}
              onChange={(event) => onCodeChange(event.target.value)}
            />
          </label>
          <small>
            Kaleido conservera seulement le domaine, le jeton public Storefront et l'identifiant du produit.
          </small>
          {error && <p className="admin-shopify-modal-error" role="alert">{error}</p>}
          <div className="admin-shopify-modal-actions">
            <button type="button" onClick={onClose}>Annuler</button>
            <button className="primary" type="submit">Analyser et connecter</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AdminProductEditorScreen({ navigation, productId, patrons = [] }) {
  const existingProduct = useMemo(
    () => readStorefrontProducts().find((product) => String(product.id) === String(productId)),
    [productId],
  );
  const [editor, setEditor] = useState(() => createEditorState(existingProduct));
  const [subpage, setSubpage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [shopifyStore, setShopifyStore] = useState(
    () => normalizeShopifyStore(readStorefrontHomeConfig().shopify),
  );
  const [shopifyModalOpen, setShopifyModalOpen] = useState(false);
  const [shopifyCode, setShopifyCode] = useState("");
  const [shopifyError, setShopifyError] = useState("");
  const [patternPickerOpen, setPatternPickerOpen] = useState(false);
  const [reorderingPhotos, setReorderingPhotos] = useState(false);
  const [draggingPhotoId, setDraggingPhotoId] = useState(null);
  const productPhotoInput = useRef(null);
  const homeConfig = useMemo(() => readStorefrontHomeConfig(), []);
  const taxonomy = useMemo(() => storefrontTaxonomy(homeConfig), [homeConfig]);
  const selectedCategory = taxonomy.categories.find((category) => (
    String(category.id) === String(editor.category)
    || categoryIdentity(category.label) === categoryIdentity(editor.category)
  )) || taxonomy.categories[0];
  const availableSubcategories = taxonomy.subcategories.filter((subcategory) => (
    String(subcategory.categoryId) === String(selectedCategory?.id)
  ));

  const update = (patch) => setEditor((current) => ({ ...current, ...patch }));

  const toggleOption = (optionId) => {
    setEditor((current) => {
      const isActive = current.options.includes(optionId);
      const next = {
        ...current,
        options: isActive
          ? current.options.filter((id) => id !== optionId)
          : [...current.options, optionId],
      };
      if (optionId !== "shoeSize" || isActive) return next;

      const selectedAudiences = current.options.includes("recipient")
        ? (current.optionChoices.recipient || []).filter((audience) => SHOE_SIZE_GROUPS[audience])
        : Object.keys(SHOE_SIZE_GROUPS);
      return {
        ...next,
        shoeSizeChoices: selectAllShoeSizes(current.shoeSizeChoices, selectedAudiences),
        shoeSizeDefaultsInitialized: true,
      };
    });
  };

  const updateRecipientChoices = (values) => {
    setEditor((current) => {
      const previous = current.optionChoices.recipient || [];
      const addedAudiences = values.filter(
        (audience) => !previous.includes(audience) && SHOE_SIZE_GROUPS[audience],
      );
      return {
        ...current,
        optionChoices: { ...current.optionChoices, recipient: values },
        ...(current.options.includes("shoeSize") && addedAudiences.length
          ? {
            shoeSizeChoices: selectAllShoeSizes(current.shoeSizeChoices, addedAudiences),
            shoeSizeDefaultsInitialized: true,
          }
          : {}),
      };
    });
  };

  const addProductPhotos = async (files) => {
    if (!files.length) return;
    const photos = await Promise.all(Array.from(files).map(compressPhoto));
    setEditor((current) => ({
      ...current,
      productPhotos: [...current.productPhotos, ...photos],
    }));
  };

  const moveProductPhoto = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setEditor((current) => {
      const sourceIndex = current.productPhotos.findIndex((photo) => photo.id === sourceId);
      const targetIndex = current.productPhotos.findIndex((photo) => photo.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const productPhotos = [...current.productPhotos];
      const [photo] = productPhotos.splice(sourceIndex, 1);
      productPhotos.splice(targetIndex, 0, photo);
      return { ...current, productPhotos };
    });
  };

  const openShopifyModal = () => {
    setShopifyCode("");
    setShopifyError("");
    setShopifyModalOpen(true);
  };

  const connectShopifyProduct = () => {
    try {
      const parsed = parseShopifyBuyButtonCode(shopifyCode);
      if (shopifyStore?.domain && shopifyStore.domain !== parsed.domain) {
        throw new Error(
          `Ce code vient de ${parsed.domain}, mais Kaleido est déjà connecté à ${shopifyStore.domain}.`,
        );
      }

      const duplicate = readStorefrontProducts().find((product) => {
        const connection = normalizeShopifyConnection(product.shopify);
        return connection?.productId === parsed.productId
          && String(product.id) !== String(editor.id || "");
      });
      if (duplicate) {
        throw new Error(`Ce produit Shopify est déjà associé à la fiche « ${duplicate.name} ».`);
      }

      setShopifyStore({
        domain: parsed.domain,
        storefrontAccessToken: parsed.storefrontAccessToken,
      });
      update({
        shopify: {
          productId: parsed.productId,
          domain: parsed.domain,
          connectedAt: new Date().toISOString(),
        },
      });
      setShopifyModalOpen(false);
      setShopifyCode("");
      setShopifyError("");
    } catch (error) {
      setShopifyError(error?.message || "Le code Shopify n'a pas pu être analysé.");
    }
  };

  const saveProduct = () => {
    if (saving) return;
    setSaveError("");
    setSaving(true);
    const currentProducts = readStorefrontProducts();
    const previous = currentProducts.find((product) => String(product.id) === String(editor.id));
    const product = productFromEditor(
      editor.id ? editor : { ...editor, id: newId() },
      previous,
    );

    try {
      if (shopifyStore) {
        writeStorefrontHomeConfig({
          ...readStorefrontHomeConfig(),
          shopify: shopifyStore,
        });
      }
      writeStorefrontProducts([
        product,
        ...currentProducts.filter((item) => String(item.id) !== String(product.id)),
      ]);
      setSaving(false);
      if (navigation.previousRoute?.name === ADMIN_ROUTES.PRODUCTS) {
        navigation.goBack();
      } else {
        navigation.replace(ADMIN_ROUTES.PRODUCTS);
      }
    } catch (error) {
      setSaving(false);
      setSaveError(error?.message || "Le produit n’a pas pu être enregistré.");
    }
  };

  if (subpage?.type === "colors") {
    const section = COLOR_SECTIONS[subpage.optionId];
    return (
      <ColorManager
        title={section.title}
        colors={editor.colorGroups[subpage.optionId]}
        onBack={() => setSubpage(null)}
        onChange={(colors) => setEditor((current) => ({
          ...current,
          colorGroups: { ...current.colorGroups, [subpage.optionId]: colors },
        }))}
      />
    );
  }

  if (subpage?.type === "preview") {
    return <ProductPreviewPage editor={editor} onBack={() => setSubpage(null)} />;
  }

  return (
    <AdminLayout
      onBack={navigation.goBack}
      title={existingProduct ? "Modifier le produit" : "Créer un produit"}
    >
      <div className="admin-product-editor">
        <form onSubmit={(event) => { event.preventDefault(); saveProduct(); }}>
          <section className="admin-editor-fields">
            <label>
              Nom du produit
              <input
                type="text"
                value={editor.name}
                placeholder="Pantoufles douillettes"
                onChange={(event) => update({ name: event.target.value })}
              />
            </label>

            <div className="admin-editor-two-columns">
              <label>
                Catégorie
                <select
                  value={selectedCategory?.label || editor.category}
                  onChange={(event) => {
                    const nextCategory = taxonomy.categories.find((category) => category.label === event.target.value);
                    update({
                      category: event.target.value,
                      subcategoryIds: editor.subcategoryIds.filter((id) => (
                        taxonomy.subcategories.some((subcategory) => (
                          String(subcategory.id) === String(id)
                          && String(subcategory.categoryId) === String(nextCategory?.id)
                        ))
                      )),
                    });
                  }}
                >
                  {taxonomy.categories.map((category) => <option key={category.id}>{category.label}</option>)}
                </select>
              </label>
              <label>
                Prix à partir de
                <input
                  type="text"
                  inputMode="decimal"
                  value={editor.price}
                  placeholder="42,00 $"
                  onChange={(event) => update({ price: event.target.value })}
                />
              </label>
            </div>

            <label>
              Description courte
              <textarea
                rows="4"
                value={editor.description}
                placeholder="Une création douce, personnalisable et faite à la main."
                onChange={(event) => update({ description: event.target.value })}
              />
            </label>
          </section>

          <fieldset className="admin-editor-section admin-editor-pattern-section">
            <legend>Patron associé</legend>
            {editor.patternId ? (
              <article className="admin-editor-pattern-card">
                <span aria-hidden="true">◇</span>
                <div>
                  <strong>{editor.patternSnapshot?.title || "Patron associé"}</strong>
                  <small>{editor.patternSnapshot?.type || "Bibliothèque Kaleido"}</small>
                </div>
                <button type="button" onClick={() => setPatternPickerOpen(true)}>Changer</button>
                <button
                  className="danger"
                  type="button"
                  onClick={() => update({ patternId: "", patternSnapshot: null })}
                >
                  Dissocier
                </button>
              </article>
            ) : (
              <button
                className="admin-editor-pattern-empty"
                type="button"
                onClick={() => setPatternPickerOpen(true)}
              >
                <span aria-hidden="true">+</span>
                <span>
                  <strong>Choisir un patron</strong>
                  <small>Relie ce produit à un patron de ta Bibliothèque.</small>
                </span>
              </button>
            )}
          </fieldset>

          <fieldset className="admin-editor-section admin-editor-taxonomy-section">
            <legend>Sous-catégories</legend>
            <TaxonomyChoices
              items={availableSubcategories}
              selected={editor.subcategoryIds}
              onChange={(subcategoryIds) => update({ subcategoryIds })}
              emptyText="Aucune sous-catégorie n’a encore été créée pour cette catégorie."
            />
          </fieldset>

          <fieldset className="admin-editor-section admin-editor-taxonomy-section">
            <legend>Collections</legend>
            <TaxonomyChoices
              items={taxonomy.collections}
              selected={editor.collectionIds}
              onChange={(collectionIds) => update({ collectionIds })}
              emptyText="Aucune collection n’a encore été créée dans Accueil boutique."
            />
          </fieldset>

          <fieldset className="admin-editor-section">
            <div className="admin-editor-section-heading">
              <strong>Photos du produit</strong>
              {editor.productPhotos.length > 1 && (
                <button
                  className={reorderingPhotos ? "is-active" : ""}
                  type="button"
                  onClick={() => {
                    setReorderingPhotos((current) => !current);
                    setDraggingPhotoId(null);
                  }}
                >
                  {reorderingPhotos ? "Terminer" : "Réorganiser"}
                </button>
              )}
            </div>
            <input
              hidden
              ref={productPhotoInput}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                addProductPhotos(event.target.files || []);
                event.target.value = "";
              }}
            />
            <button
              className="admin-editor-photo-drop"
              type="button"
              onClick={() => productPhotoInput.current?.click()}
            >
              <span>+</span>
              <strong>Ajouter les photos du produit</strong>
              <small>Les photos de la création terminée seront affichées dans la fiche.</small>
            </button>
            <div className={`admin-editor-product-photos${reorderingPhotos ? " is-reordering" : ""}`}>
              {editor.productPhotos.map((photo, index) => (
                <article
                  className={draggingPhotoId === photo.id ? "is-dragging" : ""}
                  data-product-photo-id={photo.id}
                  key={photo.id}
                  onPointerDown={(event) => {
                    if (!reorderingPhotos) return;
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    setDraggingPhotoId(photo.id);
                  }}
                  onPointerMove={(event) => {
                    if (!reorderingPhotos || draggingPhotoId !== photo.id) return;
                    const target = document.elementFromPoint(event.clientX, event.clientY)
                      ?.closest?.("[data-product-photo-id]");
                    moveProductPhoto(photo.id, target?.dataset.productPhotoId);
                  }}
                  onPointerUp={() => setDraggingPhotoId(null)}
                  onPointerCancel={() => setDraggingPhotoId(null)}
                >
                  {photo.url ? <img src={photo.url} alt={photo.name} /> : <i>Photo</i>}
                  <b>{index === 0 ? "Photo principale" : index + 1}</b>
                  <span>{photo.name}</span>
                  {!reorderingPhotos && (
                    <button
                      type="button"
                      aria-label={`Supprimer ${photo.name}`}
                      onClick={() => update({
                        productPhotos: editor.productPhotos.filter((item) => item.id !== photo.id),
                      })}
                    >
                      ×
                    </button>
                  )}
                </article>
              ))}
            </div>
          </fieldset>

          <fieldset className="admin-editor-section">
            <legend>Options du produit</legend>
            <div className="admin-editor-option-grid">
              {PRODUCT_OPTIONS.map((option) => (
                <button
                  className={editor.options.includes(option.id) ? "is-selected" : ""}
                  type="button"
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  style={{ "--option-color": option.color }}
                  aria-pressed={editor.options.includes(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {Object.entries(COLOR_SECTIONS).map(([optionId, section]) => (
            editor.options.includes(optionId) && (
              <fieldset className="admin-editor-config-card" key={optionId}>
                <legend>{section.title}</legend>
                <button
                  className="admin-editor-color-summary"
                  type="button"
                  onClick={() => setSubpage({ type: "colors", optionId })}
                >
                  <span>
                    <strong>{editor.colorGroups[optionId].length} couleur(s)</strong>
                    <small>
                      {editor.colorGroups[optionId].length ? "Appuie pour gérer les choix" : "Aucune couleur ajoutée"}
                    </small>
                  </span>
                  <span>
                    {editor.colorGroups[optionId].slice(0, 5).map((color) => (
                      <i key={color.id} style={{ "--swatch": color.value }} />
                    ))}
                    {!editor.colorGroups[optionId].length && <i />}
                  </span>
                </button>
              </fieldset>
            )
          ))}

          {Object.entries(CHOICE_OPTIONS).map(([optionId, config]) => (
            editor.options.includes(optionId) && (
              <ChoiceSection
                key={optionId}
                config={config}
                selected={editor.optionChoices[optionId] || []}
                onChange={(values) => {
                  if (optionId === "recipient") {
                    updateRecipientChoices(values);
                    return;
                  }
                  update({
                    optionChoices: { ...editor.optionChoices, [optionId]: values },
                  });
                }}
              />
            )
          ))}

          {editor.options.includes("shoeSize") && (
            <ShoeSizeSection
              selected={editor.shoeSizeChoices}
              audiences={editor.options.includes("recipient")
                ? (editor.optionChoices.recipient || [])
                : []}
              onChange={(shoeSizeChoices) => update({ shoeSizeChoices })}
            />
          )}

          {editor.options.includes("keychain") && (
            <fieldset className="admin-editor-config-card admin-editor-price-config">
              <legend>Supplément porte-clé</legend>
              <label>
                Montant ajouté au prix
                <div className="admin-editor-price-input">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editor.optionPrices?.keychain || ""}
                    placeholder="5,00"
                    onChange={(event) => update({
                      optionPrices: {
                        ...editor.optionPrices,
                        keychain: event.target.value,
                      },
                    })}
                  />
                  <span>$</span>
                </div>
                <small>
                  Ce montant s’ajoute automatiquement lorsque le client choisit « Oui ».
                </small>
              </label>
            </fieldset>
          )}

          <section className="admin-editor-shopify">
            <header>
              <div>
                <strong>Shopify</strong>
                <small>Relie cette fiche au produit vendu dans le panier.</small>
              </div>
              <span className={editor.shopify ? "is-connected" : ""}>
                {editor.shopify ? "Connecté" : "Non connecté"}
              </span>
            </header>
            {editor.shopify ? (
              <div className="admin-editor-shopify-card">
                <span aria-hidden="true">S</span>
                <div>
                  <strong>Produit Shopify connecté</strong>
                  <small>{editor.shopify.domain || shopifyStore?.domain || "Boutique à confirmer"}</small>
                  <code>Produit {editor.shopify.productId}</code>
                </div>
                <div className="admin-editor-shopify-actions">
                  <button type="button" onClick={openShopifyModal}>Modifier</button>
                  <button
                    className="danger"
                    type="button"
                    onClick={() => update({ shopify: null })}
                  >
                    Déconnecter
                  </button>
                </div>
              </div>
            ) : (
              <button className="admin-editor-shopify-connect" type="button" onClick={openShopifyModal}>
                <span aria-hidden="true">S</span>
                <span>
                  <strong>Connecter à Shopify</strong>
                  <small>Colle le code Buy Button et Kaleido fera le reste.</small>
                </span>
              </button>
            )}
          </section>

          <section className="admin-editor-live-preview">
            <header>
              <small>APERÇU CLIENT</small>
              <strong>Carte générée</strong>
            </header>
            <ProductCardPreview editor={editor} onOpen={() => setSubpage({ type: "preview" })} />
            <div className="admin-editor-option-preview">
              {editor.options.map((optionId) => {
                const option = optionById(optionId);
                return <span key={optionId} style={{ "--option-color": option.color }}>{option.label}</span>;
              })}
              {!editor.options.length && <small>Aucune option choisie.</small>}
            </div>
          </section>

          {saveError && <p className="admin-editor-save-error" role="alert">{saveError}</p>}
          <div className="admin-editor-save-actions">
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer le produit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditor(createEditorState(existingProduct));
                setShopifyStore(normalizeShopifyStore(readStorefrontHomeConfig().shopify));
              }}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>
      {patternPickerOpen && (
        <PatternPicker
          patrons={patrons}
          selectedId={editor.patternId}
          onClose={() => setPatternPickerOpen(false)}
          onSelect={(patron) => {
            update({
              patternId: String(patron.id),
              patternSnapshot: {
                title: patternTitle(patron),
                type: patternType(patron),
              },
            });
            setPatternPickerOpen(false);
          }}
        />
      )}
      {shopifyModalOpen && (
        <ShopifyConnectionModal
          code={shopifyCode}
          error={shopifyError}
          onCodeChange={(value) => {
            setShopifyCode(value);
            if (shopifyError) setShopifyError("");
          }}
          onClose={() => {
            setShopifyModalOpen(false);
            setShopifyError("");
          }}
          onConnect={connectShopifyProduct}
        />
      )}
    </AdminLayout>
  );
}
