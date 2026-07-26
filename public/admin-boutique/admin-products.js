const draftsKey = "kaleido-storefront-product-drafts";
const productsGrid = document.querySelector("#productsGrid");
const productSearchInput = document.querySelector("#productSearch");
const productFilters = document.querySelector("#productFilters");
const productCount = document.querySelector("#productCount");
const optionCount = document.querySelector("#optionCount");
const colorCount = document.querySelector("#colorCount");
const publishProductsButton = document.querySelector("#publishProducts");
const homeConfigKey = "kaleido-storefront-home-config";

const optionLabels = {
  mainColor: "Couleur principale",
  accentColor: "Couleur secondaire",
  recipient: "Pour qui ?",
  shoeSize: "Pointure",
  keychain: "Porte-clé",
  personalization: "Personnalisation",
  finish: "Finition",
  delay: "Délai",
};

const cardColors = ["#f05b4f", "#30c7c9", "#e84b94", "#7c3aed", "#f3b51b", "#8bbf3f", "#f4831f"];
let activeFilter = "Tous";
let activeMenuId = null;
let pendingProductAction = null;

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

const readProducts = () => {
  try {
    return JSON.parse(localStorage.getItem(draftsKey) || "[]");
  } catch {
    return [];
  }
};

const saveProducts = (products) => {
  localStorage.setItem(draftsKey, JSON.stringify(products));
};

const setPublishState = (button, state, label) => {
  if (!button) return;
  button.dataset.state = state;
  button.textContent = label;
  button.disabled = state === "saving";
};

const publishProducts = async () => {
  if (!window.KaleidoStorefrontCloud?.isConfigured) {
    setPublishState(publishProductsButton, "error", "Cloud non configuré");
    return;
  }
  if (publishProductsButton?.disabled) return;
  setPublishState(publishProductsButton, "saving", "Publication...");
  const result = await window.KaleidoStorefrontCloud.publishLocalStorefront({
    productsKey: draftsKey,
    homeConfigKey,
  });
  setPublishState(publishProductsButton, result.ok ? "saved" : "error", result.ok ? "Publié" : "Erreur");
  window.setTimeout(() => setPublishState(publishProductsButton, "idle", "Publier"), 2200);
};

const categoryIcon = (category) => {
  const normalized = String(category || "").toLowerCase();
  if (normalized.includes("pantoufle")) return "◒";
  if (normalized.includes("porte")) return "◇";
  if (normalized.includes("couverture")) return "▧";
  if (normalized.includes("vêtement") || normalized.includes("vetement")) return "♢";
  if (normalized.includes("ami")) return "●";
  return "✦";
};

const normalizeProductPhoto = (photo) =>
  typeof photo === "string" ? { id: "", name: photo, url: "" } : photo;

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const productColors = (product) => [...new Set([...(product.colors?.main || []), ...(product.colors?.accent || [])])];

const productOptions = (product) => (product.options || []).map((id) => optionLabels[id]).filter(Boolean);

const isProductReady = (product) => product.status === "ready";

const isProductInCatalog = (product) => isProductReady(product) && product.inCatalog !== false;

const productMatchesFilter = (product) => {
  if (activeFilter === "Tous") return true;
  if (activeFilter === "Brouillons") return !isProductReady(product);
  if (activeFilter === "Catalogue") return isProductInCatalog(product);
  if (activeFilter === "Hors catalogue") return isProductReady(product) && !isProductInCatalog(product);
  const haystack = normalizeText(`${product.category || ""} ${product.name || ""} ${productOptions(product).join(" ")}`);
  return haystack.includes(normalizeText(activeFilter));
};

const productMatchesSearch = (product) => {
  const search = normalizeText(productSearchInput?.value || "");
  if (!search) return true;
  const choices = Object.values(product.optionChoices || {}).flat().join(" ");
  const status = isProductReady(product) ? (isProductInCatalog(product) ? "catalogue" : "hors catalogue") : "brouillon";
  const haystack = normalizeText(
    `${product.name || ""} ${product.category || ""} ${product.price || ""} ${status} ${productOptions(product).join(
      " ",
    )} ${choices}`,
  );
  return haystack.includes(search);
};

const renderStats = (products) => {
  const optionsTotal = products.reduce((total, product) => total + (product.options || []).length, 0);
  const colorsTotal = products.reduce((total, product) => total + productColors(product).length, 0);

  if (productCount) productCount.textContent = products.length.toString();
  if (optionCount) optionCount.textContent = optionsTotal.toString();
  if (colorCount) colorCount.textContent = colorsTotal.toString();
};

const productMenuMarkup = (product) => `
  <div class="admin-product-card-menu" role="menu">
    <span>Couleur de carte</span>
    <div class="admin-card-color-row">
      ${cardColors
        .map(
          (color) => `
            <button
              type="button"
              data-card-color="${color}"
              data-product-id="${product.id}"
              style="--swatch:${color}"
              aria-label="Changer la carte à ${color}"
            ></button>
          `,
        )
        .join("")}
    </div>
    ${
      isProductReady(product)
        ? `<button type="button" data-catalog-product="${product.id}">Catalogue</button>`
        : `<button type="button" data-finalize-product="${product.id}">Finaliser</button>`
    }
    <button type="button" data-duplicate-product="${product.id}">Dupliquer</button>
    <button class="danger" type="button" data-delete-product="${product.id}">Supprimer</button>
  </div>
`;

