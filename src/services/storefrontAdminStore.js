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
let hydrationPromise = null;

const readJson = (key, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

export const readStorefrontProducts = () => readJson(PRODUCTS_KEY, []);

export const writeStorefrontProducts = (products) => {
  const nextProducts = Array.isArray(products) ? products : [];
  const updatedAt = new Date().toISOString();
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(nextProducts));
  window.localStorage.setItem("kaleido-storefront-local-updated:products", updatedAt);
  window.dispatchEvent(new CustomEvent(PRODUCTS_CHANGED_EVENT, {
    detail: { products: nextProducts, updatedAt },
  }));
  return nextProducts;
};

export const readStorefrontHomeConfig = () => readJson(HOME_CONFIG_KEY, null);

export const writeStorefrontHomeConfig = (config) => {
  const updatedAt = new Date().toISOString();
  window.localStorage.setItem(HOME_CONFIG_KEY, JSON.stringify(config));
  window.localStorage.setItem("kaleido-storefront-local-updated:home-config", updatedAt);
  window.dispatchEvent(new CustomEvent(HOME_CONFIG_CHANGED_EVENT, {
    detail: { config, updatedAt },
  }));
  return config;
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

  const updatedAt = new Date().toISOString();
  const documents = {
    products: readStorefrontProducts(),
    "home-config": readJson(HOME_CONFIG_KEY, null),
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
      window.localStorage.setItem(`kaleido-storefront-local-updated:${docKey}`, updatedAt);
    });
    return { ok: true, updatedAt };
  } catch {
    return { ok: false, reason: "network" };
  }
};

export const hydrateStorefrontFromCloud = async () => {
  if (hydrationPromise) return hydrationPromise;
  if (!SUPABASE_URL || !SUPABASE_KEY || !OWNER_KEY) {
    return { ok: false, reason: "not-configured" };
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
      rows.forEach((row) => {
        const localUpdatedAt = Date.parse(
          window.localStorage.getItem(`kaleido-storefront-local-updated:${row.doc_key}`) || "",
        );
        const cloudUpdatedAt = Date.parse(row.updated_at || "");
        if (Number.isFinite(localUpdatedAt) && (!Number.isFinite(cloudUpdatedAt) || localUpdatedAt >= cloudUpdatedAt)) {
          return;
        }
        const key = row.doc_key === "products" ? PRODUCTS_KEY : HOME_CONFIG_KEY;
        window.localStorage.setItem(key, JSON.stringify(row.payload));
        window.localStorage.setItem(`kaleido-storefront-local-updated:${row.doc_key}`, row.updated_at);
        if (row.doc_key === "products") {
          window.dispatchEvent(new CustomEvent(PRODUCTS_CHANGED_EVENT, {
            detail: { products: row.payload, updatedAt: row.updated_at },
          }));
        } else {
          window.dispatchEvent(new CustomEvent(HOME_CONFIG_CHANGED_EVENT, {
            detail: { config: row.payload, updatedAt: row.updated_at },
          }));
        }
      });
      return { ok: true };
    } catch {
      return { ok: false, reason: "network" };
    }
  })();

  return hydrationPromise;
};

export const STOREFRONT_PRODUCTS_KEY = PRODUCTS_KEY;
export const STOREFRONT_PRODUCTS_CHANGED_EVENT = PRODUCTS_CHANGED_EVENT;
export const STOREFRONT_HOME_CONFIG_KEY = HOME_CONFIG_KEY;
export const STOREFRONT_HOME_CONFIG_CHANGED_EVENT = HOME_CONFIG_CHANGED_EVENT;
