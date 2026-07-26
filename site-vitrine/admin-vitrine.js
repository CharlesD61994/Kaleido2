const productsKey = "kaleido-storefront-product-drafts";
const homeConfigKey = "kaleido-storefront-home-config";

const homeCategoryCount = document.querySelector("#homeCategoryCount");
const homeFeaturedCount = document.querySelector("#homeFeaturedCount");
const homeCatalogCount = document.querySelector("#homeCatalogCount");
const homeCategories = document.querySelector("#homeCategories");
const featuredProducts = document.querySelector("#featuredProducts");
const productPickerModal = document.querySelector("#productPickerModal");
const categoryModal = document.querySelector("#categoryModal");
const categoryPhotoModal = document.querySelector("#categoryPhotoModal");

const defaultCategories = [
  { id: "vetements", label: "Vêtements", color: "#7c3aed", icon: "♢" },
  { id: "peluches", label: "Peluches crochetées", color: "#e84b94", icon: "●" },
  { id: "pantoufles", label: "Pantoufles", color: "#30c7c9", icon: "◒" },
  { id: "porte-cles", label: "Porte-clés", color: "#f4831f", icon: "◇" },
  { id: "couvertures", label: "Couvertures", color: "#8bbf3f", icon: "▧" },
];

const categoryPalette = ["✦", "◌", "●", "◒", "◇", "▧", "♢"];

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const slugifyCategory = (value) =>
  String(value || "categorie")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34) || "categorie";

const customCategoriesFrom = (rawConfig) =>
  Array.isArray(rawConfig?.customCategories)
    ? rawConfig.customCategories
        .filter((category) => category?.id && category?.label)
        .map((category, index) => ({
          id: String(category.id),
          label: String(category.label),
          color: category.color || "#30c7c9",
          icon: category.icon || categoryPalette[index % categoryPalette.length],
          custom: true,
        }))
    : [];

const allCategoriesFrom = (rawConfig) => {
  const categoryColors = rawConfig?.categoryColors || {};
  const usedIds = new Set(defaultCategories.map((category) => category.id));
  const customCategories = customCategoriesFrom(rawConfig).filter((category) => {
    if (usedIds.has(category.id)) return false;
    usedIds.add(category.id);
    return true;
  });
  const categoryPhotos = rawConfig?.categoryPhotos || {};
  return [...defaultCategories, ...customCategories].map((category) => ({
    ...category,
    color: categoryColors[category.id] || category.color,
    photo: pendingCategoryPhotos[category.id] || categoryPhotos[category.id] || null,
  }));
};

const compactCategoryPhoto = (photo) => {
  if (!photo?.src && !photo?.url && !photo?.preview && !photo?.original) return null;
  const original = photo.original || photo.src || photo.url || photo.preview;
  const preview = photo.preview || photo.url || photo.src;
  return {
    name: photo.name || "",
    src: original,
    original,
    preview,
    x: Number.isFinite(Number(photo.x)) ? Number(photo.x) : 0,
    y: Number.isFinite(Number(photo.y)) ? Number(photo.y) : 0,
    scale: Number.isFinite(Number(photo.scale)) ? Number(photo.scale) : 1,
    aspect: Number.isFinite(Number(photo.aspect)) && Number(photo.aspect) > 0 ? Number(photo.aspect) : 1,
    naturalWidth: Number.isFinite(Number(photo.naturalWidth)) ? Number(photo.naturalWidth) : 164,
    naturalHeight: Number.isFinite(Number(photo.naturalHeight)) ? Number(photo.naturalHeight) : 164,
  };
};

const compactCategoryPhotos = (categoryPhotos = {}) =>
  Object.fromEntries(
    Object.entries(categoryPhotos)
      .map(([id, photo]) => [id, compactCategoryPhoto(photo)])
      .filter(([, photo]) => Boolean(photo)),
  );

const pendingCategoryPhotos = {};

const cleanHomeConfig = (rawConfig) => {
  const allCategories = allCategoriesFrom(rawConfig);
  const selectedCategories = Array.isArray(rawConfig?.categories)
    ? rawConfig.categories.filter((id) => allCategories.some((category) => category.id === id))
    : allCategories.map((category) => category.id);

  return {
    categories: selectedCategories.length ? selectedCategories : allCategories.map((category) => category.id),
    customCategories: customCategoriesFrom(rawConfig),
    categoryColors: rawConfig?.categoryColors || {},
    categoryPhotos: compactCategoryPhotos(rawConfig?.categoryPhotos || {}),
    featuredProductIds: Array.isArray(rawConfig?.featuredProductIds)
      ? rawConfig.featuredProductIds.map(String)
      : [],
  };
};

let homeConfig = cleanHomeConfig(readJson(homeConfigKey, null));
let isProductPickerOpen = false;
let isCategoryModalOpen = false;
let openCategoryActionsId = null;
let activeCategoryPhotoId = null;
let categoryPhotoDraft;
let categoryPhotoDrag = null;
let categoryPhotoTouch = null;
let categoryActionSwipe = null;
let suppressCategoryClick = false;
let isCategoryPhotoDeleteConfirmOpen = false;
const categoryPhotoCropSize = 260;
const categoryActionsOffset = 82;

const readProducts = () => readJson(productsKey, []);

const normalizeProductPhoto = (photo) =>
  typeof photo === "string" ? { id: "", name: photo, url: "" } : photo;

const productColors = (product) => [...new Set([...(product.colors?.main || []), ...(product.colors?.accent || [])])];

