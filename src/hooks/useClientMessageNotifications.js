import { useEffect, useMemo, useState } from "react";
import { loadClientMessageCounts } from "../services/clientPortalStore";

const CACHE_KEY = "kaleido_client_message_notifications";

const loadCachedMessages = () => {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}") || {};
  } catch {
    return {};
  }
};

const saveCachedMessages = (messagesByToken) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(messagesByToken || {}));
  } catch {
    // Ignore storage errors; notifications still refresh from Supabase.
  }
};

export default function useClientMessageNotifications(projects = []) {
  const [messagesByToken, setMessagesByToken] = useState(() => loadCachedMessages());

  const tokens = useMemo(() => (
    [...new Set((projects || []).map((project) => project?.clientShareToken).filter(Boolean))]
  ), [projects]);

  useEffect(() => {
    let alive = true;
    let checking = false;

    const checkMessages = async () => {
      if (!tokens.length || checking) return;
      checking = true;
      try {
        const result = await loadClientMessageCounts(tokens);
        if (alive && result?.ok) {
          const nextMessages = result.countsByToken || {};
          setMessagesByToken(nextMessages);
          saveCachedMessages(nextMessages);
        }
      } catch (error) {
        console.warn("[KALEIDO] notifications clients indisponibles:", error);
      } finally {
        checking = false;
      }
    };

    checkMessages();
    const timer = setInterval(checkMessages, 900000);
    const onVisible = () => {
      if (!document.hidden) checkMessages();
    };
    const onFocus = () => checkMessages();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [tokens.join("|")]);

  return useMemo(() => {
    const unreadCountsByProjectId = new Map();

    for (const project of projects || []) {
      const token = project?.clientShareToken;
      if (!token) continue;

      const lastReadTime = Date.parse(project?.clientLastReadAt || 0);
      const count = (messagesByToken[token] || []).filter((createdAt) => (
        Date.parse(createdAt) > lastReadTime
      )).length;

      if (count > 0) {
        unreadCountsByProjectId.set(String(project.id), count);
      }
    }

    return unreadCountsByProjectId;
  }, [messagesByToken, projects]);
}
