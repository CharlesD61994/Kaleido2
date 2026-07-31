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
const HYDRATION_TTL_MS = 15_000;
const DEFAULT_HOME_CONFIG = {
  categories: ["vetements", "peluches", "pantoufles", "porte-cles", "couvertures"],
  customCategories: [],
  categoryColors: {},
  categoryPhotos: {},
  featuredProductIds: [],
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

export const publishStorefront = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || !OWNER_KEY) {
    return { ok: false, reason: "not-configured" };
  }

  const hydration = await hydrateStorefrontFromCloud({ force: true });
  if (!hydration.ok) {
    return { ok: false, reason: `preflight-${hydration.reason}` };
  }

  const updatedAt = new Date().toISOString();
  const documents = {
    products: readStorefrontProducts(),
    "home-config": compactHomeConfigForCloud(readStorefrontHomeConfig()),
  };
  const body = Object.entries(documents).map(([docKey, payload]) => ({
    owner_key: OWNER_KEY,
    doc_key: docKey,
    payload,
    updated_at: updatedAt,
  }));

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
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) return { ok: false, reason: `http-${response.status}` };

    window.localStorage.setItem("kaleido-storefront-last-published-at", updatedAt);
    Object.keys(documents).forEach((docKey) => {
      window.localStorage.setItem(`${LOCAL_UPDATED_PREFIX}${docKey}`, updatedAt);
      clearDocumentDirty(docKey);
    });
    return { ok: true, updatedAt };
  } catch {
    return { ok: false, reason: "network" };
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
