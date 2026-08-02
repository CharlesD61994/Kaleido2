const isAdminPreview = new URLSearchParams(window.location.search).get("mode") === "preview";
const productsKey = isAdminPreview
  ? "kaleido-storefront-product-drafts"
  : "kaleido-storefront-public-products-cache";
const homeConfigKey = isAdminPreview
  ? "kaleido-storefront-home-config"
  : "kaleido-storefront-public-home-cache";
const storefront = document.querySelector(".storefront");
const menuButton = document.querySelector(".menu-button");
const sideMenu = document.querySelector(".side-menu");
const productDetail = document.querySelector("[data-product-detail='pantoufles']");
const productBackButton = document.querySelector(".detail-back");
const categoryRow = document.querySelector(".category-row");
const productGrid = document.querySelector(".product-grid");

const defaultCategories = [
  { id: "vetements", label: "Vetements", color: "#7c3aed", icon: "♢", className: "photo-baby" },
  { id: "peluches", label: "Peluches crochetees", color: "#e84b94", icon: "●", className: "photo-plush" },
  { id: "pantoufles", label: "Pantoufles", color: "#30c7c9", icon: "◒", className: "photo-slippers" },
  { id: "porte-cles", label: "Porte-cles", color: "#f4831f", icon: "◇", className: "photo-accessories" },
  { id: "couvertures", label: "Couvertures", color: "#8bbf3f", icon: "▧", className: "photo-socks" },
];

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

const optionColors = {
  mainColor: "#f05b4f",
  accentColor: "#30c7c9",
  recipient: "#e84b94",
  shoeSize: "#7c3aed",
  keychain: "#f3b51b",
  personalization: "#8bbf3f",
  finish: "#f4831f",
  delay: "#188f91",
};

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

const glowClasses = ["glow-coral", "glow-teal", "glow-yellow"];

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

const normalizePhoto = (photo) => (typeof photo === "string" ? { name: photo, url: "" } : photo || null);
const productCover = (product) => (product.productPhotos || []).map(normalizePhoto).find((photo) => photo?.url);
const productPhotos = (product) => (product.productPhotos || []).map(normalizePhoto).filter((photo) => photo?.url);
const productColors = (product) => [...new Set([...(product.colors?.main || []), ...(product.colors?.accent || [])])];
const shopifyProductId = (product) => (
  typeof product?.shopify === "object"
    ? String(product.shopify.productId || product.shopify.id || "")
    : String(product?.shopify || "")
);
const isProductInCatalog = (product) => product?.status === "ready" && product.inCatalog !== false;
const categoryPhotoSource = (photo) => photo?.preview || photo?.url || photo?.src || photo?.original || "";

const customCategoriesFrom = (rawConfig) =>
  Array.isArray(rawConfig?.customCategories)
    ? rawConfig.customCategories
        .filter((category) => category?.id && category?.label)
        .map((category) => ({
          id: String(category.id),
          label: String(category.label),
          color: category.color || "#30c7c9",
          icon: category.icon || "✦",
          custom: true,
        }))
    : [];

const allCategoriesFrom = (rawConfig) => {
  const categoryColors = rawConfig?.categoryColors || {};
  const categoryPhotos = rawConfig?.categoryPhotos || {};
  const usedIds = new Set(defaultCategories.map((category) => category.id));
  const customCategories = customCategoriesFrom(rawConfig).filter((category) => {
    if (usedIds.has(category.id)) return false;
    usedIds.add(category.id);
    return true;
  });

  return [...defaultCategories, ...customCategories].map((category) => ({
    ...category,
    color: categoryColors[category.id] || category.color,
    photo: categoryPhotos[category.id] || null,
  }));
};

const cleanHomeConfig = (rawConfig) => {
  const allCategories = allCategoriesFrom(rawConfig);
  const hasExplicitCategories = Array.isArray(rawConfig?.categories);
  const selectedCategories = hasExplicitCategories
    ? rawConfig.categories.filter((id) => allCategories.some((category) => category.id === id))
    : allCategories.map((category) => category.id);

  return {
    categories: hasExplicitCategories ? selectedCategories : allCategories.map((category) => category.id),
    customCategories: customCategoriesFrom(rawConfig),
    categoryColors: rawConfig?.categoryColors || {},
    categoryPhotos: rawConfig?.categoryPhotos || {},
    featuredProductIds: Array.isArray(rawConfig?.featuredProductIds)
      ? rawConfig.featuredProductIds.map(String)
      : [],
    shopify: rawConfig?.shopify && typeof rawConfig.shopify === "object"
      ? rawConfig.shopify
      : null,
  };
};

