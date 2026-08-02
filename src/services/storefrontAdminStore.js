const PRODUCTS_KEY = "kaleido-storefront-product-drafts";
const HOME_CONFIG_KEY = "kaleido-storefront-home-config";
const TABLE_NAME = "kaleido_storefront_documents";
const OWNER_KEY = import.meta.env.VITE_KALEIDO_USER_KEY || "charles-kaleido-prod";
const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL || "https://kxyspfwdutcddigycqky.supabase.co",
).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || "sb_publishable_8dNyHlIOv21aH-_NLbPhyA_e3Aj1MFg";
const PRODUCTS_CHANGED_EVENT = "kaleido-storefront-products-changed";
const HOME_CONFIG_CHANGED_EVENT = "kaleido-storefront-home-config-changed";
const LOCAL_UPDATED_PREFIX = "kaleido-storefront-local-updated:";
const LOCAL_DIRTY_PREFIX = "kaleido-storefront-local-dirty:";
const BACKUP_PREFIX = "kaleido-storefront-backup:";
const LAST_PUBLISHED_AT_KEY = "kaleido-storefront-last-published-at";
const LAST_PUBLISHED_SNAPSHOT_KEY = "kaleido-storefront-last-published-snapshot";
const HYDRATION_TTL_MS = 15_000;
const DEFAULT_HOME_CONFIG = {
  categories: ["vetements", "peluches", "pantoufles", "porte-cles", "couvertures"],
  customCategories: [],
  categoryColors: {},
  categoryPhotos: {},
  featuredProductIds: [],
  shopify: null,
};
let hydrationPromise = null;
let lastHydratedAt = 0;

