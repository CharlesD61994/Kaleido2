const draftsKey = "kaleido-storefront-product-drafts";
const productsGrid = document.querySelector("#productsGrid");
const clearProductsButton = document.querySelector("#clearProducts");

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

const renderProducts = () => {
  const products = readProducts();

  if (!productsGrid) return;

  productsGrid.innerHTML = products.length
    ? products
        .map((product) => {
          const colors = [...new Set([...(product.colors?.main || []), ...(product.colors?.accent || [])])];
          const options = (product.options || []).map((id) => optionLabels[id]).filter(Boolean);
          const choiceCount = Object.values(product.optionChoices || {}).flat().length;
          const productPhotos = (product.productPhotos || []).map(normalizeProductPhoto);
          const productPhotoCount = productPhotos.length;
          const coverPhoto = productPhotos.find((photo) => photo.url);
          const colorPhotoCount = (product.colorPhotos || []).reduce(
            (total, color) => total + (color.photos || []).length,
            0,
          );
          const primaryColor = colors[0] || "#30c7c9";
          const accentColor = colors[1] || "#e84b94";
          const visibleColors = colors.slice(0, 4);
          const remainingColors = Math.max(0, colors.length - visibleColors.length);

          return `
            <a
              class="admin-product-library-card"
              href="./admin-produit.html?id=${encodeURIComponent(product.id)}"
              style="--product-color:${primaryColor}; --product-accent:${accentColor}"
              aria-label="Modifier ${escapeHtml(product.name || "Produit sans nom")}"
            >
              <div class="admin-product-card-image ${coverPhoto ? "has-product-photo" : ""}">
                <span class="admin-product-card-favorite" aria-hidden="true">♡</span>
                ${
                  coverPhoto
                    ? `<img src="${coverPhoto.url}" alt="${escapeHtml(coverPhoto.name || product.name || "Produit")}" />`
                    : `<span class="admin-product-card-icon" aria-hidden="true">${categoryIcon(product.category)}</span>`
                }
                <small>${productPhotoCount ? `${productPhotoCount} photo` : "photo"}</small>
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
        })
        .join("")
    : `
        <div class="admin-products-empty">
          <strong>Aucun produit créé</strong>
          <p>Crée un premier produit pour le voir apparaître ici.</p>
          <a class="buy-button" href="./admin-produit.html">Créer un produit</a>
        </div>
      `;
};

clearProductsButton?.addEventListener("click", () => {
  if (!window.confirm("Supprimer tous les produits locaux ?")) return;
  saveProducts([]);
  renderProducts();
});

renderProducts();