const productCover = (product) => (product.productPhotos || []).map(normalizeProductPhoto).find((photo) => photo.url);

const isProductReady = (product) => product.status === "ready";

const isProductInCatalog = (product) => isProductReady(product) && product.inCatalog !== false;

const normalizeCategoryPhoto = (photo) =>
  (photo?.src || photo?.url || photo?.preview || photo?.original)
    ? {
        name: photo.name || "",
        src: photo.src || photo.original || photo.url || photo.preview,
        original: photo.original || photo.src || photo.url || photo.preview,
        preview: photo.preview || photo.url || photo.src,
        x: Number.isFinite(Number(photo.x)) ? Number(photo.x) : Number(photo.pos?.x) || 0,
        y: Number.isFinite(Number(photo.y)) ? Number(photo.y) : Number(photo.pos?.y) || 0,
        scale: Number.isFinite(Number(photo.scale)) ? Number(photo.scale) : 1,
        aspect: Number.isFinite(Number(photo.aspect)) && Number(photo.aspect) > 0 ? Number(photo.aspect) : 1,
        naturalWidth: Number.isFinite(Number(photo.naturalWidth)) ? Number(photo.naturalWidth) : 0,
        naturalHeight: Number.isFinite(Number(photo.naturalHeight)) ? Number(photo.naturalHeight) : 0,
      }
    : null;

const categoryPhotoStyle = (photo, cropSize = categoryPhotoCropSize) => {
  const normalized = normalizeCategoryPhoto(photo);
  if (!normalized) return "";
  const naturalWidth = normalized.naturalWidth || (normalized.aspect >= 1 ? normalized.aspect * cropSize : cropSize);
  const naturalHeight = normalized.naturalHeight || (normalized.aspect >= 1 ? cropSize : cropSize / normalized.aspect);
  const previewBaseScale = Math.max(cropSize / naturalWidth, cropSize / naturalHeight);
  const baseWidth = naturalWidth * previewBaseScale;
  const baseHeight = naturalHeight * previewBaseScale;
  return [
    `width:${baseWidth}px`,
    `height:${baseHeight}px`,
    `transform:${categoryPhotoTransform(normalized)}`,
  ].join(";");
};

const categoryPhotoTransform = (photo) => {
  const normalized = normalizeCategoryPhoto(photo);
  return normalized ? `translate(calc(-50% + ${normalized.x}px), calc(-50% + ${normalized.y}px)) scale(${normalized.scale})` : "";
};

const clampPhotoDraft = (photo) => {
  const normalized = normalizeCategoryPhoto(photo);
  if (!normalized) return null;
  return {
    ...normalized,
    x: Math.max(-categoryPhotoCropSize, Math.min(categoryPhotoCropSize, normalized.x)),
    y: Math.max(-categoryPhotoCropSize, Math.min(categoryPhotoCropSize, normalized.y)),
    scale: Math.max(1, Math.min(5, normalized.scale)),
  };
};

const setCategorySwipeOffset = (categoryId, offset) => {
  const shell = document.querySelector(`.admin-vitrine-category-shell[data-category-shell="${CSS.escape(categoryId)}"]`);
  if (!shell) return;
  shell.style.setProperty("--category-swipe-offset", `${Math.max(0, Math.min(categoryActionsOffset, offset))}px`);
  shell.classList.add("is-swiping");
};

const clearCategorySwipeOffset = (categoryId) => {
  const shell = document.querySelector(`.admin-vitrine-category-shell[data-category-shell="${CSS.escape(categoryId)}"]`);
  if (!shell) return;
  shell.classList.remove("is-swiping");
  shell.style.removeProperty("--category-swipe-offset");
};

const drawCategoryPhotoPreview = (image, photo, outputSize = 164) => {
  const normalized = normalizeCategoryPhoto(photo);
  if (!normalized?.src) return null;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const cropSize = categoryPhotoCropSize;
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const baseScale = Math.max(cropSize / imageWidth, cropSize / imageHeight);
  const finalScale = baseScale * normalized.scale;
  const width = imageWidth * finalScale * (outputSize / cropSize);
  const height = imageHeight * finalScale * (outputSize / cropSize);

  context.drawImage(
    image,
    (outputSize - width) / 2 + normalized.x * (outputSize / cropSize),
    (outputSize - height) / 2 + normalized.y * (outputSize / cropSize),
    width,
    height,
  );

  const preview = canvas.toDataURL("image/jpeg", 0.86);
  return {
    name: normalized.name,
    src: normalized.original || normalized.src,
    original: normalized.original || normalized.src,
    preview,
    x: normalized.x,
    y: normalized.y,
    scale: normalized.scale,
    aspect: normalized.aspect,
    naturalWidth: normalized.naturalWidth || imageWidth,
    naturalHeight: normalized.naturalHeight || imageHeight,
  };
};

const buildImmediateCategoryPhotoPreview = (photo) => {
  const normalized = normalizeCategoryPhoto(photo);
  const image = document.querySelector("[data-category-photo-crop] img");
  if (!normalized?.src || !image?.complete) return normalized;

  try {
    return drawCategoryPhotoPreview(image, normalized);
  } catch {
    return normalized;
  }
};