const closeMenu = () => {
  storefront?.classList.remove("menu-open");
  menuButton?.setAttribute("aria-expanded", "false");
  sideMenu?.setAttribute("aria-hidden", "true");
};

menuButton?.addEventListener("click", () => {
  const isOpen = storefront?.classList.toggle("menu-open") ?? false;
  menuButton.setAttribute("aria-expanded", String(isOpen));
  sideMenu?.setAttribute("aria-hidden", String(!isOpen));
});

sideMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

const bindPressables = () => {
  document.querySelectorAll(".product-card, .category-card").forEach((card) => {
    card.addEventListener("pointerdown", () => {
      card.style.transform = "scale(0.985)";
    });

    card.addEventListener("pointerup", () => {
      card.style.transform = "";
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
};

const bindHeartButtons = () => {
  document.querySelectorAll(".heart-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      button.classList.toggle("is-active");
      button.style.background = button.classList.contains("is-active")
        ? "rgba(232, 75, 148, 0.14)"
        : "rgba(255, 255, 255, 0.78)";
    });
  });
};

const renderCategories = (homeConfig) => {
  if (!categoryRow) return;
  const allCategories = allCategoriesFrom(homeConfig);
  const orderedCategories = homeConfig.categories
    .map((id) => allCategories.find((category) => category.id === id))
    .filter(Boolean);

  categoryRow.innerHTML = orderedCategories
    .map((category) => {
      const photoSource = categoryPhotoSource(category.photo);
      return `
        <button class="category-card dynamic-category-card" type="button">
          <span class="category-photo ${photoSource ? "has-category-photo" : category.className || ""}" style="--ring:${category.color}">
            ${
              photoSource
                ? `<img src="${photoSource}" alt="${escapeHtml(category.photo?.name || category.label)}" />`
                : `<span class="category-symbol" aria-hidden="true">${category.icon || "✦"}</span>`
            }
          </span>
          <span>${escapeHtml(category.label)}</span>
        </button>
      `;
    })
    .join("");
};

const renderProductCard = (product, index) => {
  const cover = productCover(product);
  const colors = productColors(product);
  const visibleColors = colors.slice(0, 4);
  const remainingColors = Math.max(0, colors.length - visibleColors.length);
  const fallbackClass = ["product-slippers", "product-socks", "product-doudou"][index % 3];
  const glow = glowClasses[index % glowClasses.length];

  return `
    <article class="product-card ${glow}" data-product-open="${escapeHtml(product.id)}" role="button" tabindex="0">
      <button class="heart-button" type="button" aria-label="Ajouter aux favoris"></button>
      <div class="product-image ${cover?.url ? "has-dynamic-product-image" : fallbackClass}">
        ${cover?.url ? `<img src="${cover.url}" alt="${escapeHtml(cover.name || product.name || "Produit")}" />` : ""}
      </div>
      <div class="product-info">
        <h3>${escapeHtml(product.name || "Produit sans nom")}</h3>
        <p>A partir de <strong>${escapeHtml(product.price || "prix a definir")}</strong></p>
        <div class="swatches" aria-label="Couleurs disponibles">
          ${
            visibleColors.length
              ? visibleColors.map((color) => `<span style="--swatch:${color}"></span>`).join("")
              : '<span style="--swatch:#f05b4f"></span><span style="--swatch:#30c7c9"></span>'
          }
          ${remainingColors ? `<button type="button" aria-label="Voir plus de couleurs">+${remainingColors}</button>` : ""}
        </div>
      </div>
    </article>
  `;
};

const productOptionGroups = (product) => {
  const groups = [];
  if ((product.colors?.main || []).length) {
    groups.push({
      title: "Couleur principale",
      type: "color",
      accent: optionColors.mainColor,
      colors: product.colors.main,
      photos: (product.colorPhotos || []).filter((color) => product.colors.main.includes(color.value)),
    });
  }
  if ((product.colors?.accent || []).length) {
    groups.push({
      title: "Couleur secondaire",
      type: "color",
      accent: optionColors.accentColor,
      colors: product.colors.accent,
      photos: (product.colorPhotos || []).filter((color) => product.colors.accent.includes(color.value)),
    });
  }
  Object.entries(product.optionChoices || {}).forEach(([key, values]) => {
    if (!Array.isArray(values) || values.length === 0) return;
    groups.push({ title: optionLabels[key] || key, type: "choice", accent: optionColors[key], values });
  });
  (product.options || [])
    .filter((id) => !["mainColor", "accentColor", "recipient", "shoeSize"].includes(id))
    .forEach((id) => {
      if (id === "keychain") {
        groups.push({
          title: "Voulez-vous en faire un porte-cl\u00e9 ?",
          type: "priced-choice",
          accent: optionColors.keychain,
          values: ["Oui", "Non"],
          priceAdjustment: parseProductPrice(product.optionPrices?.keychain) ?? 0,
        });
        return;
      }
      groups.push({
        title: optionLabels[id] || id,
        type: "simple",
        accent: optionColors[id],
        values: ["Option disponible"],
      });
    });
  return groups;
};

const renderDetailOptions = (product) => {
  const groups = productOptionGroups(product);
  if (!groups.length) return "";

  return `
    <div class="detail-panel detail-options-panel">
      <span class="panel-label">Personnalisez votre produit</span>
      <div class="detail-option-list">
        ${groups
          .map((group) => {
            if (group.type === "color") {
              const cards = group.colors
                .map((color, colorIndex) => {
                  const colorData = group.photos.find((item) => item.value === color);
                  const photo = colorData?.photos?.find((item) => item.url);
                  return `
                    <button
                      class="detail-color-card${colorIndex >= 6 ? " is-extra" : ""}"
                      type="button"
                      style="--swatch:${color}"
                      data-option-value="${escapeHtml(colorData?.label || color)}"
                    >
                      ${photo?.url ? `<img src="${photo.url}" alt="${escapeHtml(photo.name || colorData?.label || group.title)}" data-color-photo="${escapeHtml(photo.url)}" data-color-name="${escapeHtml(colorData?.label || group.title)}" />` : '<span></span>'}
                      <strong>${escapeHtml(colorData?.label || color)}</strong>
                    </button>
                  `;
                })
                .join("");
              return `
                <div
                  class="detail-option-group detail-color-group"
                  style="--option-heading:${group.accent || "#30c7c9"}"
                  data-option-group="${escapeHtml(group.title)}"
                >
                  <strong>${escapeHtml(group.title)}</strong>
                  <div class="detail-color-row">${cards}</div>
                  ${group.colors.length > 6 ? '<button class="detail-colors-toggle" type="button" aria-expanded="false">Afficher les autres couleurs</button>' : ""}
                </div>
              `;
            }

            return `
              <div
                class="detail-option-group"
                style="--option-heading:${group.accent || "#30c7c9"}"
                data-option-group="${escapeHtml(group.title)}"
              >
                <strong>${escapeHtml(group.title)}</strong>
                <div class="detail-choice-row">
                  ${group.values.map((value) => {
                    const adjustment = group.type === "priced-choice" && value === "Oui"
                      ? group.priceAdjustment
                      : 0;
                    const priceLabel = adjustment > 0
                      ? ` (+${formatCalculatedPrice(0, adjustment)})`
                      : "";
                    return `<button type="button" data-option-value="${escapeHtml(value)}" data-price-adjustment="${adjustment}">${escapeHtml(value)}${escapeHtml(priceLabel)}</button>`;
                  }).join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
};

const closeColorLightbox = () => {
  document.querySelector(".detail-color-lightbox")?.remove();
};

const openColorLightbox = (source, name) => {
  closeColorLightbox();
  const lightbox = document.createElement("div");
  lightbox.className = "detail-color-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", name || "Photo de la couleur");
  lightbox.innerHTML = `
    <button class="detail-color-lightbox-close" type="button" aria-label="Fermer">&times;</button>
    <figure>
      <img src="${escapeHtml(source)}" alt="${escapeHtml(name || "Photo de la couleur")}" />
      ${name ? `<figcaption>${escapeHtml(name)}</figcaption>` : ""}
    </figure>
  `;
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest(".detail-color-lightbox-close")) closeColorLightbox();
  });
  document.body.appendChild(lightbox);
  lightbox.querySelector(".detail-color-lightbox-close")?.focus();
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeColorLightbox();
});

