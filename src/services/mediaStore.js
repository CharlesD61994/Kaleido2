import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getActiveCloudUserId, hasActiveCloudUser } from "./authStore";

const MEDIA_BUCKET = "kaleido-media";
const MEDIA_UPLOAD_REGISTRY_KEY = "kaleido_media_upload_registry";
let mediaCloudDisabledReason = "";

const openIndexedDb = (dbName, storeName) => {
  let db = null;

  return () => new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB n'est pas disponible dans cet environnement."));
      return;
    }

    if (db) {
      resolve(db);
      return;
    }

    const req = indexedDB.open(dbName, 1);

    req.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    req.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
};

const pdfDb = openIndexedDb("kaleido_pdfs", "pdfs");
const imageDb = openIndexedDb("kaleido_images", "images");

const mediaMemoryCache = {
  pdfs: new Map(),
  images: new Map(),
};

export const getCachedPdf = (id) => (id ? mediaMemoryCache.pdfs.get(id) || null : null);
export const getCachedImage = (id) => (id ? mediaMemoryCache.images.get(id) || null : null);

const getCacheForStore = (storeName) => storeName === "images" ? mediaMemoryCache.images : mediaMemoryCache.pdfs;
const mediaPath = (storeName, id) => `${getActiveCloudUserId()}/${storeName}/${encodeURIComponent(id)}.txt`;
const legacyMediaPath = (storeName, id) => `${storeName}/${encodeURIComponent(id)}.txt`;

const canUseLocalStorage = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
};

const readUploadRegistry = () => {
  if (!canUseLocalStorage()) return {};
  try {
    const raw = localStorage.getItem(MEDIA_UPLOAD_REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeUploadRegistry = (registry) => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(MEDIA_UPLOAD_REGISTRY_KEY, JSON.stringify(registry || {}));
  } catch {
    // Le registre est seulement une optimisation; la sauvegarde locale reste prioritaire.
  }
};

const getRegistryUserKey = () => getActiveCloudUserId() || "legacy";

const getMediaFingerprint = (data) => {
  if (typeof data !== "string") return "";
  const middle = Math.max(0, Math.floor(data.length / 2) - 48);
  return [
    data.length,
    data.slice(0, 96),
    data.slice(middle, middle + 96),
    data.slice(-96),
  ].join(":");
};

const getUploadedMediaFingerprint = (storeName, id) => {
  if (!id) return "";
  const registry = readUploadRegistry();
  return registry?.[getRegistryUserKey()]?.[storeName]?.[id] || "";
};

const hasUploadedMediaId = (storeName, id) => Boolean(getUploadedMediaFingerprint(storeName, id));

const markUploadedMedia = (storeName, id, data) => {
  if (!id || typeof data !== "string") return;
  const registry = readUploadRegistry();
  const userKey = getRegistryUserKey();
  registry[userKey] = registry[userKey] || {};
  registry[userKey][storeName] = registry[userKey][storeName] || {};
  registry[userKey][storeName][id] = getMediaFingerprint(data);
  writeUploadRegistry(registry);
};

const forgetUploadedMedia = (storeName, id) => {
  if (!id) return;
  const registry = readUploadRegistry();
  const userKey = getRegistryUserKey();
  if (registry?.[userKey]?.[storeName]?.[id]) {
    delete registry[userKey][storeName][id];
    writeUploadRegistry(registry);
  }
};

const isMissingStorageObject = (error) => {
  const message = String(error?.message || "").toLowerCase();
  const status = Number(error?.statusCode || error?.status || 0);
  return status === 404
    || status === 400 && (
      message.includes("not found")
      || message.includes("does not exist")
      || message.includes("object not found")
    );
};

const isMissingStorageBucket = (error) => {
  const message = String(error?.message || error?.error || "").toLowerCase();
  const status = Number(error?.statusCode || error?.status || 0);
  return message.includes("bucket not found")
    || message.includes("bucket does not exist")
    || message.includes("the resource was not found")
    || status === 404 && message.includes("bucket");
};

const isMediaNetworkFailure = (error) => {
  const message = String(error?.message || error?.error || error || "").toLowerCase();
  return message.includes("load failed")
    || message.includes("failed to fetch")
    || message.includes("network")
    || message.includes("egress");
};

const disableMediaCloudForSession = (reason) => {
  if (mediaCloudDisabledReason) return;
  mediaCloudDisabledReason = reason || "Supabase Storage indisponible.";
  console.warn("[KALEIDO] media cloud disabled:", mediaCloudDisabledReason);
};

const putIntoStore = async (openDb, storeName, id, data) => {
  const db = await openDb();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put({ id, data });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  getCacheForStore(storeName).set(id, data);
  return true;
};

const putIntoLocalStore = async (openDb, storeName, id, data) => {
  try {
    return await putIntoStore(openDb, storeName, id, data);
  } catch (error) {
    console.error(`[KALEIDO] save ${storeName} local error:`, error);
    return false;
  }
};

const getFromStore = async (openDb, storeName, id) => {
  if (!id) return null;

  const cache = getCacheForStore(storeName);
  if (cache.has(id)) return cache.get(id) || null;

  const db = await openDb();

  return await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => {
      const data = req.result?.data || null;
      if (data) cache.set(id, data);
      resolve(data);
    };
    req.onerror = () => reject(req.error);
  });
};

const deleteFromStore = async (openDb, storeName, id) => {
  if (!id) return false;

  const db = await openDb();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  getCacheForStore(storeName).delete(id);
  forgetUploadedMedia(storeName, id);
  return true;
};

