import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { syncDatabaseMediaToCloud } from "./mediaStore";
import { getActiveCloudUserId, hasActiveCloudUser } from "./authStore";
// ═══════════════════════════════════════════════════════════════
// DATABASE STORE — persistance centrale Kaleido via localStorage
// ═══════════════════════════════════════════════════════════════

const DB_KEY = "kaleido_database";
const DB_BACKUP_KEY = "kaleido_database_backup";
const DB_META_KEY = "kaleido_database_meta";
const LEGACY_CLOUD_USER_KEY = import.meta.env.VITE_KALEIDO_USER_KEY || "owner";
const CLOUD_TABLE = "kaleido_backups";

const asArray = (value) => (Array.isArray(value) ? value : []);

const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  } catch {
    return false;
  }
};

const safeParseJSON = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const readStorageJSON = (key) => {
  if (!canUseStorage()) return null;
  return safeParseJSON(localStorage.getItem(key));
};

const writeStorageJSON = (key, value) => {
  if (!canUseStorage()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("[KALEIDO] writeStorageJSON error:", error);
    return false;
  }
};

const scopedStorageKey = (key) => {
  const userId = getActiveCloudUserId();
  return userId ? `${key}_${userId}` : key;
};

const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const getDefaultDatabase = () => ({
  projectsPersonal: [
    { id: 1, name: "Écharpe hiver", rang: 42, total: 80, colorIdx: 0, image: null, type: "tricot", laine: "", outil: "", notes: "", parties: [] },
    { id: 2, name: "Tuque Noël", rang: 15, total: 30, colorIdx: 1, image: null, type: "crochet", laine: "", outil: "", notes: "", parties: [] },
    { id: 3, name: "Mitaines bébé", rang: 8, total: 20, colorIdx: 2, image: null, type: "tricot", laine: "", outil: "", notes: "", parties: [] },
  ],
  projectsPro: [],
  patrons: [],
  settings: { lastProjectId: 3, lastPatronId: 0 },
});

const computeLastProjectId = (projectsPersonal, projectsPro, fallback = 0) => {
  const ids = [...asArray(projectsPersonal), ...asArray(projectsPro)]
    .map((project) => Number(project?.id))
    .filter((id) => Number.isFinite(id));
  return Math.max(fallback, 0, ...ids);
};

const computeLastPatronId = (patrons, fallback = 0) => {
  const ids = asArray(patrons)
    .map((patron) => Number(patron?.id))
    .filter((id) => Number.isFinite(id));
  return Math.max(fallback, 0, ...ids);
};

const isLikelyInlineMedia = (value) => {
  if (typeof value !== "string") return false;
  return value.startsWith("data:") || value.length > 1200;
};

const isLightweightPreview = (value) => {
  return typeof value === "string"
    && value.startsWith("data:image/")
    && value.length <= 50000;
};

const cleanImageReference = (image) => {
  if (!image) return null;

  // Ancien format : image directement en base64 dans la base.
  // La migration App.jsx doit déjà l'avoir transférée dans IndexedDB.
  if (typeof image === "string") {
    return isLikelyInlineMedia(image) ? null : image;
  }

  if (!image || typeof image !== "object") return null;

  const clean = {};
  if (image.imageId) clean.imageId = image.imageId;
  if (image.previewId) clean.previewId = image.previewId;
  if (isLightweightPreview(image.preview)) clean.preview = image.preview;
  if (image.pos && typeof image.pos === "object") clean.pos = image.pos;
  if (image.scale != null) clean.scale = image.scale;

  // Garder seulement une petite vignette pour eviter le flash au rechargement.
  // L'image originale reste dans IndexedDB via imageId.
  return clean.imageId ? clean : null;
};

const stripHeavyMediaFields = (item) => {
  if (!item || typeof item !== "object") return item;

  const clean = { ...item };

  clean.image = cleanImageReference(clean.image);

  delete clean.preview;
  delete clean.src;
  delete clean.data;
  delete clean.pdf;
  delete clean.pdfData;
  delete clean.pdfSrc;
  delete clean.pdfBase64;
  delete clean.pdfs;
  delete clean.images;

  return clean;
};

