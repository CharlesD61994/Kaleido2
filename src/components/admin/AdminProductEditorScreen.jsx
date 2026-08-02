import React, { useMemo, useRef, useState } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import {
  readStorefrontProducts,
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
    values: ["Femme", "Homme", "Enfant"],
  },
  shoeSize: {
    label: "Pointure",
    placeholder: "Ajouter une pointure",
    values: ["Bébé", "Enfant", "Femme", "Homme", "Sur mesure"],
  },
};

const COLOR_SECTIONS = {
  mainColor: { key: "main", storeKey: "mainColors", title: "Couleur principale" },
  accentColor: { key: "accent", storeKey: "accentColors", title: "Couleur secondaire" },
};

const CATEGORIES = [
  "Vêtements",
  "Peluches crochetées",
  "Pantoufles",
  "Porte-clés",
  "Couvertures",
];

const newId = () => window.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random()}`;

const formatProductPrice = (value) => {
  const price = String(value || "").trim();
  if (!price) return "Prix à définir";
  return /[$€£]/.test(price) ? price : `${price} $`;
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
  category: CATEGORIES[0],
  price: "",
  description: "",
  shopify: "",
  options: [],
  optionChoices: {},
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
    options: [...(source.options || [])],
    optionChoices: Object.fromEntries(
      Object.entries(source.optionChoices || {}).map(([key, values]) => [key, [...values]]),
    ),
    productPhotos: (source.productPhotos || []).map(normalizePhoto),
    colorGroups: {
      mainColor: productColorsForSection(source, "mainColor"),
      accentColor: productColorsForSection(source, "accentColor"),
    },
  };
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
  const [selections, setSelections] = useState({});
  const [expandedColorGroups, setExpandedColorGroups] = useState({});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const simpleOptions = editor.options.filter((id) => (
    !COLOR_SECTIONS[id] && !CHOICE_OPTIONS[id] && id !== "keychain"
  ));
  const previewDescription = editor.description || "Ajoute une description pour présenter cette création.";
  const hasLongDescription = previewDescription.length > 180;

  const choose = (group, value) => setSelections((current) => ({
    ...current,
    [group]: current[group] === value ? "" : value,
  }));

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
            <strong>{formatProductPrice(editor.price)}</strong>
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
                <div className="admin-editor-client-group" key={optionId}>
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
                <div className="admin-editor-client-group" key={optionId}>
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

            {editor.options.includes("keychain") && (
              <div className="admin-editor-client-group">
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
                    </button>
                  ))}
                </div>
              </div>
            )}

            {simpleOptions.map((optionId) => (
              <div className="admin-editor-client-group" key={optionId}>
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

export default function AdminProductEditorScreen({ navigation, productId }) {
  const existingProduct = useMemo(
    () => readStorefrontProducts().find((product) => String(product.id) === String(productId)),
    [productId],
  );
  const [editor, setEditor] = useState(() => createEditorState(existingProduct));
  const [subpage, setSubpage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const productPhotoInput = useRef(null);

  const update = (patch) => setEditor((current) => ({ ...current, ...patch }));

  const toggleOption = (optionId) => {
    setEditor((current) => ({
      ...current,
      options: current.options.includes(optionId)
        ? current.options.filter((id) => id !== optionId)
        : [...current.options, optionId],
    }));
  };

  const addProductPhotos = async (files) => {
    if (!files.length) return;
    const photos = await Promise.all(Array.from(files).map(compressPhoto));
    setEditor((current) => ({
      ...current,
      productPhotos: [...current.productPhotos, ...photos],
    }));
  };

  const saveProduct = () => {
    if (saving) return;
    setSaveError("");
    setSaving(true);
    const now = new Date().toISOString();
    const currentProducts = readStorefrontProducts();
    const previous = currentProducts.find((product) => String(product.id) === String(editor.id));
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
      id: editor.id || newId(),
      name: editor.name.trim() || "Produit sans nom",
      price: editor.price.trim(),
      description: editor.description.trim(),
      shopify: editor.shopify.trim(),
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

    try {
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
                <select value={editor.category} onChange={(event) => update({ category: event.target.value })}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
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

          <fieldset className="admin-editor-section">
            <legend>Photos du produit</legend>
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
            <div className="admin-editor-product-photos">
              {editor.productPhotos.map((photo) => (
                <article key={photo.id}>
                  {photo.url ? <img src={photo.url} alt={photo.name} /> : <i>Photo</i>}
                  <span>{photo.name}</span>
                  <button
                    type="button"
                    aria-label={`Supprimer ${photo.name}`}
                    onClick={() => update({
                      productPhotos: editor.productPhotos.filter((item) => item.id !== photo.id),
                    })}
                  >
                    ×
                  </button>
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
                onChange={(values) => update({
                  optionChoices: { ...editor.optionChoices, [optionId]: values },
                })}
              />
            )
          ))}

          <section className="admin-editor-fields">
            <label>
              Lien ou ID Shopify
              <input
                type="text"
                value={editor.shopify}
                placeholder="À ajouter plus tard"
                onChange={(event) => update({ shopify: event.target.value })}
              />
            </label>
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
              onClick={() => setEditor(createEditorState(existingProduct))}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
