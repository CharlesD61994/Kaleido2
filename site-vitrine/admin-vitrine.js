const productsKey = "kaleido-storefront-product-drafts";
const homeConfigKey = "kaleido-storefront-home-config";

const homeCategoryCount = document.querySelector("#homeCategoryCount");
const homeFeaturedCount = document.querySelector("#homeFeaturedCount");
const homeCatalogCount = document.querySelector("#homeCatalogCount");
const homeCategories = document.querySelector("#homeCategories");
const featuredProducts = document.querySelector("#featuredProducts");
const availableProducts = document.querySelector("#availableProducts");
const homePreview = document.querySelector("#homePreview");

const defaultCategories = [
  { id: "vetements", label: "Vêtements", color: "#7c3aed", icon: "♢" },
  { id: "peluches", label: "Peluches crochetées", color: "#e84b94", icon: "●" },
  { id: "pantoufles", label: "Pantoufles", color: "#30c7c9", icon: "◒" },
  { id: "porte-cles", label: "Porte-clés", color: "#f4831f", icon: "◇" },
  { id: "couvertures", label: "Couvertures", color: "#8bbf3f", icon: "▧" },
];

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

const cleanHomeConfig = (rawConfig) => {
  const selectedCategories = Array.isArray(rawConfig?.categories)
    ? rawConfig.categories.filter((id) => defaultCategories.some((category) => category.id === id))
    : defaultCategories.map((category) => category.id);

  return {
    categories: selectedCategories.length ? selectedCategories : defaultCategories.map((category) => category.id),
    featuredProductIds: Array.isArray(rawConfig?.featuredProductIds)
      ? rawConfig.featuredProductIds.map(String)
      : [],
  };
};

let homeConfig = cleanHomeConfig(readJson(homeConfigKey, null));

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

  return `
    <article class="admin-vitrine-category-card ${isSelected ? "is-selected" : ""}" style="--category-color:${category.color}">
      <button type="button" class="admin-vitrine-category-main" data-category-toggle="${category.id}">
        <span class="admin-vitrine-category-icon" aria-hidden="true">${category.icon}</span>
        <span>
          <strong>${escapeHtml(category.label)}</strong>
          <small>${isSelected ? `Position ${selectedIndex + 1}` : "Masquée"}</small>
        </span>
      </button>
      <div class="admin-vitrine-order-actions" aria-label="Ordre de ${escapeHtml(category.label)}">
        <button type="button" data-category-move="${category.id}" data-direction="-1" ${!isSelected || selectedIndex <= 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-category-move="${category.id}" data-direction="1" ${
          !isSelected || selectedIndex >= orderedCategories.length - 1 ? "disabled" : ""
        }>↓</button>
      </div>
    </article>
  `;
};

const renderCategories = () => {
  if (!homeCategories) return;
  const ordered = [
    ...homeConfig.categories,
    ...defaultCategories.map((category) => category.id).filter((id) => !homeConfig.categories.includes(id)),
  ];
  const categories = ordered
    .map((id) => defaultCategories.find((category) => category.id === id))
    .filter(Boolean);

  homeCategories.innerHTML = categories
    .map((category, index) => renderCategoryCard(category, homeConfig.categories, index))
    .join("");
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
    ? selected
        .map((product, index) =>
          renderProductCard(product, {
            selected: true,
            index,
            total: selected.length,
          }),
        )
        .join("")
    : `
      <div class="admin-vitrine-empty">
        <strong>Aucun produit choisi</strong>
        <p>Ajoute des produits du catalogue pour composer la section d'accueil.</p>
      </div>
    `;
};

const renderAvailableProducts = (products) => {
  if (!availableProducts) return;
  const selectedIds = new Set(homeConfig.featuredProductIds.map(String));
  const available = products.filter((product) => !selectedIds.has(String(product.id)));

  availableProducts.innerHTML = available.length
    ? available.map((product) => renderProductCard(product)).join("")
    : `
      <div class="admin-vitrine-empty">
        <strong>${products.length ? "Tous les produits du catalogue sont déjà placés" : "Aucun produit au catalogue"}</strong>
        <p>${
          products.length
            ? "Tu peux réorganiser les produits d'accueil plus haut."
            : "Finalise un produit dans le module Produits pour le rendre disponible ici."
        }</p>
      </div>
    `;
};

const renderPreview = (selected) => {
  if (!homePreview) return;
  const selectedCategories = homeConfig.categories
    .map((id) => defaultCategories.find((category) => category.id === id))
    .filter(Boolean);

  homePreview.innerHTML = `
    <div class="admin-vitrine-preview-categories">
      ${selectedCategories
        .map(
          (category) => `
            <span style="--category-color:${category.color}">
              <i aria-hidden="true">${category.icon}</i>
              ${escapeHtml(category.label)}
            </span>
          `,
        )
        .join("")}
    </div>
    <div class="admin-vitrine-preview-products">
      ${
        selected.length
          ? selected
              .slice(0, 4)
              .map((product) => {
                const cover = productCover(product);
                const primaryColor = product.cardColor || productColors(product)[0] || "#30c7c9";
                return `
                  <article style="--product-color:${primaryColor}">
                    ${
                      cover
                        ? `<img src="${cover.url}" alt="${escapeHtml(cover.name || product.name || "Produit")}" />`
                        : `<span aria-hidden="true">${categoryIcon(product.category)}</span>`
                    }
                    <strong>${escapeHtml(product.name || "Produit sans nom")}</strong>
                  </article>
                `;
              })
              .join("")
          : '<p>Choisis des produits pour voir le futur accueil prendre forme.</p>'
      }
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
  renderAvailableProducts(products);
  renderPreview(selected);
}

document.addEventListener("click", (event) => {
  const categoryToggle = event.target.closest("[data-category-toggle]");
  const categoryMove = event.target.closest("[data-category-move]");
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

render();