const bindDetailOptions = (container, product) => {
  const updateDisplayedPrice = () => {
    const price = container.querySelector(".detail-price");
    if (!price) return;
    const adjustment = [...container.querySelectorAll("[data-price-adjustment].is-selected")]
      .reduce((total, button) => total + (parseProductPrice(button.dataset.priceAdjustment) ?? 0), 0);
    price.textContent = formatCalculatedPrice(product.price, adjustment);
  };

  container.querySelectorAll(".detail-colors-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest(".detail-color-group");
      const expanded = group?.classList.toggle("is-expanded") ?? false;
      button.setAttribute("aria-expanded", String(expanded));
      button.textContent = expanded ? "Afficher moins de couleurs" : "Afficher les autres couleurs";
    });
  });

  container.querySelectorAll(".detail-choice-row button, .detail-color-card").forEach((button) => {
    button.addEventListener("click", () => {
      const wasSelected = button.classList.contains("is-selected");
      button.parentElement?.querySelectorAll("button").forEach((candidate) => candidate.classList.remove("is-selected"));
      if (!wasSelected) button.classList.add("is-selected");
      updateDisplayedPrice();
    });
  });

  container.querySelectorAll(".detail-color-card img[data-color-photo]").forEach((photo) => {
    photo.addEventListener("click", (event) => {
      event.stopPropagation();
      openColorLightbox(photo.dataset.colorPhoto, photo.dataset.colorName);
    });
  });
};