const buildCategoryPhotoPreview = (photo, outputSize = 164) =>
  new Promise((resolve) => {
    const normalized = normalizeCategoryPhoto(photo);
    if (!normalized?.src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.addEventListener("load", () => {
      try {
        resolve(drawCategoryPhotoPreview(image, normalized, outputSize) || normalized);
      } catch {
        resolve(normalized);
      }
    });
    image.addEventListener("error", () => resolve(normalized));
    image.src = normalized.src;
  });

const closeCategoryPhotoModal = () => {
  activeCategoryPhotoId = null;
  categoryPhotoDraft = undefined;
  categoryPhotoDrag = null;
  categoryPhotoTouch = null;
  isCategoryPhotoDeleteConfirmOpen = false;
  if (categoryPhotoModal) categoryPhotoModal.innerHTML = "";
};

const updateCategoryPhotoPreview = (root = document) => {
  const previewImage = root.querySelector("[data-category-photo-crop] img");
  if (previewImage) previewImage.style.transform = categoryPhotoTransform(categoryPhotoDraft);
};

const confirmCategoryPhotoSelection = (forcedCategoryId = activeCategoryPhotoId) => {
  if (!forcedCategoryId) {
    closeCategoryPhotoModal();
    render();
    return;
  }

  const categoryId = forcedCategoryId;
  const draft = normalizeCategoryPhoto(categoryPhotoDraft);
  const immediatePhoto = buildImmediateCategoryPhotoPreview(draft);
  if (immediatePhoto) pendingCategoryPhotos[categoryId] = immediatePhoto;
  else delete pendingCategoryPhotos[categoryId];

  closeCategoryPhotoModal();
  render();

  if (!draft?.src) {
    const nextPhotos = { ...(homeConfig.categoryPhotos || {}) };
    delete nextPhotos[categoryId];
    homeConfig = cleanHomeConfig({ ...homeConfig, categoryPhotos: nextPhotos });
    writeJson(homeConfigKey, homeConfig);
    render();
    return;
  }

  buildCategoryPhotoPreview(draft)
    .then((finalPhoto) => {
      homeConfig = cleanHomeConfig({
        ...homeConfig,
        categoryPhotos: {
          ...(homeConfig.categoryPhotos || {}),
          [categoryId]: finalPhoto,
        },
      });
      writeJson(homeConfigKey, homeConfig);
      delete pendingCategoryPhotos[categoryId];
      render();
    })
    .catch(() => {
      render();
    });
};

const bindCategoryPhotoModalControls = (categoryId) => {
  if (!categoryPhotoModal) return;

  categoryPhotoModal.querySelector("[data-confirm-category-photo]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    confirmCategoryPhotoSelection(categoryId);
  });

  categoryPhotoModal.querySelectorAll("[data-close-category-photo]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCategoryPhotoModal();
      render();
    });
  });

  categoryPhotoModal.querySelector("[data-pick-category-photo]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelector("#categoryPhotoInput")?.click();
  });

  categoryPhotoModal.querySelector("[data-remove-category-photo]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    isCategoryPhotoDeleteConfirmOpen = true;
    render();
  });

  categoryPhotoModal.querySelectorAll("[data-cancel-remove-category-photo]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      isCategoryPhotoDeleteConfirmOpen = false;
      render();
    });
  });

  categoryPhotoModal.querySelector("[data-confirm-remove-category-photo]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    categoryPhotoDraft = null;
    isCategoryPhotoDeleteConfirmOpen = false;
    render();
  });

  categoryPhotoModal.querySelector(".admin-vitrine-photo-backdrop")?.addEventListener("click", (event) => {
    if (
      event.target.closest(".admin-vitrine-photo-modal") ||
      event.target.closest(".admin-vitrine-delete-photo-modal")
    ) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (isCategoryPhotoDeleteConfirmOpen) {
      isCategoryPhotoDeleteConfirmOpen = false;
      render();
      return;
    }
    closeCategoryPhotoModal();
    render();
  });
};

const categoryIcon = (category) => {
  const normalized = String(category || "").toLowerCase();
  if (normalized.includes("pantoufle")) return "◒";
  if (normalized.includes("porte")) return "◇";
  if (normalized.includes("couverture")) return "▧";
  if (normalized.includes("vêtement") || normalized.includes("vetement")) return "♢";
  if (normalized.includes("ami") || normalized.includes("peluche")) return "●";
  return "✦";
};

const saveHomeConfig = (nextConfig) => {
  homeConfig = cleanHomeConfig(nextConfig);
  writeJson(homeConfigKey, homeConfig);
  render();
};

const moveItem = (items, index, direction) => {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
};

const catalogProducts = () => readProducts().filter(isProductInCatalog);

const selectedProducts = (products) =>
  homeConfig.featuredProductIds
    .map((id) => products.find((product) => String(product.id) === String(id)))
    .filter(Boolean);

const renderStats = (products, selected) => {
  if (homeCategoryCount) homeCategoryCount.textContent = homeConfig.categories.length.toString();
  if (homeFeaturedCount) homeFeaturedCount.textContent = selected.length.toString();
  if (homeCatalogCount) homeCatalogCount.textContent = products.length.toString();
};

