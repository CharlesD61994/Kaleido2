import { useEffect, useRef, useState } from "react";
import {
  buildDatabaseFromCloudRow,
  getDatabaseCloudFingerprint,
  isCloudRowNewerThanLocal,
  loadCloudDatabase,
  saveDatabase,
  syncDatabaseWithCloud,
} from "../services/databaseStore";
import { syncDatabaseMediaToCloud } from "../services/mediaStore";
import { getActiveCloudUserId } from "../services/authStore";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

export default function useDatabasePersistence(database, databaseRef, setDatabase) {
  const [cloudReady, setCloudReady] = useState(!isSupabaseConfigured);
  const skipNextSaveRef = useRef(false);
  const lastAppliedCloudRef = useRef("");

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
    saveDatabase(database);
  }, [cloudReady, database]);

  useEffect(() => {
    if (!cloudReady) return undefined;
    let syncing = false;

    const applyCloudDatabase = (cloudDatabase) => {
      if (!cloudDatabase) return false;
      const fingerprint = getDatabaseCloudFingerprint(cloudDatabase);
      if (!fingerprint || fingerprint === lastAppliedCloudRef.current) return false;

      lastAppliedCloudRef.current = fingerprint;
      skipNextSaveRef.current = true;
      saveDatabase(cloudDatabase, { syncCloud: false, source: "cloud" });
      setDatabase(cloudDatabase);
      return true;
    };

    const pullCloudOnly = async () => {
      const cloudDatabase = await loadCloudDatabase();
      if (!cloudDatabase) return;

      const cloudTime = Date.parse(cloudDatabase?._meta?.updatedAt || 0);
      const localTime = Date.parse(databaseRef.current?._meta?.updatedAt || 0);
      if (cloudTime >= localTime) applyCloudDatabase(cloudDatabase);
    };

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
      saveDatabase(databaseRef.current);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDatabase();
      } else {
        syncNow();
      }
    };

    const syncTimer = setInterval(syncNow, 15000);
    const channel = isSupabaseConfigured && supabase && getActiveCloudUserId()
      ? supabase
        .channel(`kaleido-backups-${getActiveCloudUserId()}-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "kaleido_backups",
            filter: `user_key=eq.${getActiveCloudUserId()}`,
          },
          (payload) => {
            const nextDatabase = buildDatabaseFromCloudRow(payload?.new);
            if (!nextDatabase || !isCloudRowNewerThanLocal(payload?.new)) return;
            applyCloudDatabase(nextDatabase);
          }
        )
        .subscribe()
      : null;
    const pullTimer = setInterval(pullCloudOnly, 2000);

    window.addEventListener("pagehide", flushDatabase);
    window.addEventListener("beforeunload", flushDatabase);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(syncTimer);
      clearInterval(pullTimer);
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener("pagehide", flushDatabase);
      window.removeEventListener("beforeunload", flushDatabase);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cloudReady, databaseRef, setDatabase]);

  return { cloudReady };
}
