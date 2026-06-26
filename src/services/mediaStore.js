import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getActiveCloudUserId, hasActiveCloudUser } from "./authStore";

const MEDIA_BUCKET = "kaleido-media";

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
  return true;
};

const uploadToCloud = async (storeName, id, data) => {
  if (!isSupabaseConfigured || !supabase || !hasActiveCloudUser() || !id || typeof data !== "string") return false;

  try {
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(mediaPath(storeName, id), new Blob([data], { type: "text/plain;charset=utf-8" }), {
        contentType: "text/plain;charset=utf-8",
        upsert: true,
      });

    if (error) {
      console.warn("[KALEIDO] media cloud upload error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[KALEIDO] media cloud upload exception:", error);
    return false;
  }
};

const downloadFromCloud = async (storeName, id) => {
  if (!isSupabaseConfigured || !supabase || !hasActiveCloudUser() || !id) return null;

  try {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .download(mediaPath(storeName, id));

    if (data && !error) {
      return await data.text();
    }

    const legacy = await supabase.storage
      .from(MEDIA_BUCKET)
      .download(legacyMediaPath(storeName, id));

    if (legacy.error || !legacy.data) {
      if (legacy.error) console.warn("[KALEIDO] media cloud download error:", legacy.error);
      return null;
    }

    return await legacy.data.text();
  } catch (error) {
    console.warn("[KALEIDO] media cloud download exception:", error);
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
  uploadToCloud("pdfs", id, data);
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
  uploadToCloud("images", id, data);
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
    const data = await getFromStore(pdfDb, "pdfs", pdfId).catch(() => null);
    if (typeof data === "string") await uploadToCloud("pdfs", pdfId, data);
  }

  for (const imageId of imageIds) {
    const data = await getFromStore(imageDb, "images", imageId).catch(() => null);
    if (typeof data === "string") await uploadToCloud("images", imageId, data);
  }
};