const renderCategoryCard = (category, orderedCategories, index) => {
  const isSelected = orderedCategories.includes(category.id);
  const selectedIndex = orderedCategories.indexOf(category.id);
  const canRemove = category.custom || isSelected;
  const isActionsOpen = openCategoryActionsId === category.id;

  return `
    <article class="admin-vitrine-category-shell ${isActionsOpen ? "is-actions-open" : ""}" data-category-shell="${category.id}" style="--category-color:${category.color}">
      <div class="admin-vitrine-category-slide-actions" aria-label="Actions de ${escapeHtml(category.label)}">
        <label class="admin-vitrine-category-slide-button color">
          <i style="--swatch:${category.color}" aria-hidden="true"></i>
          <span>Couleur</span>
          <input type="color" value="${category.color}" data-category-color="${category.id}" aria-label="Changer la couleur de ${escapeHtml(category.label)}" />
        </label>
        <button class="danger" type="button" data-category-remove="${category.id}" ${!canRemove ? "disabled" : ""}>Retirer</button>
      </div>
      <div class="admin-vitrine-category-card ${isSelected ? "is-selected" : ""}" data-category-card="${category.id}">
      <div class="admin-vitrine-category-main">
        <button type="button" class="admin-vitrine-category-photo-button" data-category-photo="${category.id}" aria-label="Modifier la photo de ${escapeHtml(category.label)}">
          ${
            category.photo?.preview || category.photo?.url || category.photo?.src
              ? `<img src="${category.photo.preview || category.photo.url || category.photo.src}" alt="${escapeHtml(category.photo.name || category.label)}" />`
              : `<span class="admin-vitrine-category-symbol" aria-hidden="true">${category.icon}</span>`
          }
        </button>
        <button type="button" class="admin-vitrine-category-text" data-category-toggle="${category.id}">
          <strong>${escapeHtml(category.label)}</strong>
          <small>${isSelected ? `Position ${selectedIndex + 1}` : "Masquée"}</small>
        </button>
      </div>
      <div class="admin-vitrine-order-actions" aria-label="Ordre de ${escapeHtml(category.label)}">
        <button type="button" data-category-move="${category.id}" data-direction="-1" ${!isSelected || selectedIndex <= 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-category-move="${category.id}" data-direction="1" ${
          !isSelected || selectedIndex >= orderedCategories.length - 1 ? "disabled" : ""
        }>↓</button>
      </div>
      </div>
    </article>
  `;
};

const renderCategoryPhotoModal = () => {
  if (!categoryPhotoModal) return;
  if (!activeCategoryPhotoId) {
    categoryPhotoModal.innerHTML = "";
    isCategoryPhotoDeleteConfirmOpen = false;
    return;
  }

  const category = allCategoriesFrom(homeConfig).find((item) => item.id === activeCategoryPhotoId);
  if (!category) {
    activeCategoryPhotoId = null;
    categoryPhotoDraft = null;
    isCategoryPhotoDeleteConfirmOpen = false;
    categoryPhotoModal.innerHTML = "";
    return;
  }
  const previewPhoto =
    categoryPhotoDraft === undefined ? normalizeCategoryPhoto(category.photo) : normalizeCategoryPhoto(categoryPhotoDraft);

  categoryPhotoModal.innerHTML = `
    <div class="admin-product-modal-backdrop admin-vitrine-photo-backdrop" role="presentation">
      <section class="admin-product-modal admin-vitrine-photo-modal" role="dialog" aria-modal="true" aria-labelledby="category-photo-title">
        <button class="admin-product-modal-close" type="button" data-close-category-photo aria-label="Fermer">×</button>
        <span>${escapeHtml(category.label)}</span>
        <h2 id="category-photo-title">Photo de catégorie</h2>
        <div class="admin-vitrine-photo-preview" data-category-photo-crop style="--category-color:${category.color}">
          ${
            previewPhoto?.src
              ? `<img src="${previewPhoto.src}" alt="${escapeHtml(previewPhoto.name || category.label)}" style="${categoryPhotoStyle(previewPhoto)}" />`
              : `<span aria-hidden="true">${category.icon}</span>`
          }
        </div>
        <p class="admin-vitrine-photo-hint">${previewPhoto?.src ? "Glisse la photo dans le cercle pour la cadrer." : "Importe une photo pour la cadrer."}</p>
        <input id="categoryPhotoInput" type="file" accept="image/*" hidden />
        <div class="admin-vitrine-photo-actions">
          <button class="admin-vitrine-primary-action" type="button" data-pick-category-photo>${previewPhoto?.src ? "Remplacer" : "Importer"}</button>
          <button class="admin-vitrine-danger-action" type="button" data-remove-category-photo ${previewPhoto?.src ? "" : "disabled"}>Supprimer</button>
          <button class="admin-vitrine-confirm-action admin-vitrine-primary-action" type="button" data-confirm-category-photo>Confirmer</button>
        </div>
      </section>
      ${
        isCategoryPhotoDeleteConfirmOpen
          ? `
            <section class="admin-product-modal admin-vitrine-delete-photo-modal" role="dialog" aria-modal="true" aria-labelledby="delete-category-photo-title">
              <button class="admin-product-modal-close" type="button" data-cancel-remove-category-photo aria-label="Fermer">×</button>
              <span>${escapeHtml(category.label)}</span>
              <h2 id="delete-category-photo-title">Supprimer la photo?</h2>
              <p>La catégorie reviendra à son icône de base. Tu pourras importer une autre photo ensuite.</p>
              <div class="admin-vitrine-delete-photo-actions">
                <button type="button" data-cancel-remove-category-photo>Annuler</button>
                <button type="button" data-confirm-remove-category-photo>Supprimer</button>
              </div>
            </section>
          `
          : ""
      }
    </div>
  `;
  bindCategoryPhotoModalControls(activeCategoryPhotoId);
};

