const PRODUCTS_KEY = "kaleido-storefront-product-drafts";
const HOME_CONFIG_KEY = "kaleido-storefront-home-config";
const TABLE_NAME = "kaleido_storefront_documents";
const OWNER_KEY = import.meta.env.VITE_KALEIDO_USER_KEY || "charles-kaleido-prod";
const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL || "https://kxyspfwdutcddigycqky.supabase.co",
).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || "sb_publishable_8dNyHlIOv21aH-_NLbPhyA_e3Aj1MFg";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

export const readStorefrontProducts = () => readJson(PRODUCTS_KEY, []);

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

export const STOREFRONT_PRODUCTS_KEY = PRODUCTS_KEY;