const productActionModalMarkup = () => {
  if (!pendingProductAction) return "";
  const product = readProducts().find((item) => String(item.id) === String(pendingProductAction.productId));
  if (!product) return "";
  const isFinalize = pendingProductAction.type === "finalize";
  const isCatalog = isProductInCatalog(product);
  const title = isFinalize ? "Finaliser la fiche ?" : "Catalogue";
  const message = isFinalize
    ? "Cette fiche passera dans les produits terminés et sera ajoutée automatiquement au catalogue."
    : isCatalog
      ? "Ce produit est dans le catalogue. Voulez-vous l'en retirer ?"
      : "Ce produit n'est pas dans le catalogue. Voulez-vous l'ajouter ?";
  const confirmLabel = isFinalize ? "Finaliser" : isCatalog ? "Retirer" : "Ajouter";

  return `
    <div class="admin-product-modal-backdrop" role="presentation">
      <section class="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="product-action-title">
        <button class="admin-product-modal-close" type="button" data-close-product-action aria-label="Fermer">×</button>
        <span>${escapeHtml(product.name || "Produit sans nom")}</span>
        <h2 id="product-action-title">${title}</h2>
        <p>${message}</p>
        <div>
          <button type="button" data-confirm-product-action>${confirmLabel}</button>
          <button type="button" data-close-product-action>Annuler</button>
        </div>
      </section>
    </div>
  `;
};

const renderProductCard = (product) => {
  const colors = productColors(product);
  const options = productOptions(product);
  const choiceCount = Object.values(product.optionChoices || {}).flat().length;
  const productPhotos = (product.productPhotos || []).map(normalizeProductPhoto);
  const coverPhoto = productPhotos.find((photo) => photo.url);
  const colorPhotoCount = (product.colorPhotos || []).reduce((total, color) => total + (color.photos || []).length, 0);
  const primaryColor = product.cardColor || colors[0] || "#30c7c9";
  const accentColor = colors[1] || "#e84b94";
  const visibleColors = colors.slice(0, 4);
  const remainingColors = Math.max(0, colors.length - visibleColors.length);

  return `
    <a
      class="admin-product-library-card ${activeMenuId === String(product.id) ? "is-menu-open" : ""} ${
        isProductReady(product) ? "is-ready" : "is-draft"
      }"
      href="./admin-produit.html?id=${encodeURIComponent(product.id)}"
      style="--product-color:${primaryColor}; --product-accent:${accentColor}"
      aria-label="Modifier ${escapeHtml(product.name || "Produit sans nom")}"
    >
      <div class="admin-product-card-image ${coverPhoto ? "has-product-photo" : ""}">
        <button
          class="admin-product-card-menu-button"
          type="button"
          data-product-menu="${product.id}"
          aria-label="Options du produit"
        >•••</button>
        ${
          coverPhoto
            ? `<img src="${coverPhoto.url}" alt="${escapeHtml(coverPhoto.name || product.name || "Produit")}" />`
            : `<span class="admin-product-card-icon" aria-hidden="true">${categoryIcon(product.category)}</span>`
        }
        <small>${isProductReady(product) ? (isProductInCatalog(product) ? "catalogue" : "hors catalogue") : "brouillon"}</small>
        ${activeMenuId === String(product.id) ? productMenuMarkup(product) : ""}
      </div>
      <div class="admin-product-card-body">
        <h3>${escapeHtml(product.name || "Produit sans nom")}</h3>
        <p>À partir de <strong>${escapeHtml(product.price || "prix à définir")}</strong></p>
        <div class="admin-product-card-swatches" aria-label="Couleurs">
          ${
            visibleColors.length
              ? visibleColors.map((color) => `<span style="--swatch:${color}"></span>`).join("")
              : '<span style="--swatch:#f05b4f"></span><span style="--swatch:#30c7c9"></span>'
          }
          ${remainingColors ? `<em>+${remainingColors}</em>` : ""}
        </div>
        <div class="admin-product-card-meta">
          <span>${escapeHtml(product.category || "Catalogue")}</span>
          <span>${options.length} option(s)</span>
          <span>${choiceCount} choix</span>
          <span>${colorPhotoCount} laine</span>
        </div>
      </div>
    </a>
  `;
};

const renderSection = (title, subtitle, products) =>
  products.length
    ? `
        <div class="admin-products-section-title">
          <div>
            <strong>${title}</strong>
            <small>${subtitle}</small>
          </div>
        </div>
        ${products.map(renderProductCard).join("")}
      `
    : "";