const renderCategories = () => {
  if (!homeCategories) return;
  const allCategories = allCategoriesFrom(homeConfig);
  const ordered = [
    ...homeConfig.categories,
    ...allCategories.map((category) => category.id).filter((id) => !homeConfig.categories.includes(id)),
  ];
  const categories = ordered
    .map((id) => allCategories.find((category) => category.id === id))
    .filter(Boolean);

  homeCategories.innerHTML = `
    ${categories.map((category, index) => renderCategoryCard(category, homeConfig.categories, index)).join("")}
    <button type="button" class="admin-vitrine-category-card admin-vitrine-add-category-card" data-open-category-modal>
      <span>
        <strong>Ajouter une catégorie</strong>
        <small>Créer une nouvelle entrée</small>
      </span>
    </button>
  `;
};

const renderCategoryModal = () => {
  if (!categoryModal) return;
  if (!isCategoryModalOpen) {
    categoryModal.innerHTML = "";
    return;
  }

  categoryModal.innerHTML = `
    <div class="admin-product-modal-backdrop admin-vitrine-category-backdrop" role="presentation">
      <section class="admin-product-modal admin-vitrine-category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <button class="admin-product-modal-close" type="button" data-close-category-modal aria-label="Fermer">×</button>
        <span>Catégorie</span>
        <h2 id="category-modal-title">Ajouter une catégorie</h2>
        <form class="admin-vitrine-add-category" id="addCategoryForm">
          <label>
            <span>Nouvelle catégorie</span>
            <input id="newCategoryName" type="text" placeholder="Ex: Bonnets" autocomplete="off" />
          </label>
          <label>
            <span>Couleur</span>
            <input id="newCategoryColor" type="color" value="#30c7c9" />
          </label>
          <button class="admin-vitrine-submit-category admin-vitrine-primary-action" type="submit">Ajouter</button>
        </form>
      </section>
    </div>
  `;
};

const renderProductCard = (product, options = {}) => {
  const cover = productCover(product);
  const colors = productColors(product);
  const visibleColors = colors.slice(0, 4);
  const remainingColors = Math.max(0, colors.length - visibleColors.length);
  const primaryColor = product.cardColor || colors[0] || "#30c7c9";
  const accentColor = colors[1] || "#e84b94";
  const orderLabel = typeof options.index === "number" ? `#${options.index + 1}` : "catalogue";

  return `
    <article class="admin-vitrine-product-card" style="--product-color:${primaryColor}; --product-accent:${accentColor}">
      <div class="admin-vitrine-product-image ${cover ? "has-product-photo" : ""}">
        ${
          cover
            ? `<img src="${cover.url}" alt="${escapeHtml(cover.name || product.name || "Produit")}" />`
            : `<span aria-hidden="true">${categoryIcon(product.category)}</span>`
        }
      </div>
      <div class="admin-vitrine-product-info">
        <small>${orderLabel}</small>
        <strong>${escapeHtml(product.name || "Produit sans nom")}</strong>
        <p>À partir de <b>${escapeHtml(product.price || "prix à définir")}</b></p>
        <div class="admin-vitrine-swatches" aria-label="Couleurs">
          ${
            visibleColors.length
              ? visibleColors.map((color) => `<span style="--swatch:${color}"></span>`).join("")
              : '<span style="--swatch:#f05b4f"></span><span style="--swatch:#30c7c9"></span>'
          }
          ${remainingColors ? `<em>+${remainingColors}</em>` : ""}
        </div>
      </div>
      <div class="admin-vitrine-card-actions">
        ${
          options.selected
            ? `
              <button type="button" data-feature-move="${product.id}" data-direction="-1" ${
                options.index <= 0 ? "disabled" : ""
              } aria-label="Monter">↑</button>
              <button type="button" data-feature-move="${product.id}" data-direction="1" ${
                options.index >= options.total - 1 ? "disabled" : ""
              } aria-label="Descendre">↓</button>
              <button type="button" data-feature-remove="${product.id}">Retirer</button>
            `
            : `<button class="admin-vitrine-primary-action" type="button" data-feature-add="${product.id}">Ajouter</button>`
        }
      </div>
    </article>
  `;
};

const renderFeaturedProducts = (products, selected) => {
  if (!featuredProducts) return;

  featuredProducts.innerHTML = selected.length
    ? `
        <button type="button" class="admin-vitrine-add-products-button" data-open-product-picker>
          Ajouter des produits
        </button>
        ${selected
        .map((product, index) =>
          renderProductCard(product, {
            selected: true,
            index,
            total: selected.length,
          }),
        )
        .join("")}
      `
    : `
      <button type="button" class="admin-vitrine-add-product-empty-button admin-vitrine-dashed-action" data-open-product-picker>
        Ajouter un produit
      </button>
    `;
};

const renderProductPicker = (products) => {
  if (!productPickerModal) return;
  if (!isProductPickerOpen) {
    productPickerModal.innerHTML = "";
    return;
  }

  const selectedIds = new Set(homeConfig.featuredProductIds.map(String));
  const available = products.filter((product) => !selectedIds.has(String(product.id)));

  productPickerModal.innerHTML = `
    <div class="admin-product-modal-backdrop admin-vitrine-picker-backdrop" role="presentation">
      <section class="admin-product-modal admin-vitrine-picker" role="dialog" aria-modal="true" aria-labelledby="product-picker-title">
        <button class="admin-product-modal-close" type="button" data-close-product-picker aria-label="Fermer">×</button>
        <span>Catalogue</span>
        <h2 id="product-picker-title">Ajouter aux populaires</h2>
        <p>Sélectionne les produits qui doivent apparaître dans la section Nos populaires.</p>
        <div class="admin-vitrine-picker-list">
          ${
            available.length
              ? available.map((product) => renderProductCard(product)).join("")
              : `
                <div class="admin-vitrine-empty">
                  <strong>${products.length ? "Tous les produits sont déjà ajoutés" : "Aucun produit au catalogue"}</strong>
                  <p>${
                    products.length
                      ? "Ferme cette fenêtre pour réorganiser ou retirer les produits déjà choisis."
                      : "Finalise un produit dans le module Produits pour le rendre disponible ici."
                  }</p>
                </div>
              `
          }
        </div>
      </section>
    </div>
  `;
};

