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

const formatDate = (dateValue) => {
  if (!dateValue) return "Date inconnue";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
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

          return `
            <article class="admin-product-library-card">
              <div class="admin-product-card-media">
                <span>${productPhotoCount || "0"}</span>
                <small>photo(s)</small>
              </div>
              <div class="admin-product-card-body">
                <span class="admin-kicker">Brouillon</span>
                <h3>${escapeHtml(product.name || "Produit sans nom")}</h3>
                <p>${escapeHtml(product.category || "Catalogue")} · À partir de ${escapeHtml(
                  product.price || "prix à définir",
                )}</p>
                <div class="admin-product-card-meta">
                  <span>${colors.length} couleur(s)</span>
                  <span>${options.length} option(s)</span>
                  <span>${choiceCount} choix</span>
                  <span>${colorPhotoCount} photo(s) laine</span>
                </div>
                <small>Créé le ${formatDate(product.createdAt)}</small>
              </div>
            </article>
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
