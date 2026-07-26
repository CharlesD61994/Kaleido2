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
  const usedIds = new Set(defaultCategories.map((category) => category.id));
  const customCategories = customCategoriesFrom(rawConfig).filter((category) => {
    if (usedIds.has(category.id)) return false;
    usedIds.add(category.id);
    return true;
  });
  const categoryPhotos = rawConfig?.categoryPhotos || {};
  return [...defaultCategories, ...customCategories].map((category) => ({
    ...category,
    photo: categoryPhotos[category.id] || null,
  }));
};

const cleanHomeConfig = (rawConfig) => {
  const allCategories = allCategoriesFrom(rawConfig);
  const selectedCategories = Array.isArray(rawConfig?.categories)
    ? rawConfig.categories.filter((id) => allCategories.some((category) => category.id === id))
    : allCategories.map((category) => category.id);

  return {
    categories: selectedCategories.length ? selectedCategories : allCategories.map((category) => category.id),
    customCategories: customCategoriesFrom(rawConfig),
    categoryPhotos: rawConfig?.categoryPhotos || {},
    featuredProductIds: Array.isArray(rawConfig?.featuredProductIds)
      ? rawConfig.featuredProductIds.map(String)
      : [],
  };
};

let homeConfig = cleanHomeConfig(readJson(homeConfigKey, null));
let isProductPickerOpen = false;
let isCategoryModalOpen = false;
let activeCategoryPhotoId = null;

const readProducts = () => readJson(productsKey, []);

const normalizeProductPhoto = (photo) =>
  typeof photo === "string" ? { id: "", name: photo, url: "" } : photo;

const productColors = (product) => [...new Set([...(product.colors?.main || []), ...(product.colors?.accent || [])])];

const productCover = (product) => (product.productPhotos || []).map(normalizeProductPhoto).find((photo) => photo.url);

const isProductReady = (product) => product.status === "ready";

const isProductInCatalog = (product) => isProductReady(product) && product.inCatalog !== false;

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

  return `
    <article class="admin-vitrine-category-card ${isSelected ? "is-selected" : ""}" style="--category-color:${category.color}">
      <div class="admin-vitrine-category-main">
        <button type="button" class="admin-vitrine-category-photo-button" data-category-photo="${category.id}" aria-label="Modifier la photo de ${escapeHtml(category.label)}">
          ${
            category.photo?.url
              ? `<img src="${category.photo.url}" alt="${escapeHtml(category.photo.name || category.label)}" />`
              : `<span class="admin-vitrine-category-icon" aria-hidden="true">${category.icon}</span>`
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
        <button type="button" data-category-remove="${category.id}" ${!canRemove ? "disabled" : ""}>Retirer</button>
      </div>
    </article>
  `;
};

const renderCategoryPhotoModal = () => {
  if (!categoryPhotoModal) return;
  if (!activeCategoryPhotoId) {
    categoryPhotoModal.innerHTML = "";
    return;
  }

  const category = allCategoriesFrom(homeConfig).find((item) => item.id === activeCategoryPhotoId);
  if (!category) {
    activeCategoryPhotoId = null;
    categoryPhotoModal.innerHTML = "";
    return;
  }

  categoryPhotoModal.innerHTML = `
    <div class="admin-product-modal-backdrop admin-vitrine-photo-backdrop" role="presentation">
      <section class="admin-product-modal admin-vitrine-photo-modal" role="dialog" aria-modal="true" aria-labelledby="category-photo-title">
        <button class="admin-product-modal-close" type="button" data-close-category-photo aria-label="Fermer">×</button>
        <span>${escapeHtml(category.label)}</span>
        <h2 id="category-photo-title">Photo de catégorie</h2>
        <div class="admin-vitrine-photo-preview" style="--category-color:${category.color}">
          ${
            category.photo?.url
              ? `<img src="${category.photo.url}" alt="${escapeHtml(category.photo.name || category.label)}" />`
              : `<span aria-hidden="true">${category.icon}</span>`
          }
        </div>
        <input id="categoryPhotoInput" type="file" accept="image/*" hidden />
        <div class="admin-vitrine-photo-actions">
          <button type="button" data-pick-category-photo>${category.photo?.url ? "Remplacer" : "Importer"}</button>
          <button type="button" data-remove-category-photo ${category.photo?.url ? "" : "disabled"}>Supprimer</button>
        </div>
      </section>
    </div>
  `;
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
      <span class="admin-vitrine-category-icon" aria-hidden="true">+</span>
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
          <button class="admin-vitrine-submit-category" type="submit">Ajouter</button>
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
            : `<button type="button" data-feature-add="${product.id}">Ajouter</button>`
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
      <button type="button" class="admin-vitrine-add-product-empty-button" data-open-product-picker>
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

document.addEventListener("click", (event) => {
  const categoryToggle = event.target.closest("[data-category-toggle]");
  const categoryMove = event.target.closest("[data-category-move]");
  const categoryRemove = event.target.closest("[data-category-remove]");
  const categoryPhoto = event.target.closest("[data-category-photo]");
  const openCategoryModal = event.target.closest("[data-open-category-modal]");
  const closeCategoryModal = event.target.closest("[data-close-category-modal]");
  const closeCategoryPhoto = event.target.closest("[data-close-category-photo]");
  const pickCategoryPhoto = event.target.closest("[data-pick-category-photo]");
  const removeCategoryPhoto = event.target.closest("[data-remove-category-photo]");
  const openProductPicker = event.target.closest("[data-open-product-picker]");
  const closeProductPicker = event.target.closest("[data-close-product-picker]");
  const featureAdd = event.target.closest("[data-feature-add]");
  const featureRemove = event.target.closest("[data-feature-remove]");
  const featureMove = event.target.closest("[data-feature-move]");

  if (categoryToggle) {
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
    const categoryId = categoryMove.dataset.categoryMove;
    const index = homeConfig.categories.indexOf(categoryId);
    saveHomeConfig({
      ...homeConfig,
      categories: moveItem(homeConfig.categories, index, Number(categoryMove.dataset.direction || 0)),
    });
    return;
  }

  if (categoryRemove) {
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
    closeCategoryPhoto ||
    (event.target.closest(".admin-vitrine-photo-backdrop") && !event.target.closest(".admin-vitrine-photo-modal"))
  ) {
    activeCategoryPhotoId = null;
    render();
    return;
  }

  if (pickCategoryPhoto) {
    document.querySelector("#categoryPhotoInput")?.click();
    return;
  }

  if (removeCategoryPhoto && activeCategoryPhotoId) {
    const nextPhotos = { ...(homeConfig.categoryPhotos || {}) };
    delete nextPhotos[activeCategoryPhotoId];
    saveHomeConfig({ ...homeConfig, categoryPhotos: nextPhotos });
    activeCategoryPhotoId = null;
    render();
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

document.addEventListener("change", (event) => {
  const input = event.target.closest("#categoryPhotoInput");
  const file = input?.files?.[0];
  if (!input || !file || !activeCategoryPhotoId) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    saveHomeConfig({
      ...homeConfig,
      categoryPhotos: {
        ...(homeConfig.categoryPhotos || {}),
        [activeCategoryPhotoId]: {
          name: file.name,
          url: String(reader.result || ""),
        },
      },
    });
    activeCategoryPhotoId = null;
    render();
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
  render();
});

render();