function render() {
  const products = catalogProducts();
  const selected = selectedProducts(products);
  const cleanedSelectedIds = selected.map((product) => String(product.id));

  if (cleanedSelectedIds.length !== homeConfig.featuredProductIds.length) {
    homeConfig = { ...homeConfig, featuredProductIds: cleanedSelectedIds };
    writeJson(homeConfigKey, homeConfig);
  }

  renderStats(products, selected);
  renderCategories();
  renderFeaturedProducts(products, selected);
  renderProductPicker(products);
  renderCategoryModal();
  renderCategoryPhotoModal();
}

document.addEventListener("click", async (event) => {
  if (event.target instanceof Element && event.target.closest("#categoryPhotoModal")) return;

  if (suppressCategoryClick && event.target.closest("[data-category-card]")) {
    event.preventDefault();
    event.stopPropagation();
    suppressCategoryClick = false;
    return;
  }

  const categoryToggle = event.target.closest("[data-category-toggle]");
  const categoryMove = event.target.closest("[data-category-move]");
  const categoryRemove = event.target.closest("[data-category-remove]");
  const categoryPhoto = event.target.closest("[data-category-photo]");
  const categoryCard = event.target.closest("[data-category-card]");
  const openCategoryModal = event.target.closest("[data-open-category-modal]");
  const closeCategoryModal = event.target.closest("[data-close-category-modal]");
  const openProductPicker = event.target.closest("[data-open-product-picker]");
  const closeProductPicker = event.target.closest("[data-close-product-picker]");
  const featureAdd = event.target.closest("[data-feature-add]");
  const featureRemove = event.target.closest("[data-feature-remove]");
  const featureMove = event.target.closest("[data-feature-move]");
  const shouldCloseCategoryActions =
    openCategoryActionsId && !event.target.closest(".admin-vitrine-category-shell");

  if (shouldCloseCategoryActions) {
    openCategoryActionsId = null;
  }

  if (
    shouldCloseCategoryActions &&
    !categoryToggle &&
    !categoryMove &&
    !categoryRemove &&
    !categoryPhoto &&
    !categoryCard &&
    !openCategoryModal &&
    !closeCategoryModal &&
    !openProductPicker &&
    !closeProductPicker &&
    !featureAdd &&
    !featureRemove &&
    !featureMove
  ) {
    render();
    return;
  }

  if (categoryToggle) {
    openCategoryActionsId = null;
    const categoryId = categoryToggle.dataset.categoryToggle;
    const isSelected = homeConfig.categories.includes(categoryId);
    saveHomeConfig({
      ...homeConfig,
      categories: isSelected
        ? homeConfig.categories.filter((id) => id !== categoryId)
        : [...homeConfig.categories, categoryId],
    });
    return;
  }

  if (categoryMove) {
    openCategoryActionsId = null;
    const categoryId = categoryMove.dataset.categoryMove;
    const index = homeConfig.categories.indexOf(categoryId);
    saveHomeConfig({
      ...homeConfig,
      categories: moveItem(homeConfig.categories, index, Number(categoryMove.dataset.direction || 0)),
    });
    return;
  }

  if (categoryRemove) {
    openCategoryActionsId = null;
    const categoryId = categoryRemove.dataset.categoryRemove;
    const category = allCategoriesFrom(homeConfig).find((item) => item.id === categoryId);
    const nextCategories = homeConfig.categories.filter((id) => id !== categoryId);

    if (category?.custom) {
      if (!window.confirm(`Retirer la catégorie "${category.label}" ?`)) return;
      const nextPhotos = { ...(homeConfig.categoryPhotos || {}) };
      delete nextPhotos[categoryId];
      saveHomeConfig({
        ...homeConfig,
        categories: nextCategories,
        categoryPhotos: nextPhotos,
        customCategories: homeConfig.customCategories.filter((item) => item.id !== categoryId),
      });
      return;
    }

    saveHomeConfig({ ...homeConfig, categories: nextCategories });
    return;
  }

  if (categoryPhoto) {
    activeCategoryPhotoId = categoryPhoto.dataset.categoryPhoto;
    const category = allCategoriesFrom(homeConfig).find((item) => item.id === activeCategoryPhotoId);
    categoryPhotoDraft = normalizeCategoryPhoto(category?.photo);
    render();
    return;
  }

  if (openCategoryModal) {
    isCategoryModalOpen = true;
    render();
    window.requestAnimationFrame(() => document.querySelector("#newCategoryName")?.focus());
    return;
  }

  if (
    closeCategoryModal ||
    (event.target.closest(".admin-vitrine-category-backdrop") && !event.target.closest(".admin-vitrine-category-modal"))
  ) {
    isCategoryModalOpen = false;
    render();
    return;
  }

  if (openProductPicker) {
    isProductPickerOpen = true;
    render();
    return;
  }

  if (closeProductPicker || (event.target.closest(".admin-vitrine-picker-backdrop") && !event.target.closest(".admin-vitrine-picker"))) {
    isProductPickerOpen = false;
    render();
    return;
  }

  if (featureAdd) {
    const productId = String(featureAdd.dataset.featureAdd);
    if (homeConfig.featuredProductIds.includes(productId)) return;
    saveHomeConfig({ ...homeConfig, featuredProductIds: [...homeConfig.featuredProductIds, productId] });
    return;
  }

  if (featureRemove) {
    const productId = String(featureRemove.dataset.featureRemove);
    saveHomeConfig({
      ...homeConfig,
      featuredProductIds: homeConfig.featuredProductIds.filter((id) => String(id) !== productId),
    });
    return;
  }

  if (featureMove) {
    const productId = String(featureMove.dataset.featureMove);
    const index = homeConfig.featuredProductIds.indexOf(productId);
    saveHomeConfig({
      ...homeConfig,
      featuredProductIds: moveItem(homeConfig.featuredProductIds, index, Number(featureMove.dataset.direction || 0)),
    });
  }
});

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") return;
  const categoryCard = event.target.closest("[data-category-card]");
  if (categoryCard && !event.target.closest("input, label")) {
    categoryActionSwipe = {
      pointerId: event.pointerId,
      categoryId: categoryCard.dataset.categoryCard,
      startX: event.clientX,
      startY: event.clientY,
      wasOpen: openCategoryActionsId === categoryCard.dataset.categoryCard,
    };
    return;
  }

  const cropTarget = event.target.closest("[data-category-photo-crop]");
  if (!cropTarget || !categoryPhotoDraft?.src) return;

  event.preventDefault();
  cropTarget.setPointerCapture?.(event.pointerId);
  const photo = clampPhotoDraft(categoryPhotoDraft);
  categoryPhotoDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    photoX: photo.x,
    photoY: photo.y,
  };
});

