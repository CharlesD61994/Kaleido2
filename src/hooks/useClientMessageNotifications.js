import { useEffect, useMemo, useRef, useState } from "react";
import { loadClientMessageCounts } from "../services/clientPortalStore";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

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
  const channelIdRef = useRef(`kaleido-client-message-notifications-${Date.now()}-${Math.random().toString(16).slice(2)}`);

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
    const timer = setInterval(checkMessages, 2000);
    let channel = null;

    try {
      channel = isSupabaseConfigured && supabase
        ? supabase
          .channel(`${channelIdRef.current}-${tokens.length}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "kaleido_client_messages",
            },
            (payload) => {
              const token = payload?.new?.share_token || payload?.old?.share_token;
              if (!token || !tokens.includes(token)) {
                checkMessages();
                return;
              }

              if (payload.eventType === "INSERT" && payload?.new?.sender === "client" && payload?.new?.created_at) {
                setMessagesByToken((current) => {
                  const currentMessages = current[token] || [];
                  if (currentMessages.includes(payload.new.created_at)) return current;
                  const nextMessages = {
                    ...current,
                    [token]: [payload.new.created_at, ...currentMessages],
                  };
                  saveCachedMessages(nextMessages);
                  return nextMessages;
                });
              }

              checkMessages();
            }
          )
          .subscribe()
        : null;
    } catch (error) {
      console.warn("[KALEIDO] canal notifications client indisponible:", error);
      channel = null;
    }

    return () => {
      alive = false;
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
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
