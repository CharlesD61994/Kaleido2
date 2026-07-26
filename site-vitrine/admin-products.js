const draftsKey = "kaleido-storefront-product-drafts";
const productsGrid = document.querySelector("#productsGrid");
const clearProductsButton = document.querySelector("#clearProducts");

const optionLabels = {
  mainColor: "Couleur principale",
  accentColor: "Couleur secondaire",
  recipient: "Pour qui ?",
  shoeSize: "Pointure",
  keychain: "Porte-cle",
  personalization: "Personnalisation",
  finish: "Finition",
  delay: "Delai",
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

const renderProducts = () => {
  const products = readProducts();

  if (!productsGrid) return;

  productsGrid.innerHTML = products.length
    ? products
        .map((product) => {
          const colors = [...new Set([...(product.colors?.main || []), ...(product.colors?.accent || [])])];
          const options = (product.options || []).map((id) => optionLabels[id]).filter(Boolean);
          const choiceCount = Object.values(product.optionChoices || {}).flat().length;
          const productPhotoCount = (product.productPhotos || []).length;
          const colorPhotoCount = (product.colorPhotos || []).reduce(
            (total, color) => total + (color.photos || []).length,
            0,
          );
          const primaryColor = colors[0] || "#30c7c9";
          const productInitial = (product.name || "?").trim().charAt(0).toUpperCase() || "?";

          return `
            <article class="admin-product-library-card" style="--product-color:${primaryColor}">
              <div class="admin-product-card-bubble">
                <span>${escapeHtml(productInitial)}</span>
                <small>${productPhotoCount || "0"}</small>
              </div>
              <div class="admin-product-card-body">
                <h3>${escapeHtml(product.name || "Produit sans nom")}</h3>
                <p>${escapeHtml(product.category || "Catalogue")}</p>
                <div class="admin-product-card-meta">
                  <span>${escapeHtml(product.price || "Prix a definir")}</span>
                  <span>${options.length} opt.</span>
                </div>
                <small>${colors.length} couleur(s) · ${choiceCount} choix · ${colorPhotoCount} laine</small>
              </div>
            </article>
          `;
        })
        .join("")
    : `
        <div class="admin-products-empty">
          <strong>Aucun produit cree</strong>
          <p>Cree un premier produit pour le voir apparaitre ici.</p>
          <a class="buy-button" href="./admin-produit.html">Creer un produit</a>
        </div>
      `;
};

clearProductsButton?.addEventListener("click", () => {
  if (!window.confirm("Supprimer tous les produits locaux ?")) return;
  saveProducts([]);
  renderProducts();
});

renderProducts();