export const normalizeDatabase = (input) => {
  const raw = input?.database && typeof input.database === "object" ? input.database : input;
  const defaults = getDefaultDatabase();

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  // Ancien format éventuel : { projects: [...], settings: {...} }
  const legacyProjects = Array.isArray(raw.projects) ? raw.projects : null;

  const projectsPersonalRaw = Array.isArray(raw.projectsPersonal)
    ? raw.projectsPersonal
    : (legacyProjects || []);

  const projectsProRaw = Array.isArray(raw.projectsPro) ? raw.projectsPro : [];
  const patronsRaw = Array.isArray(raw.patrons) ? raw.patrons : [];

  const projectsPersonal = projectsPersonalRaw.map(stripHeavyMediaFields);
  const projectsPro = projectsProRaw.map(stripHeavyMediaFields);
  const patrons = patronsRaw.map(stripHeavyMediaFields);

  const rawSettings = raw.settings && typeof raw.settings === "object" ? raw.settings : {};
  const lastProjectId = computeLastProjectId(
    projectsPersonal,
    projectsPro,
    toSafeNumber(rawSettings.lastProjectId, 0)
  );
  const lastPatronId = computeLastPatronId(
    patrons,
    toSafeNumber(rawSettings.lastPatronId, 0)
  );

  return {
    projectsPersonal,
    projectsPro,
    patrons,
    settings: {
      ...rawSettings,
      lastProjectId,
      lastPatronId,
    },
  };
};

export const isValidDatabase = (data) => {
  return !!data
    && typeof data === "object"
    && Array.isArray(data.projectsPersonal)
    && Array.isArray(data.projectsPro)
    && Array.isArray(data.patrons)
    && !!data.settings
    && typeof data.settings === "object";
};


const nowIso = () => new Date().toISOString();

const readDatabaseMeta = () => {
  const meta = readStorageJSON(scopedStorageKey(DB_META_KEY));
  return meta && typeof meta === "object" ? meta : {};
};

const writeDatabaseMeta = (meta = {}) => {
  return writeStorageJSON(scopedStorageKey(DB_META_KEY), {
    ...(readDatabaseMeta() || {}),
    ...(meta && typeof meta === "object" ? meta : {}),
  });
};

const getDatabaseTimestamp = (database) => {
  return database?._meta?.updatedAt
    || readDatabaseMeta()?.updatedAt
    || null;
};

const withDatabaseMeta = (database, meta = {}) => {
  const updatedAt = meta.updatedAt || database?._meta?.updatedAt || nowIso();
  const version = Number(meta.version || database?._meta?.version || readDatabaseMeta()?.version || 1);

  return {
    ...(database && typeof database === "object" ? database : {}),
    _meta: {
      ...(database?._meta || {}),
      updatedAt,
      version,
      source: meta.source || database?._meta?.source || "local",
    },
  };
};

const stripRuntimeMeta = (database) => {
  if (!database || typeof database !== "object") return database;
  const clean = { ...database };
  delete clean._meta;
  return clean;
};

const getCloudUserKey = () => getActiveCloudUserId() || LEGACY_CLOUD_USER_KEY;

const isStarterDatabase = (database) => {
  const normalized = normalizeDatabase(database);
  return asArray(normalized.projectsPro).length === 0
    && asArray(normalized.patrons).length === 0
    && asArray(normalized.projectsPersonal).length <= 3
    && asArray(normalized.projectsPersonal).every((project) => [1, 2, 3].includes(Number(project?.id)));
};

const cloudUpsertDatabase = async (database) => {
  if (!isSupabaseConfigured || !supabase || !hasActiveCloudUser()) {
    return { ok: false, reason: "Supabase non configuré." };
  }

  try {
    const normalized = withDatabaseMeta(normalizeDatabase(database), database?._meta || readDatabaseMeta());
    const meta = normalized._meta || {};
    const updatedAt = meta.updatedAt || nowIso();
    const version = Number(meta.version || 1);

    const { error } = await supabase
      .from(CLOUD_TABLE)
      .upsert({
        user_key: getCloudUserKey(),
        database_json: stripRuntimeMeta(normalized),
        version,
        updated_at: updatedAt,
      }, {
        onConflict: "user_key",
      });

    if (error) {
      console.warn("[KALEIDO] cloudUpsertDatabase error:", error);
      return { ok: false, error };
    }

    writeDatabaseMeta({
      updatedAt,
      version,
      lastCloudSyncAt: nowIso(),
      lastCloudError: null,
    });

    return { ok: true };
  } catch (error) {
    console.warn("[KALEIDO] cloudUpsertDatabase exception:", error);
    writeDatabaseMeta({
      lastCloudError: String(error?.message || error),
    });
    return { ok: false, error };
  }
};

