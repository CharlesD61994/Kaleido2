export const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  } catch (e) {
    return false;
  }
};

export const safeParseJSON = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
};

export const readStorageJSON = (key) => {
  if (!canUseStorage()) return null;
  return safeParseJSON(localStorage.getItem(key));
};

export const writeStorageJSON = (key, value) => {
  if (!canUseStorage()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("[KALEIDO] writeStorageJSON error:", e);
    return false;
  }
};

export const clearStorageKey = (key) => {
  if (!canUseStorage()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn("[KALEIDO] clearStorageKey error:", e);
    return false;
  }
};
