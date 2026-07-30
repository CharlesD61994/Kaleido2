(() => {
  const config = window.KALEIDO_STOREFRONT_CONFIG || {};
  const tableName = "kaleido_storefront_documents";
  const publishedAtKey = "kaleido-storefront-last-published-at";
  const localUpdatedPrefix = "kaleido-storefront-local-updated:";

  const normalizeUrl = (value) => String(value || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabaseUrl = normalizeUrl(config.supabaseUrl);
  const anonKey = config.supabaseAnonKey || "";
  const ownerKey = config.ownerKey || "";
  const isConfigured = Boolean(supabaseUrl && anonKey && ownerKey);

  const headers = () => ({
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  });

  const endpoint = (query = "") => `${supabaseUrl}/rest/v1/${tableName}${query}`;

  const readLocalJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const writeLocalJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const markLocalDocumentUpdated = (docKey, updatedAt = new Date().toISOString()) => {
    localStorage.setItem(`${localUpdatedPrefix}${docKey}`, updatedAt);
    return updatedAt;
  };

  const shouldApplyCloudDocument = (docKey, document) => {
    if (!document?.payload) return false;
    const localUpdatedAt = Date.parse(localStorage.getItem(`${localUpdatedPrefix}${docKey}`) || "");
    const cloudUpdatedAt = Date.parse(document.updatedAt || "");
    if (!Number.isFinite(localUpdatedAt)) return true;
    if (!Number.isFinite(cloudUpdatedAt)) return false;
    return cloudUpdatedAt > localUpdatedAt;
  };

  const readDocuments = async (docKeys) => {
    if (!isConfigured) return { ok: false, reason: "not-configured", documents: {} };
    const documentFilter = docKeys.map((key) => `"${String(key).replace(/"/g, "")}"`).join(",");
    const query = `?owner_key=eq.${encodeURIComponent(ownerKey)}&doc_key=in.(${documentFilter})&select=doc_key,payload,updated_at`;
    const response = await fetch(endpoint(query), { headers: headers() });
    if (!response.ok) {
      return { ok: false, reason: `http-${response.status}`, documents: {} };
    }
    const rows = await response.json();
    return {
      ok: true,
      documents: rows.reduce((acc, row) => {
        acc[row.doc_key] = { payload: row.payload, updatedAt: row.updated_at };
        return acc;
      }, {}),
    };
  };

  const publishDocuments = async (documents) => {
    if (!isConfigured) return { ok: false, reason: "not-configured" };
    const now = new Date().toISOString();
    const body = Object.entries(documents).map(([docKey, payload]) => ({
      owner_key: ownerKey,
      doc_key: docKey,
      payload,
      updated_at: now,
    }));
    const response = await fetch(endpoint("?on_conflict=owner_key,doc_key"), {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { ok: false, reason: `http-${response.status}` };
    }
    localStorage.setItem(publishedAtKey, now);
    Object.keys(documents).forEach((docKey) => markLocalDocumentUpdated(docKey, now));
    return { ok: true, updatedAt: now, rows: await response.json() };
  };

  const hydrateLocalFromCloud = async ({ productsKey, homeConfigKey } = {}) => {
    const result = await readDocuments(["products", "home-config"]);
    if (!result.ok) return result;
    const productsDoc = result.documents.products;
    const homeDoc = result.documents["home-config"];
    if (productsKey && shouldApplyCloudDocument("products", productsDoc)) {
      writeLocalJson(productsKey, productsDoc.payload);
      markLocalDocumentUpdated("products", productsDoc.updatedAt);
    }
    if (homeConfigKey && shouldApplyCloudDocument("home-config", homeDoc)) {
      writeLocalJson(homeConfigKey, homeDoc.payload);
      markLocalDocumentUpdated("home-config", homeDoc.updatedAt);
    }
    return result;
  };

  const publishLocalStorefront = async ({ productsKey, homeConfigKey }) => {
    const products = readLocalJson(productsKey, []);
    const homeConfig = readLocalJson(homeConfigKey, null);
    return publishDocuments({
      products,
      "home-config": homeConfig,
    });
  };

  window.KaleidoStorefrontCloud = {
    isConfigured,
    markLocalDocumentUpdated,
    readDocuments,
    publishDocuments,
    hydrateLocalFromCloud,
    publishLocalStorefront,
  };
})();