const bindDetailPhotoCarousel = (hero) => {
  const track = hero.querySelector(".detail-photo-track");
  const dots = [...hero.querySelectorAll(".detail-photo-dots button")];
  if (!track || dots.length < 2) return;

  const setActiveDot = (index) => {
    dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  };

  track.addEventListener("scroll", () => {
    if (!track.clientWidth) return;
    const index = Math.max(0, Math.min(dots.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    setActiveDot(index);
  }, { passive: true });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
    });
  });
};

const openProductDetail = (product) => {
  closeMenu();
  if (!productDetail || !product) return;
  const photos = productPhotos(product);
  const detailHero = productDetail.querySelector(".detail-hero");
  const detailContent = productDetail.querySelector(".detail-content");

  if (detailHero) {
    detailHero.innerHTML = `
      ${
        photos.length
          ? `<div class="detail-photo-track">
              ${photos.map((photo) => `
                <div class="detail-photo-slide">
                  <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.name || product.name || "Produit")}" />
                </div>
              `).join("")}
            </div>`
          : '<div class="detail-product-placeholder"></div>'
      }
      ${
        photos.length > 1
          ? `<div class="detail-photo-dots" aria-label="Photos du produit">
              ${photos.map((_, index) => `<button type="button" class="${index === 0 ? "is-active" : ""}" aria-label="Afficher la photo ${index + 1}"></button>`).join("")}
            </div>`
          : ""
      }
      <button class="heart-button detail-heart" type="button" aria-label="Ajouter aux favoris"></button>
    `;
    bindDetailPhotoCarousel(detailHero);
  }

  if (detailContent) {
    const accent = product.cardColor || "#e84b94";
    const description = String(product.description || "Ajoutez une description pour présenter cette création.");
    const hasLongDescription = description.length > 180;
    detailContent.innerHTML = `
      <div class="detail-title-row" style="--product-accent:${escapeHtml(accent)}">
        <h2>${escapeHtml(product.name || "Produit sans nom")}</h2>
        <strong class="detail-price">${escapeHtml(formatCalculatedPrice(product.price))}</strong>
        <span class="detail-title-divider" aria-hidden="true"></span>
      </div>
      <div class="detail-story" style="--product-accent:${escapeHtml(accent)}">
        <strong>À propos</strong>
        <p${hasLongDescription ? ' class="is-collapsible"' : ""}>${escapeHtml(description)}</p>
        ${hasLongDescription ? '<button class="detail-story-toggle" type="button" aria-expanded="false">Lire la suite</button>' : ""}
      </div>
      ${renderDetailOptions(product)}
      <div class="detail-panel tracking-panel">
        <span class="panel-label">Votre commande</span>
        <div class="tracking-steps">
          <span>Catalogue</span>
          <span>Production</span>
          <span>Produit final</span>
        </div>
        <div class="detail-progress"><span></span></div>
        <small>Le suivi prive sera envoye apres la confirmation de la commande.</small>
      </div>
      <div class="detail-actions">
        <button class="buy-button" type="button" data-shopify-product="${escapeHtml(shopifyProductId(product))}">Ajouter au panier</button>
      </div>
    `;
    bindDetailOptions(detailContent, product);
    detailContent.querySelector(".detail-story-toggle")?.addEventListener("click", (event) => {
      const button = event.currentTarget;
      const paragraph = button.previousElementSibling;
      const expanded = paragraph?.classList.toggle("is-expanded") ?? false;
      button.setAttribute("aria-expanded", String(expanded));
      button.textContent = expanded ? "Réduire" : "Lire la suite";
    });
  }

  storefront?.classList.add("product-mode");
  productDetail.hidden = false;
  bindHeartButtons();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const closeProductDetail = () => {
  storefront?.classList.remove("product-mode");
  if (productDetail) {
    productDetail.hidden = true;
  }
  document.querySelector("#patrons")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const bindProductCards = (products) => {
  const productById = new Map(products.map((product) => [String(product.id), product]));
  document.querySelectorAll("[data-product-open]").forEach((card) => {
    const open = () => openProductDetail(productById.get(card.dataset.productOpen));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
};

const renderProducts = (products, homeConfig) => {
  if (!productGrid) return;
  const catalogProducts = products.filter(isProductInCatalog);
  const selectedIds = homeConfig.featuredProductIds.map(String);
  const selected = selectedIds
    .map((id) => catalogProducts.find((product) => String(product.id) === id))
    .filter(Boolean);
  const productsToRender = selected.length ? selected : catalogProducts.slice(0, 4);

  if (!productsToRender.length) {
    productGrid.innerHTML = "";
    return;
  }
  productGrid.innerHTML = productsToRender.map(renderProductCard).join("");
  bindProductCards(productsToRender);
};

const renderStorefront = ({ products, homeConfig }) => {
  const cleanConfig = cleanHomeConfig(homeConfig);
  renderCategories(cleanConfig);
  renderProducts(products, cleanConfig);
  bindPressables();
  bindHeartButtons();
};

const loadPublishedStorefront = async () => {
  const cachedProducts = readJson(productsKey, []);
  const cachedHomeConfig = readJson(homeConfigKey, null);
  if (isAdminPreview) {
    renderStorefront({
      products: cachedProducts,
      homeConfig: cachedHomeConfig,
    });
    return;
  }
  if (!window.KaleidoStorefrontCloud?.isConfigured) {
    renderStorefront({
      products: cachedProducts,
      homeConfig: cachedHomeConfig,
    });
    return;
  }

  try {
    const result = await window.KaleidoStorefrontCloud.readDocuments(["products", "home-config"]);
    if (!result.ok) {
      renderStorefront({ products: cachedProducts, homeConfig: cachedHomeConfig });
      return;
    }
    const cloudProducts = result.documents.products?.payload;
    const cloudHomeConfig = result.documents["home-config"]?.payload;
    const products = Array.isArray(cloudProducts) ? cloudProducts : cachedProducts;
    const homeConfig = cloudHomeConfig && typeof cloudHomeConfig === "object" && !Array.isArray(cloudHomeConfig)
      ? cloudHomeConfig
      : cachedHomeConfig;
    if (Array.isArray(cloudProducts)) {
      localStorage.setItem(productsKey, JSON.stringify(products));
    }
    if (cloudHomeConfig && typeof cloudHomeConfig === "object" && !Array.isArray(cloudHomeConfig)) {
      localStorage.setItem(homeConfigKey, JSON.stringify(homeConfig));
    }
    renderStorefront({ products, homeConfig });
  } catch {
    renderStorefront({ products: cachedProducts, homeConfig: cachedHomeConfig });
  }
};

productBackButton?.addEventListener("click", closeProductDetail);
bindPressables();
bindHeartButtons();
loadPublishedStorefront();