document.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  if (categoryActionSwipe?.pointerId === event.pointerId) {
    const deltaX = event.clientX - categoryActionSwipe.startX;
    const deltaY = event.clientY - categoryActionSwipe.startY;
    if (Math.abs(deltaX) > 4 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
      const baseOffset = categoryActionSwipe.wasOpen ? categoryActionsOffset : 0;
      setCategorySwipeOffset(categoryActionSwipe.categoryId, baseOffset - deltaX);
    }
    return;
  }
  if (!categoryPhotoDrag || event.pointerId !== categoryPhotoDrag.pointerId || !categoryPhotoDraft?.src) return;

  event.preventDefault();
  categoryPhotoDraft = clampPhotoDraft({
    ...categoryPhotoDraft,
    x: categoryPhotoDrag.photoX + event.clientX - categoryPhotoDrag.startX,
    y: categoryPhotoDrag.photoY + event.clientY - categoryPhotoDrag.startY,
  });

  updateCategoryPhotoPreview();
});

document.addEventListener("pointerup", (event) => {
  if (categoryActionSwipe?.pointerId === event.pointerId) {
    const deltaX = event.clientX - categoryActionSwipe.startX;
    const deltaY = event.clientY - categoryActionSwipe.startY;
    clearCategorySwipeOffset(categoryActionSwipe.categoryId);
    if (Math.abs(deltaX) > 34 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
      openCategoryActionsId = deltaX < 0 ? categoryActionSwipe.categoryId : null;
      suppressCategoryClick = true;
      render();
    }
    categoryActionSwipe = null;
  }
  if (categoryPhotoDrag?.pointerId === event.pointerId) categoryPhotoDrag = null;
});

document.addEventListener("pointercancel", (event) => {
  if (categoryActionSwipe?.pointerId === event.pointerId) {
    clearCategorySwipeOffset(categoryActionSwipe.categoryId);
    categoryActionSwipe = null;
  }
  if (categoryPhotoDrag?.pointerId === event.pointerId) categoryPhotoDrag = null;
});

const categoryTouchDistance = (firstTouch, secondTouch) =>
  Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);

const categoryTouchCenter = (firstTouch, secondTouch) => ({
  x: (firstTouch.clientX + secondTouch.clientX) / 2,
  y: (firstTouch.clientY + secondTouch.clientY) / 2,
});