const uploadToCloud = async (storeName, id, data) => {
  if (mediaCloudDisabledReason || !isSupabaseConfigured || !supabase || !hasActiveCloudUser() || !id || typeof data !== "string") return false;

  const fingerprint = getMediaFingerprint(data);
  if (fingerprint && getUploadedMediaFingerprint(storeName, id) === fingerprint) {
    return true;
  }

  try {
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(mediaPath(storeName, id), new Blob([data], { type: "text/plain;charset=utf-8" }), {
        contentType: "text/plain;charset=utf-8",
        upsert: true,
      });

    if (error) {
      if (isMissingStorageBucket(error)) {
        disableMediaCloudForSession(`Bucket Storage "${MEDIA_BUCKET}" introuvable.`);
      } else if (isMediaNetworkFailure(error)) {
        disableMediaCloudForSession("Supabase Storage refuse ou coupe les transferts media pour le moment.");
      } else {
        console.warn("[KALEIDO] media cloud upload error:", error?.message || error);
      }
      return false;
    }

    markUploadedMedia(storeName, id, data);
    return true;
  } catch (error) {
    if (isMediaNetworkFailure(error)) {
      disableMediaCloudForSession("Supabase Storage refuse ou coupe les transferts media pour le moment.");
    } else {
      console.warn("[KALEIDO] media cloud upload exception:", error?.message || error);
    }
    return false;
  }
};

const downloadFromCloud = async (storeName, id) => {
  if (mediaCloudDisabledReason || !isSupabaseConfigured || !supabase || !hasActiveCloudUser() || !id) return null;

  try {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .download(mediaPath(storeName, id));

    if (data && !error) {
      return await data.text();
    }

    if (error && isMissingStorageBucket(error)) {
      disableMediaCloudForSession(`Bucket Storage "${MEDIA_BUCKET}" introuvable.`);
      return null;
    }

    if (error && !isMissingStorageObject(error)) {
      console.warn("[KALEIDO] media cloud download error:", error?.message || error);
    }

    const legacy = await supabase.storage
      .from(MEDIA_BUCKET)
      .download(legacyMediaPath(storeName, id));

    if (legacy.error || !legacy.data) {
      if (legacy.error && isMissingStorageBucket(legacy.error)) {
        disableMediaCloudForSession(`Bucket Storage "${MEDIA_BUCKET}" introuvable.`);
        return null;
      }
      if (legacy.error && !isMissingStorageObject(legacy.error)) {
        console.warn("[KALEIDO] media cloud legacy download error:", legacy.error?.message || legacy.error);
      }
      return null;
    }

    return await legacy.data.text();
  } catch (error) {
    console.warn("[KALEIDO] media cloud download exception:", error?.message || error);
    return null;
  }
};

const loadMedia = async (openDb, storeName, id) => {
  try {
    const localData = await getFromStore(openDb, storeName, id);
    if (typeof localData === "string") return localData;

    const cloudData = await downloadFromCloud(storeName, id);
    if (typeof cloudData === "string") {
      await putIntoLocalStore(openDb, storeName, id, cloudData);
      markUploadedMedia(storeName, id, cloudData);
      return cloudData;
    }

    return null;
  } catch (error) {
    console.error(`[KALEIDO] load ${storeName} error:`, error);
    return null;
  }
};

export const savePdf = async (id, data) => {
  const localSaved = await putIntoLocalStore(pdfDb, "pdfs", id, data);
  if (localSaved) {
    uploadToCloud("pdfs", id, data);
  }
  return localSaved;
};

export const loadPdf = async (id) => loadMedia(pdfDb, "pdfs", id);

export const deletePdf = async (id) => {
  try {
    return await deleteFromStore(pdfDb, "pdfs", id);
  } catch (error) {
    console.error("deletePdf error:", error);
    return false;
  }
};

export const saveImage = async (id, data) => {
  const localSaved = await putIntoLocalStore(imageDb, "images", id, data);
  if (localSaved) {
    uploadToCloud("images", id, data);
  }
  return localSaved;
};

export const loadImage = async (id) => loadMedia(imageDb, "images", id);

export const deleteImage = async (id) => {
  try {
    return await deleteFromStore(imageDb, "images", id);
  } catch (error) {
    console.error("deleteImage error:", error);
    return false;
  }
};

export const syncDatabaseMediaToCloud = async (database = {}) => {
  const allProjects = [...(database.projectsPersonal || []), ...(database.projectsPro || [])];
  const allItems = [...allProjects, ...(database.patrons || [])];
  const pdfIds = new Set();
  const imageIds = new Set();

  for (const item of allItems) {
    if (item?.projectType === "pdf" && item.pdfId) pdfIds.add(item.pdfId);
    if (item?.image?.imageId) imageIds.add(item.image.imageId);
    if (item?.image?.previewId) imageIds.add(item.image.previewId);
  }

  for (const pdfId of pdfIds) {
    if (hasUploadedMediaId("pdfs", pdfId)) continue;
    const data = await getFromStore(pdfDb, "pdfs", pdfId).catch(() => null);
    if (typeof data === "string") await uploadToCloud("pdfs", pdfId, data);
  }

  for (const imageId of imageIds) {
    if (hasUploadedMediaId("images", imageId)) continue;
    const data = await getFromStore(imageDb, "images", imageId).catch(() => null);
    if (typeof data === "string") await uploadToCloud("images", imageId, data);
  }
};