const readJson = (key, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const validProducts = (value) => (Array.isArray(value) ? value : []);
const validHomeConfig = (value) => (
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : { ...DEFAULT_HOME_CONFIG }
);

const documentKey = (docKey) => (docKey === "products" ? PRODUCTS_KEY : HOME_CONFIG_KEY);
const documentEvent = (docKey) => (
  docKey === "products" ? PRODUCTS_CHANGED_EVENT : HOME_CONFIG_CHANGED_EVENT
);
const hasMeaningfulData = (docKey, value) => (
  docKey === "products"
    ? Array.isArray(value) && value.length > 0
    : Boolean(value && typeof value === "object" && Object.keys(value).length)
);
const validCloudPayload = (docKey, value) => (
  docKey === "products"
    ? Array.isArray(value)
    : Boolean(value && typeof value === "object" && !Array.isArray(value))
);

const dispatchDocumentChange = (docKey, payload, updatedAt) => {
  window.dispatchEvent(new CustomEvent(documentEvent(docKey), {
    detail: docKey === "products"
      ? { products: payload, updatedAt }
      : { config: payload, updatedAt },
  }));
};

const isDocumentDirty = (docKey) => (
  window.localStorage.getItem(`${LOCAL_DIRTY_PREFIX}${docKey}`) === "1"
);

const markDocumentDirty = (docKey) => {
  window.localStorage.setItem(`${LOCAL_DIRTY_PREFIX}${docKey}`, "1");
};

const clearDocumentDirty = (docKey) => {
  window.localStorage.removeItem(`${LOCAL_DIRTY_PREFIX}${docKey}`);
};

const backupLocalDocument = (docKey, payload) => {
  if (!hasMeaningfulData(docKey, payload)) return;
  try {
    window.localStorage.setItem(`${BACKUP_PREFIX}${docKey}`, JSON.stringify({
      payload,
      backedUpAt: new Date().toISOString(),
    }));
  } catch {
    // The live document remains untouched if storage is already full.
  }
};

const writeHydratedDocument = (docKey, payload, updatedAt) => {
  const key = documentKey(docKey);
  const current = readJson(key, docKey === "products" ? [] : null);
  backupLocalDocument(docKey, current);
  window.localStorage.setItem(key, JSON.stringify(payload));
  window.localStorage.setItem(`${LOCAL_UPDATED_PREFIX}${docKey}`, updatedAt);
  clearDocumentDirty(docKey);
  dispatchDocumentChange(docKey, payload, updatedAt);
};

const normalizeCategoryPhotoForLocal = (photo) => {
  if (!photo || typeof photo !== "object") return photo;
  const original = photo.original || photo.src || photo.url || photo.preview || "";
  const preview = photo.preview || photo.url || original;
  return {
    name: photo.name || "",
    mediaId: photo.mediaId || "",
    original,
    preview,
    x: Number(photo.x ?? photo.pos?.x) || 0,
    y: Number(photo.y ?? photo.pos?.y) || 0,
    scale: Number(photo.scale) || 1,
    naturalWidth: Number(photo.naturalWidth) || 0,
    naturalHeight: Number(photo.naturalHeight) || 0,
  };
};

const compactCategoryPhotoForCloud = (photo) => {
  const normalized = normalizeCategoryPhotoForLocal(photo);
  if (!normalized || typeof normalized !== "object") return normalized;
  return {
    name: normalized.name,
    mediaId: normalized.mediaId,
    preview: normalized.preview,
    x: normalized.x,
    y: normalized.y,
    scale: normalized.scale,
    naturalWidth: normalized.naturalWidth,
    naturalHeight: normalized.naturalHeight,
  };
};

const normalizeHomeConfigForLocal = (config) => ({
  ...validHomeConfig(config),
  categoryPhotos: Object.fromEntries(
    Object.entries(validHomeConfig(config).categoryPhotos || {})
      .map(([id, photo]) => [id, normalizeCategoryPhotoForLocal(photo)]),
  ),
});

const compactHomeConfigForCloud = (config) => ({
  ...validHomeConfig(config),
  categoryPhotos: Object.fromEntries(
    Object.entries(validHomeConfig(config).categoryPhotos || {})
      .map(([id, photo]) => [id, compactCategoryPhotoForCloud(photo)]),
  ),
});

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const optimizePublishedImage = (source) => new Promise((resolve) => {
  if (typeof source !== "string" || !source.startsWith("data:image/")) {
    resolve(source || "");
    return;
  }

  const image = new Image();
  image.addEventListener("load", () => {
    const maxSize = 720;
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      resolve(source);
      return;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const optimized = canvas.toDataURL("image/jpeg", 0.76);
    resolve(optimized.length < source.length ? optimized : source);
  }, { once: true });
  image.addEventListener("error", () => resolve(source), { once: true });
  image.src = source;
});

const prepareProductsForPublication = async (products) => {
  const prepared = [];
  for (const product of validProducts(products)) {
    const productPhotos = [];
    for (const photo of product.productPhotos || []) {
      productPhotos.push({
        ...photo,
        url: await optimizePublishedImage(photo?.url),
      });
    }

    const colorPhotos = [];
    for (const color of product.colorPhotos || []) {
      const photos = [];
      for (const photo of color.photos || []) {
        photos.push({
          ...photo,
          url: await optimizePublishedImage(photo?.url),
        });
      }
      colorPhotos.push({ ...color, photos });
    }

    prepared.push({ ...product, productPhotos, colorPhotos });
  }
  return prepared;
};

const prepareHomeConfigForPublication = async (config) => {
  const prepared = compactHomeConfigForCloud(config);
  const categoryPhotos = {};
  for (const [id, photo] of Object.entries(prepared.categoryPhotos || {})) {
    categoryPhotos[id] = {
      ...photo,
      preview: await optimizePublishedImage(photo?.preview),
    };
  }
  return { ...prepared, categoryPhotos };
};

const publicationErrorMessage = (status) => {
  const messages = {
    401: "La clé Supabase de la boutique n’est plus autorisée.",
    403: "Supabase refuse la publication. Vérifie la politique RLS d’écriture de la boutique.",
    404: "La table boutique est introuvable dans Supabase.",
    409: "Supabase a refusé la mise à jour à cause d’un conflit de données.",
    413: "La publication contient trop de photos pour être envoyée en une seule fois.",
    429: "Supabase reçoit trop de requêtes. Réessaie dans quelques instants.",
  };
  return messages[status]
    || (status >= 500
      ? "Supabase est temporairement indisponible. Réessaie dans quelques instants."
      : `La publication a été refusée par Supabase (${status}).`);
};

const publishDocument = async ({ docKey, payload, updatedAt }) => {
  const row = {
    owner_key: OWNER_KEY,
    doc_key: docKey,
    payload,
    updated_at: updatedAt,
  };
  let lastNetworkError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=owner_key,doc_key`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(row),
        },
      );

      if (response.ok) return { ok: true };

      let errorCode = "";
      try {
        const errorPayload = await response.json();
        errorCode = errorPayload?.code || "";
      } catch {
        // The HTTP status is enough to present a useful error.
      }

      if (response.status >= 500 && attempt === 0) {
        await wait(650);
        continue;
      }

      return {
        ok: false,
        reason: `http-${response.status}`,
        status: response.status,
        code: errorCode,
        message: publicationErrorMessage(response.status),
      };
    } catch (error) {
      lastNetworkError = error;
      if (attempt === 0) await wait(650);
    }
  }

  console.warn(`[KALEIDO] storefront ${docKey} publication network error:`, lastNetworkError);
  return {
    ok: false,
    reason: "network",
    message: `L’envoi de ${docKey === "products" ? "Produits" : "Accueil boutique"} a été interrompu avant que Supabase réponde. Réessaie dans quelques instants.`,
  };
};

export const readStorefrontProducts = () => validProducts(readJson(PRODUCTS_KEY, []));

export const writeStorefrontProducts = (products) => {
  const nextProducts = Array.isArray(products) ? products : [];
  const updatedAt = new Date().toISOString();
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(nextProducts));
  window.localStorage.setItem(`${LOCAL_UPDATED_PREFIX}products`, updatedAt);
  markDocumentDirty("products");
  dispatchDocumentChange("products", nextProducts, updatedAt);
  return nextProducts;
};

export const readStorefrontHomeConfig = () => {
  const compact = normalizeHomeConfigForLocal(readJson(HOME_CONFIG_KEY, null));
  try {
    const serialized = JSON.stringify(compact);
    if (window.localStorage.getItem(HOME_CONFIG_KEY) !== serialized) {
      window.localStorage.setItem(HOME_CONFIG_KEY, serialized);
    }
  } catch {
    // Keep serving the valid in-memory copy if local storage is unavailable.
  }
  return compact;
};

export const writeStorefrontHomeConfig = (config) => {
  const nextConfig = normalizeHomeConfigForLocal(config);
  const updatedAt = new Date().toISOString();
  window.localStorage.setItem(HOME_CONFIG_KEY, JSON.stringify(nextConfig));
  window.localStorage.setItem(`${LOCAL_UPDATED_PREFIX}home-config`, updatedAt);
  markDocumentDirty("home-config");
  dispatchDocumentChange("home-config", nextConfig, updatedAt);
  return nextConfig;
};

export const readStorefrontStats = () => {
  const products = readStorefrontProducts();
  const drafts = products.filter((product) => product.status !== "ready");
  const ready = products.filter((product) => product.status === "ready");
  return {
    catalog: ready.filter((product) => product.inCatalog !== false).length,
    drafts: drafts.length,
    ready: ready.length,
  };
};

const imageDataFingerprint = (source) => {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `image:${source.length}:${hash >>> 0}`;
};

const createPublicStorefrontSnapshot = () => JSON.stringify({
  products: readStorefrontProducts().filter(
    (product) => product.status === "ready" && product.inCatalog !== false,
  ),
  homeConfig: compactHomeConfigForCloud(readStorefrontHomeConfig()),
}, (_key, value) => (
  typeof value === "string" && value.startsWith("data:image/")
    ? imageDataFingerprint(value)
    : value
));

const recordSuccessfulPublication = (documents, updatedAt) => {
  try {
    window.localStorage.setItem(LAST_PUBLISHED_AT_KEY, updatedAt);
    window.localStorage.removeItem(LAST_PUBLISHED_SNAPSHOT_KEY);
    window.localStorage.setItem(LAST_PUBLISHED_SNAPSHOT_KEY, createPublicStorefrontSnapshot());
    Object.keys(documents).forEach((docKey) => {
      window.localStorage.setItem(`${LOCAL_UPDATED_PREFIX}${docKey}`, updatedAt);
      clearDocumentDirty(docKey);
    });
  } catch (error) {
    console.warn("[KALEIDO] storefront publication marker error:", error);
    try {
      window.localStorage.removeItem(LAST_PUBLISHED_SNAPSHOT_KEY);
      Object.keys(documents).forEach(clearDocumentDirty);
    } catch {
      // Supabase already accepted the publication; this local marker is optional.
    }
  }
};

export const isStorefrontPublicationPending = () => {
  const publishedSnapshot = window.localStorage.getItem(LAST_PUBLISHED_SNAPSHOT_KEY);
  if (publishedSnapshot !== null) {
    return publishedSnapshot !== createPublicStorefrontSnapshot();
  }
  return !window.localStorage.getItem(LAST_PUBLISHED_AT_KEY)
    || isDocumentDirty("products")
    || isDocumentDirty("home-config");
};

export const publishStorefront = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !OWNER_KEY) {
    return {
      ok: false,
      reason: "not-configured",
      message: "La connexion Supabase de la boutique n’est pas configurée.",
    };
  }

  const updatedAt = new Date().toISOString();

  try {
    const documents = {
      products: await prepareProductsForPublication(readStorefrontProducts()),
      "home-config": await prepareHomeConfigForPublication(readStorefrontHomeConfig()),
    };

    for (const [docKey, payload] of Object.entries(documents)) {
      const result = await publishDocument({ docKey, payload, updatedAt });
      if (!result.ok) return result;
    }

    recordSuccessfulPublication(documents, updatedAt);
    return { ok: true, updatedAt };
  } catch (error) {
    console.warn("[KALEIDO] storefront publication preparation error:", error);
    return {
      ok: false,
      reason: "preparation",
      message: "Les données de la boutique n’ont pas pu être préparées pour la publication.",
    };
  }
};

export const hydrateStorefrontFromCloud = async ({ force = false } = {}) => {
  if (hydrationPromise) return hydrationPromise;
  if (!SUPABASE_URL || !SUPABASE_KEY || !OWNER_KEY) {
    return { ok: false, reason: "not-configured" };
  }
  if (!force && Date.now() - lastHydratedAt < HYDRATION_TTL_MS) {
    return { ok: true, cached: true, applied: [] };
  }

  hydrationPromise = (async () => {
    try {
      const docKeys = '"products","home-config"';
      const query = `owner_key=eq.${encodeURIComponent(OWNER_KEY)}&doc_key=in.(${docKeys})&select=doc_key,payload,updated_at`;
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?${query}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!response.ok) return { ok: false, reason: `http-${response.status}` };

      const rows = await response.json();
      const applied = [];
      rows.forEach((row) => {
        if (!["products", "home-config"].includes(row.doc_key)) return;
        if (!validCloudPayload(row.doc_key, row.payload)) return;
        const key = documentKey(row.doc_key);
        const hasLocalDocument = window.localStorage.getItem(key) !== null;
        const localPayload = readJson(key, row.doc_key === "products" ? [] : null);
        if (isDocumentDirty(row.doc_key)) return;
        const localUpdatedAt = Date.parse(
          window.localStorage.getItem(`${LOCAL_UPDATED_PREFIX}${row.doc_key}`) || "",
        );
        const cloudUpdatedAt = Date.parse(row.updated_at || "");
        if (hasLocalDocument && !Number.isFinite(localUpdatedAt) && hasMeaningfulData(row.doc_key, localPayload)) {
          window.localStorage.setItem(`${LOCAL_UPDATED_PREFIX}${row.doc_key}`, new Date().toISOString());
          markDocumentDirty(row.doc_key);
          return;
        }
        if (Number.isFinite(localUpdatedAt) && (!Number.isFinite(cloudUpdatedAt) || localUpdatedAt >= cloudUpdatedAt)) {
          return;
        }
        writeHydratedDocument(row.doc_key, row.payload, row.updated_at || new Date().toISOString());
        applied.push(row.doc_key);
      });
      if (
        rows.length > 0
        && !isDocumentDirty("products")
        && !isDocumentDirty("home-config")
      ) {
        const latestCloudUpdate = rows.reduce((latest, row) => {
          const timestamp = Date.parse(row.updated_at || "");
          return Number.isFinite(timestamp) && timestamp > latest ? timestamp : latest;
        }, 0);
        window.localStorage.setItem(
          LAST_PUBLISHED_AT_KEY,
          latestCloudUpdate ? new Date(latestCloudUpdate).toISOString() : new Date().toISOString(),
        );
        window.localStorage.setItem(LAST_PUBLISHED_SNAPSHOT_KEY, createPublicStorefrontSnapshot());
      }
      lastHydratedAt = Date.now();
      return { ok: true, applied };
    } catch {
      return { ok: false, reason: "network" };
    } finally {
      hydrationPromise = null;
    }
  })();

  return hydrationPromise;
};

export const STOREFRONT_PRODUCTS_KEY = PRODUCTS_KEY;
export const STOREFRONT_PRODUCTS_CHANGED_EVENT = PRODUCTS_CHANGED_EVENT;
export const STOREFRONT_HOME_CONFIG_KEY = HOME_CONFIG_KEY;
export const STOREFRONT_HOME_CONFIG_CHANGED_EVENT = HOME_CONFIG_CHANGED_EVENT;