document.addEventListener(
  "touchstart",
  (event) => {
    const categoryCard = event.target.closest("[data-category-card]");
    if (categoryCard && !event.target.closest("input, label")) {
      const touch = event.touches[0];
      categoryActionSwipe = {
        pointerId: "touch",
        categoryId: categoryCard.dataset.categoryCard,
        startX: touch.clientX,
        startY: touch.clientY,
        wasOpen: openCategoryActionsId === categoryCard.dataset.categoryCard,
      };
      return;
    }

    const cropTarget = event.target.closest("[data-category-photo-crop]");
    if (!cropTarget || !categoryPhotoDraft?.src) return;

    const photo = clampPhotoDraft(categoryPhotoDraft);
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      categoryPhotoTouch = {
        mode: "pan",
        startX: touch.clientX,
        startY: touch.clientY,
        photoX: photo.x,
        photoY: photo.y,
      };
    } else if (event.touches.length === 2) {
      const center = categoryTouchCenter(event.touches[0], event.touches[1]);
      categoryPhotoTouch = {
        mode: "pinch",
        startDistance: categoryTouchDistance(event.touches[0], event.touches[1]),
        startScale: photo.scale,
        startX: center.x,
        startY: center.y,
        photoX: photo.x,
        photoY: photo.y,
      };
    }
  },
  { passive: true },
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (categoryActionSwipe?.pointerId === "touch") {
      const touch = event.touches[0];
      const deltaX = touch.clientX - categoryActionSwipe.startX;
      const deltaY = touch.clientY - categoryActionSwipe.startY;
      if (Math.abs(deltaX) > 4 && Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
        const baseOffset = categoryActionSwipe.wasOpen ? categoryActionsOffset : 0;
        setCategorySwipeOffset(categoryActionSwipe.categoryId, baseOffset - deltaX);
      }
      return;
    }
    if (!categoryPhotoTouch || !categoryPhotoDraft?.src) return;

    if (categoryPhotoTouch.mode === "pan" && event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      categoryPhotoDraft = clampPhotoDraft({
        ...categoryPhotoDraft,
        x: categoryPhotoTouch.photoX + touch.clientX - categoryPhotoTouch.startX,
        y: categoryPhotoTouch.photoY + touch.clientY - categoryPhotoTouch.startY,
      });
      updateCategoryPhotoPreview();
      return;
    }

    if (categoryPhotoTouch.mode === "pinch" && event.touches.length === 2) {
      event.preventDefault();
      const center = categoryTouchCenter(event.touches[0], event.touches[1]);
      const distance = categoryTouchDistance(event.touches[0], event.touches[1]);
      const nextScale = categoryPhotoTouch.startScale * (distance / categoryPhotoTouch.startDistance);
      categoryPhotoDraft = clampPhotoDraft({
        ...categoryPhotoDraft,
        scale: nextScale,
        x: categoryPhotoTouch.photoX + center.x - categoryPhotoTouch.startX,
        y: categoryPhotoTouch.photoY + center.y - categoryPhotoTouch.startY,
      });
      updateCategoryPhotoPreview();
    }
  },
  { passive: false },
);

document.addEventListener("touchend", (event) => {
  if (categoryActionSwipe?.pointerId === "touch") {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - categoryActionSwipe.startX;
    const deltaY = touch.clientY - categoryActionSwipe.startY;
    clearCategorySwipeOffset(categoryActionSwipe.categoryId);
    if (Math.abs(deltaX) > 34 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
      openCategoryActionsId = deltaX < 0 ? categoryActionSwipe.categoryId : null;
      suppressCategoryClick = true;
      render();
    }
    categoryActionSwipe = null;
  }
  categoryPhotoTouch = null;
});

document.addEventListener("touchcancel", () => {
  if (categoryActionSwipe?.categoryId) clearCategorySwipeOffset(categoryActionSwipe.categoryId);
  categoryActionSwipe = null;
  categoryPhotoTouch = null;
});

document.addEventListener("change", (event) => {
  const categoryColor = event.target.closest("[data-category-color]");
  if (categoryColor) {
    const categoryId = categoryColor.dataset.categoryColor;
    saveHomeConfig({
      ...homeConfig,
      categoryColors: {
        ...(homeConfig.categoryColors || {}),
        [categoryId]: categoryColor.value,
      },
      customCategories: homeConfig.customCategories.map((category) =>
        category.id === categoryId ? { ...category, color: categoryColor.value } : category,
      ),
    });
    openCategoryActionsId = categoryId;
    return;
  }

  const input = event.target.closest("#categoryPhotoInput");
  const file = input?.files?.[0];
  if (!input || !file || !activeCategoryPhotoId) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      categoryPhotoDraft = {
        name: file.name,
        src: String(reader.result || ""),
        x: 0,
        y: 0,
        scale: 1,
        aspect: image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1,
        naturalWidth: image.naturalWidth || 0,
        naturalHeight: image.naturalHeight || 0,
      };
      render();
    });
    image.addEventListener("error", () => {
      categoryPhotoDraft = {
        name: file.name,
        src: String(reader.result || ""),
        x: 0,
        y: 0,
        scale: 1,
        aspect: 1,
        naturalWidth: 0,
        naturalHeight: 0,
      };
      render();
    });
    image.src = String(reader.result || "");
  });
  reader.readAsDataURL(file);
});

document.addEventListener("submit", (event) => {
  const addCategoryForm = event.target.closest("#addCategoryForm");
  if (!addCategoryForm) return;

  event.preventDefault();
  const newCategoryName = addCategoryForm.querySelector("#newCategoryName");
  const newCategoryColor = addCategoryForm.querySelector("#newCategoryColor");
  const label = newCategoryName?.value.trim();
  if (!label) {
    newCategoryName?.focus();
    return;
  }

  const existingIds = new Set(allCategoriesFrom(homeConfig).map((category) => category.id));
  const baseId = slugifyCategory(label);
  let id = baseId;
  let suffix = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const customCategory = {
    id,
    label,
    color: newCategoryColor?.value || "#30c7c9",
    icon: categoryPalette[(homeConfig.customCategories || []).length % categoryPalette.length],
    custom: true,
  };

  homeConfig = cleanHomeConfig({
    ...homeConfig,
    categories: [...homeConfig.categories, id],
    customCategories: [...(homeConfig.customCategories || []), customCategory],
  });
  writeJson(homeConfigKey, homeConfig);
  isCategoryModalOpen = false;
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || (!isProductPickerOpen && !isCategoryModalOpen && !activeCategoryPhotoId)) return;
  isProductPickerOpen = false;
  isCategoryModalOpen = false;
  activeCategoryPhotoId = null;
  categoryPhotoDraft = undefined;
  render();
});

render();