const renderProducts = () => {
  const products = readProducts();
  const filteredProducts = products.filter((product) => productMatchesFilter(product) && productMatchesSearch(product));
  const draftProducts = filteredProducts.filter((product) => !isProductReady(product));
  const readyProducts = filteredProducts.filter(isProductReady);

  renderStats(products);
  if (!productsGrid) return;

  productsGrid.innerHTML = filteredProducts.length
    ? `
        ${renderSection("Fiches en préparation", "À finaliser avant publication", draftProducts)}
        ${renderSection("Produits terminés", "Prêts pour la vitrine et le catalogue", readyProducts)}
        ${productActionModalMarkup()}
      `
    : `
        <div class="admin-products-empty">
          <strong>${products.length ? "Aucun produit trouvé" : "Aucun produit créé"}</strong>
          <p>${
            products.length
              ? "Essaie un autre mot ou un autre filtre."
              : "Crée un premier produit pour le voir apparaître ici."
          }</p>
          ${products.length ? "" : '<a class="buy-button" href="./admin-produit.html">Créer un produit</a>'}
        </div>
      `;
};

const updateProduct = (productId, updater) => {
  saveProducts(readProducts().map((product) => (String(product.id) === String(productId) ? updater(product) : product)));
  renderProducts();
};

const openProductAction = (type, productId) => {
  pendingProductAction = { type, productId: String(productId) };
  activeMenuId = null;
  renderProducts();
};

const closeProductAction = () => {
  pendingProductAction = null;
  renderProducts();
};

const confirmProductAction = () => {
  if (!pendingProductAction) return;
  const { type, productId } = pendingProductAction;
  pendingProductAction = null;
  updateProduct(productId, (product) =>
    type === "finalize"
      ? { ...product, status: "ready", inCatalog: true, updatedAt: new Date().toISOString() }
      : { ...product, inCatalog: !isProductInCatalog(product), updatedAt: new Date().toISOString() },
  );
};

productSearchInput?.addEventListener("input", renderProducts);

productFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;

  activeFilter = button.dataset.filter || "Tous";
  productFilters.querySelectorAll("button").forEach((item) => {
    item.classList.toggle("is-active", item === button);
  });
  renderProducts();
});

productsGrid?.addEventListener("click", (event) => {
  const menuButton = event.target.closest("[data-product-menu]");
  const colorButton = event.target.closest("[data-card-color]");
  const catalogButton = event.target.closest("[data-catalog-product]");
  const finalizeButton = event.target.closest("[data-finalize-product]");
  const duplicateButton = event.target.closest("[data-duplicate-product]");
  const deleteButton = event.target.closest("[data-delete-product]");
  const closeActionButton = event.target.closest("[data-close-product-action]");
  const confirmActionButton = event.target.closest("[data-confirm-product-action]");

  if (
    menuButton ||
    colorButton ||
    catalogButton ||
    finalizeButton ||
    duplicateButton ||
    deleteButton ||
    closeActionButton ||
    confirmActionButton
  ) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (closeActionButton) {
    closeProductAction();
    return;
  }

  if (confirmActionButton) {
    confirmProductAction();
    return;
  }

  if (menuButton) {
    activeMenuId = activeMenuId === String(menuButton.dataset.productMenu) ? null : String(menuButton.dataset.productMenu);
    renderProducts();
    return;
  }

  if (colorButton) {
    const color = colorButton.dataset.cardColor;
    activeMenuId = null;
    updateProduct(colorButton.dataset.productId, (product) => ({ ...product, cardColor: color }));
    return;
  }

  if (catalogButton) {
    openProductAction("catalog", catalogButton.dataset.catalogProduct);
    return;
  }

  if (finalizeButton) {
    openProductAction("finalize", finalizeButton.dataset.finalizeProduct);
    return;
  }

  if (duplicateButton) {
    const product = readProducts().find((item) => String(item.id) === String(duplicateButton.dataset.duplicateProduct));
    if (!product) return;
    const copy = {
      ...product,
      id: crypto.randomUUID(),
      name: `${product.name || "Produit sans nom"} copie`,
      status: "draft",
      inCatalog: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    activeMenuId = null;
    saveProducts([copy, ...readProducts()]);
    renderProducts();
    return;
  }

  if (deleteButton) {
    const product = readProducts().find((item) => String(item.id) === String(deleteButton.dataset.deleteProduct));
    if (!window.confirm(`Supprimer ${product?.name || "ce produit"} ?`)) return;
    activeMenuId = null;
    saveProducts(readProducts().filter((item) => String(item.id) !== String(deleteButton.dataset.deleteProduct)));
    renderProducts();
  }
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".admin-product-modal-backdrop") && !event.target.closest(".admin-product-modal")) {
    closeProductAction();
    return;
  }
  if (!activeMenuId || event.target.closest(".admin-product-library-card")) return;
  activeMenuId = null;
  renderProducts();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !pendingProductAction) return;
  closeProductAction();
});

publishProductsButton?.addEventListener("click", publishProducts);

const start = async () => {
  renderProducts();
  if (!window.KaleidoStorefrontCloud?.isConfigured) return;
  const result = await window.KaleidoStorefrontCloud.hydrateLocalFromCloud({
    productsKey: draftsKey,
    homeConfigKey,
  });
  if (result.ok) renderProducts();
};

start();