export const loadCloudDatabase = async () => {
  if (!isSupabaseConfigured || !supabase || !hasActiveCloudUser()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(CLOUD_TABLE)
      .select("database_json, version, updated_at")
      .eq("user_key", getCloudUserKey())
      .maybeSingle();

    if (error) {
      console.warn("[KALEIDO] loadCloudDatabase error:", error);
      return null;
    }

    if (!data?.database_json) return null;

    return withDatabaseMeta(normalizeDatabase(data.database_json), {
      updatedAt: data.updated_at,
      version: data.version || 1,
      source: "cloud",
    });
  } catch (error) {
    console.warn("[KALEIDO] loadCloudDatabase exception:", error);
    return null;
  }
};

export const getDatabaseCloudFingerprint = (database) => {
  const meta = database?._meta || {};
  return `${meta.version || 0}:${meta.updatedAt || ""}`;
};

export const buildDatabaseFromCloudRow = (row) => {
  if (!row?.database_json) return null;

  return withDatabaseMeta(normalizeDatabase(row.database_json), {
    updatedAt: row.updated_at,
    version: row.version || 1,
    source: "cloud",
  });
};

export const isCloudRowNewerThanLocal = (row) => {
  if (!row?.updated_at) return false;
  const localTime = Date.parse(getDatabaseTimestamp(loadDatabase()) || 0);
  const cloudTime = Date.parse(row.updated_at || 0);
  return cloudTime > localTime || isStarterDatabase(loadDatabase());
};

export const syncDatabaseWithCloud = async (setDatabase) => {
  if (!isSupabaseConfigured || !supabase || !hasActiveCloudUser()) {
    return { ok: false, reason: "Supabase non configuré." };
  }

  const local = loadDatabase();
  const cloud = await loadCloudDatabase();

  if (!cloud) {
    await cloudUpsertDatabase(local);
    syncDatabaseMediaToCloud(local);
    return { ok: true, source: "local-pushed" };
  }

  const localTime = Date.parse(getDatabaseTimestamp(local) || 0);
  const cloudTime = Date.parse(getDatabaseTimestamp(cloud) || 0);

  if (cloudTime > localTime || isStarterDatabase(local)) {
    saveDatabase(cloud, { syncCloud: false, source: "cloud" });
    if (typeof setDatabase === "function") setDatabase(cloud);
    return { ok: true, source: "cloud-pulled" };
  }

  if (localTime >= cloudTime) {
    await cloudUpsertDatabase(local);
    syncDatabaseMediaToCloud(local);
    return { ok: true, source: "local-pushed" };
  }

  return { ok: true, source: "unchanged" };
};


export const saveDatabase = (data, options = {}) => {
  const { syncCloud = true, source = "local" } = options;

  if (!canUseStorage()) return false;

  const currentMeta = readDatabaseMeta();
  const normalized = withDatabaseMeta(normalizeDatabase(data), {
    updatedAt: source === "local" ? nowIso() : (data?._meta?.updatedAt || nowIso()),
    version: Number(currentMeta.version || data?._meta?.version || 1) + (source === "local" ? 1 : 0),
    source,
  });

  const current = readStorageJSON(scopedStorageKey(DB_KEY));
  if (current) {
    writeStorageJSON(scopedStorageKey(DB_BACKUP_KEY), current);
  }

  const saved = writeStorageJSON(scopedStorageKey(DB_KEY), stripRuntimeMeta(normalized));
  writeDatabaseMeta(normalized._meta);

  if (saved && syncCloud) {
    // On ne bloque jamais l'app sur Supabase. LocalStorage reste la source immédiate.
    cloudUpsertDatabase(normalized);
  }

  return saved;
};

export const loadDatabase = () => {
  if (!canUseStorage()) return getDefaultDatabase();

  const meta = readDatabaseMeta();

  const saved = readStorageJSON(scopedStorageKey(DB_KEY)) || readStorageJSON(DB_KEY);
  if (saved) {
    return withDatabaseMeta(normalizeDatabase(saved), {
      ...meta,
      source: "local",
    });
  }

  const backup = readStorageJSON(scopedStorageKey(DB_BACKUP_KEY)) || readStorageJSON(DB_BACKUP_KEY);
  if (backup) {
    return withDatabaseMeta(normalizeDatabase(backup), {
      ...meta,
      source: "backup",
    });
  }

  const defaults = withDatabaseMeta(getDefaultDatabase(), {
    updatedAt: nowIso(),
    version: 1,
    source: "default",
  });

  saveDatabase(defaults, { syncCloud: false, source: "default" });
  return defaults;
};

export const importDatabase = (data) => {
  const normalized = normalizeDatabase(data);
  const saved = saveDatabase(normalized);

  if (!saved) {
    throw new Error("La base restaurée n’a pas pu être sauvegardée dans le navigateur. Le fichier est peut-être encore trop lourd pour Safari.");
  }

  return normalized;
};
