import { useEffect, useRef, useState } from "react";
import {
  flushPendingCloudDatabase,
  getDatabaseCloudFingerprint,
  saveDatabase,
  syncDatabaseWithCloud,
} from "../services/databaseStore";
import { syncDatabaseMediaToCloud } from "../services/mediaStore";
import { isSupabaseConfigured } from "../services/supabaseClient";

export default function useDatabasePersistence(database, databaseRef, setDatabase) {
  const [cloudReady, setCloudReady] = useState(true);
  const skipNextSaveRef = useRef(true);
  const lastAppliedCloudRef = useRef("");
  const lastLocalWriteAtRef = useRef(0);

  useEffect(() => {
    databaseRef.current = database;
  }, [database, databaseRef]);

  useEffect(() => {
    let alive = true;
    let readyTimer = null;

    const bootstrapCloud = async () => {
      if (!isSupabaseConfigured || typeof setDatabase !== "function") {
        if (alive) setCloudReady(true);
        return;
      }

      readyTimer = setTimeout(() => {
        if (alive) setCloudReady(true);
      }, 2500);

      const result = await syncDatabaseWithCloud(setDatabase);

      if (result?.ok) {
        lastAppliedCloudRef.current = getDatabaseCloudFingerprint(databaseRef.current);
        syncDatabaseMediaToCloud(databaseRef.current);
      }

      if (alive) setCloudReady(true);
    };

    bootstrapCloud();
    return () => {
      alive = false;
      if (readyTimer) clearTimeout(readyTimer);
    };
  }, [databaseRef, setDatabase]);

  useEffect(() => {
    if (!cloudReady) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveDatabase(database)) {
      lastLocalWriteAtRef.current = Date.now();
    }
  }, [cloudReady, database]);

  useEffect(() => {
    if (!cloudReady) return undefined;
    let syncing = false;

    const syncNow = async () => {
      if (syncing) return;
      syncing = true;
      try {
        await syncDatabaseWithCloud(setDatabase);
        lastAppliedCloudRef.current = getDatabaseCloudFingerprint(databaseRef.current);
      } finally {
        syncing = false;
      }
    };

    const flushDatabase = () => {
      if (saveDatabase(databaseRef.current)) {
        lastLocalWriteAtRef.current = Date.now();
        flushPendingCloudDatabase();
        syncDatabaseMediaToCloud(databaseRef.current);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDatabase();
      } else {
        syncNow();
      }
    };

    window.addEventListener("pagehide", flushDatabase);
    window.addEventListener("beforeunload", flushDatabase);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", syncNow);

    return () => {
      window.removeEventListener("pagehide", flushDatabase);
      window.removeEventListener("beforeunload", flushDatabase);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", syncNow);
    };
  }, [cloudReady, databaseRef, setDatabase]);

  return { cloudReady };
}
